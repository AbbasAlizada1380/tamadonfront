import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "use-debounce"; // Import useDebounce
import axios from "axios";
import Swal from "sweetalert2";
import jwt_decode from "jwt-decode";
import CryptoJS from "crypto-js";
import Pagination from "../../../Utilities/Pagination.jsx";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import moment from "moment-jalaali";
import { FaSortAlphaDown, FaSortAlphaUp, FaSearch } from "react-icons/fa";

const ORDERS_API_ENDPOINT = `${BASE_URL}/group/group/orders/status_supper/`;

const OrderListSuperDesigner = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [passedOrder, setPassedOrder] = useState(null);
  const [isViewModelOpen, setIsViewModelOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0); // Total count from API
  const [users, setUsers] = useState([]); // For designer mapping
  const [isEditing, setIsEditing] = useState(false); // Details modal edit state
  const [editingData, setEditingData] = useState({}); // Editing data for modal
  const [pageSize, setPageSize] = useState(20); // Adjusted page size
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for Server-Side Search & Sort ---
  const [sortOrder, setSortOrder] = useState("desc"); // Default sort
  const [searchTerm, setSearchTerm] = useState(""); // Raw search input

  // --- Debounce the search term ---
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  // --- Auth & Token Handling ---
  const secretKey = "TET4-1";
  const decryptData = useCallback((hashedData) => {
    if (!hashedData) {
      return null;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }, []); // secretKey is constant

  const [token, setToken] = useState(() =>
    decryptData(localStorage.getItem("auth_token"))
  );
  const [refreshingToken, setRefreshingToken] = useState(false);

  const isTokenExpired = useCallback((tokenToCheck) => {
    if (!tokenToCheck) return true;
    try {
      const decoded = jwt_decode(tokenToCheck);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (e) {
      console.error("Failed to decode token:", e);
      return true;
    }
  }, []);

  const refreshAuthToken = useCallback(async () => {
    if (refreshingToken) return token;
    const currentRefreshToken = decryptData(
      localStorage.getItem("refresh_token")
    );
    if (!currentRefreshToken) {
      setError("Login session expired.");
      setToken(null);
      return null;
    }
    setRefreshingToken(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/users/user/token/refresh/`,
        { refresh: currentRefreshToken }
      );
      const newAuthToken = response.data.access;
      const encryptedToken = CryptoJS.AES.encrypt(
        JSON.stringify(newAuthToken),
        secretKey
      ).toString();
      localStorage.setItem("auth_token", encryptedToken);
      setToken(newAuthToken);
      setError(null);
      return newAuthToken;
    } catch (error) {
      console.error(
        "Error refreshing token:",
        error.response?.data || error.message
      );
      setError("Session expired. Please log in again.");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      // Also clear other sensitive user data from localStorage if needed
      setToken(null);
      return null;
    } finally {
      setRefreshingToken(false);
    }
  }, [token, refreshingToken, decryptData, secretKey]);

  // --- API Call for Orders (Server-Side Search/Sort) ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    let currentToken = token;

    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        setLoading(false);
        return;
      }
    }

    try {
      const headers = { Authorization: `Bearer ${currentToken}` };
      const params = new URLSearchParams({
        pagenum: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      // Add search parameter if debounced term exists
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      // Add ordering parameter
      const orderingField = "created_at"; // Match backend field
      const backendOrderingParam =
        sortOrder === "asc" ? orderingField : `-${orderingField}`;
      params.append("ordering", backendOrderingParam);

      // Use the specific endpoint for SuperDesigner
      const url = `${ORDERS_API_ENDPOINT}?${params.toString()}`;
      console.log("DEBUG: Fetching SuperDesigner Orders URL:", url); // Debug log

      const response = await axios.get(url, { headers });
      setOrders(response.data.results || []);
      setTotalOrders(response.data.count || 0); // Use totalOrders for consistency
    } catch (error) {
      console.error(
        "Error fetching SuperDesigner orders:",
        error.response?.data || error.message || error
      );
      if (error.response?.status === 401) {
        const refreshed = await refreshAuthToken();
        if (!refreshed) setError("Authentication failed. Please log in again.");
        // Avoid immediate retry here to prevent loops if refresh fails repeatedly
      } else {
        setError("خطا در بارگذاری لیست سفارشات.");
        setOrders([]);
        setTotalOrders(0);
      }
    } finally {
      setLoading(false);
    }
  }, [
    token,
    currentPage,
    pageSize,
    debouncedSearchTerm,
    sortOrder,
    refreshAuthToken,
    isTokenExpired,
  ]); // Dependencies

  // --- API Call for Categories (Keep existing logic with token refresh) ---
  const fetchCategories = useCallback(async () => {
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) return;
    }
    try {
      const headers = { Authorization: `Bearer ${currentToken}` };
      const response = await axios.get(`${BASE_URL}/group/categories/`, {
        headers,
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [token, refreshAuthToken, isTokenExpired]);

  // --- API Call for Users (Keep existing logic with token refresh) ---
  const fetchUsers = useCallback(async () => {
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) return;
    }
    try {
      const headers = { Authorization: `Bearer ${currentToken}` };
      const response = await axios.get(`${BASE_URL}/users/api/users/`, {
        headers,
      }); // Verify endpoint
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [token, refreshAuthToken, isTokenExpired]);

  // --- Event Handlers ---
  const toggleSortOrder = () => {
    setSortOrder((prevSortOrder) => (prevSortOrder === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Page reset handled by useEffect watching debouncedSearchTerm
  };

  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Keep original modal/edit/delete handlers, ensuring token refresh
  const handleShowAttribute = (order) => {
    /* Keep original */
    setPassedOrder(order);
    setIsViewModelOpen(true);
    setIsEditing(false);
    setEditingData({});
  };
  const handleClosePopup = () => {
    /* Keep original */
    setIsViewModelOpen(false);
    setPassedOrder(null);
    setIsEditing(false);
  };
  const handleModalEdit = () => {
    // Renamed from handleEdit
    if (!passedOrder) return;
    setIsEditing(true);
    setEditingData({
      ...passedOrder,
      attributes: { ...(passedOrder.attributes || {}) },
    });
  };
  const handleEditingDataChange = (key, value) => {
    // For modal inputs
    setEditingData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };
  const handleSave = async () => {
    /* Keep original modal save logic, add token refresh */
    if (!editingData || !editingData.id) return;
    setLoading(true);
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        setLoading(false);
        return;
      }
    }
    // Use the specific endpoint for SuperDesigner update (PATCH or PUT)
    const updateUrl = `${ORDERS_API_ENDPOINT}${editingData.id}/`; // Assumes item endpoint follows collection endpoint
    const payload = { attributes: editingData.attributes }; // Or send full editingData if backend expects it
    try {
      const headers = {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      };
      await axios.patch(updateUrl, payload, { headers }); // Use PATCH if suitable
      Swal.fire("بروز شد!", "اطلاعات بروز شد.", "success");
      setIsEditing(false);
      handleClosePopup();
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error("Error updating order:", error.response?.data || error);
      Swal.fire("خطا!", "مشکلی در بروز رسانی رخ داد.", "error");
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    /* Keep original delete logic, add token refresh */
    if (!orderId) return;
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) return;
    }
    const result = await Swal.fire({
      /* ... confirmation ... */ title: "آیا مطمئن هستید؟",
      text: "این عمل قابل بازگشت نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن!",
      cancelButtonText: "لغو",
    });
    if (result.isConfirmed) {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${currentToken}` };
        // Use the specific SuperDesigner endpoint for DELETE
        await axios.delete(`${ORDERS_API_ENDPOINT}${orderId}/`, { headers });
        Swal.fire("حذف شد!", "سفارش حذف گردید.", "success");
        if (orders.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchOrders();
        }
      } catch (error) {
        console.error("Error deleting order:", error.response || error);
        Swal.fire("خطا!", "مشکلی در حذف سفارش پیش آمد.", "error");
        setLoading(false);
      }
    }
  };

  // --- useEffect Hooks ---
  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, [fetchCategories, fetchUsers]);

  // Fetch orders whenever dependencies change
  useEffect(() => {
    if (token !== undefined) {
      // Avoid initial fetch with undefined token
      fetchOrders();
    }
  }, [fetchOrders]); // fetchOrders callback dependency includes token and other factors

  // Reset page on search change
  useEffect(() => {
    if (debouncedSearchTerm !== undefined && currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  // --- Helper Functions (Keep original) ---
  const formatDate = (date) => {
    if (!date) return "N/A";
    return moment(date).isValid()
      ? moment(date).format("jYYYY/jMM/jDD")
      : "تاریخ نامعتبر";
  };
  const getDesignerName = (designerDetailsOrId) => {
    // Adjusted to handle potential ID or details object
    if (!designerDetailsOrId)
      return <span className="text-gray-400 italic">نامشخص</span>;

    // If it's an object with details (preferred)
    if (
      typeof designerDetailsOrId === "object" &&
      designerDetailsOrId !== null &&
      designerDetailsOrId.id
    ) {
      const name = designerDetailsOrId.full_name?.trim();
      return (
        name ||
        designerDetailsOrId.email || (
          <span className="text-gray-400 italic">
            ID: {designerDetailsOrId.id}
          </span>
        )
      );
    }
    // If it's just an ID (fallback, requires users array to be loaded)
    if (
      typeof designerDetailsOrId === "number" ||
      typeof designerDetailsOrId === "string"
    ) {
      const user = users.find(
        (u) => u.id === parseInt(designerDetailsOrId, 10)
      ); // Find user by ID
      if (user) {
        const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        return (
          name ||
          user.email || (
            <span className="text-gray-400 italic">
              ID: {designerDetailsOrId}
            </span>
          )
        );
      }
    }
    return <span className="text-gray-400 italic">نامشخص</span>;
  };

  // --- JSX Render (Original Styling) ---
  return (
    // Original outer div
    <div className="w-[400px] md:w-[700px]  mt-10 lg:w-[90%] mx-auto  lg:overflow-hidden">
      {/* Original Header */}
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات سوپر دیزاینر
      </h2>

      {error && (
        <div className="text-center text-red-600 bg-red-100 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Original Controls Container */}
      <div className="flex items-center justify-between mb-4">
        {/* Original Search Input */}
        <div className="flex items-center gap-x-3 flex-grow mr-4">
          {" "}
          {/* Added flex-grow and margin */}
          <label
            htmlFor="customerSearch"
            className="block text-sm font-semibold whitespace-nowrap"
          >
            جستجوی مشتری:
          </label>
          <input
            type="text"
            id="customerSearch"
            placeholder="جستجو..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" // Added w-full
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="focus:outline-none secondry-btn"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Original Sort Button */}
        {/* <button
          onClick={toggleSortOrder}
          className="flex items-center gap-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-100 focus:outline-none" // Adjusted hover color
        >
          مرتب‌سازی بر اساس تاریخ
          {sortOrder === "asc" ? (
            <FaSortAlphaUp className="w-4 h-4" />
          ) : (
            <FaSortAlphaDown className="w-4 h-4" />
          )}
        </button> */}
      </div>

      {/* Original Table Wrapper */}
      <center className="relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-10 rounded-lg">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <span className="text-gray-600">در حال بارگذاری...</span>
            <style jsx>{`
              .loader {
                border-top-color: #3b82f6;
                animation: spinner 1.2s linear infinite;
              }
              @keyframes spinner {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        )}
        <div
          className={`overflow-x-scroll lg:overflow-hidden bg-white w-full rounded-lg md:w-full ${
            loading ? "opacity-30" : ""
          }`}
        >
          {/* Original Table Structure */}
          <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
            <thead className="">
              <tr className="bg-green text-gray-100 text-center">
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  نام مشتری
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  نام سفارش
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  دسته‌بندی
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  طراح
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  حالت
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  تاریخ ایجاد
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  جزئیات
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && orders.length > 0
                ? orders.map((order) => (
                    <tr
                      key={order.id}
                      className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                    >
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {order.customer_name}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {order.order_name}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {categories.find(
                          (category) => category.id === order.category
                        )?.name || "دسته‌بندی نامشخص"}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {/* Use updated helper function */}
                        {getDesignerName(
                          order.designer_details || order.designer
                        )}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {order.status}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {/* Original Buttons */}
                        <button
                          onClick={() => handleShowAttribute(order)}
                          className="secondry-btn mr-2"
                        >
                          نمایش
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className=" bg-red-600 text-sm text-white py-2 px-5 rounded-lg hover:!scale-105 duration-300"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                : !loading && (
                    <tr>
                      {/* Adjusted colspan to match headers */}
                      <td
                        colSpan="7"
                        className="border p-4 text-center text-gray-500"
                      >
                        {searchTerm
                          ? "هیچ سفارشی مطابق با جستجوی شما یافت نشد."
                          : "هیچ سفارشی برای نمایش وجود ندارد."}
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalOrders > pageSize && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalOrders={totalOrders} // Use total from API
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </center>

      {/* Removed unused Price Modal */}
      {/* {showModal && ( ... )} */}

      {/* Original Details/Edit Modal */}
      {isViewModelOpen && passedOrder && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              {isEditing ? "ویرایش جزئیات سفارش" : "جزئیات سفارش"}
            </h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-4 text-sm">
              {/* Display non-attribute fields if needed */}
              {/* ... */}

              <h4 className="font-semibold text-gray-700 mb-2">ویژگی‌ها:</h4>
              {passedOrder.attributes &&
              typeof passedOrder.attributes === "object" &&
              Object.keys(passedOrder.attributes).length > 0 ? (
                Object.entries(passedOrder.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center border-b border-gray-200 pb-2 min-h-[36px]"
                  >
                    <span className="font-medium text-gray-600 w-1/3">
                      {key}:
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.attributes?.[key] ?? ""}
                        onChange={(e) =>
                          handleEditingDataChange(key, e.target.value)
                        }
                        className="border rounded p-1 text-gray-900 w-2/3 text-right text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-gray-900 w-2/3 text-right">
                        {String(value)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">
                  ویژگی اضافی ثبت نشده است.
                </p>
              )}
            </div>

            {/* Original Modal Buttons */}
            <div className="flex gap-x-5 justify-center mt-4 pt-4 border-t">
              <button
                onClick={handleClosePopup}
                className="bg-red-600 text-sm text-white py-2 px-5 rounded-lg hover:!scale-105 duration-300 hover:bg-red-700"
              >
                بستن
              </button>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`secondry-btn ${
                    loading ? "opacity-50 cursor-wait" : ""
                  }`}
                >
                  {loading ? "در حال ذخیره..." : "ذخیره"}
                </button>
              ) : (
                // Adjusted Edit button class to match original style if 'bg-update' was intended to be 'secondry-btn' or similar
                <button onClick={handleModalEdit} className="secondry-btn">
                  {" "}
                  {/* Or bg-yellow-500 etc. if intended */}
                  ویرایش
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Removed global style block */}
    </div>
  );
};

export default OrderListSuperDesigner;
