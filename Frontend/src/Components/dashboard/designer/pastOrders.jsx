import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "use-debounce"; // Import useDebounce
import axios from "axios";
import Swal from "sweetalert2";
import jwt_decode from "jwt-decode";
import CryptoJS from "crypto-js";
import Pagination from "../../../Utilities/Pagination.jsx"; // Verify path
const BASE_URL = import.meta.env.VITE_BASE_URL;
import moment from "moment-jalaali";
import { FaSortAlphaDown, FaSortAlphaUp, FaSearch } from "react-icons/fa"; // Keep sort icons if button might return

// Define the base endpoint for ALL past orders (not just today)
// Ensure this backend endpoint supports search and ordering filters
const ORDERS_API_ENDPOINT = `${BASE_URL}/group/orders/`; // Should point to the general orders list

const PastOrders = () => {
  // --- State Variables ---
  const [orders, setOrders] = useState([]); // Data from API
  const [currentPage, setCurrentPage] = useState(1);
  const [passedOrder, setPassedOrder] = useState(null); // For the details view modal
  const [isViewModelOpen, setIsViewModelOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0); // Total count from API for pagination
  const [users, setUsers] = useState([]); // Assuming this is needed for designer info mapping
  const [isEditing, setIsEditing] = useState(false); // For the details view modal edit state
  const [editingData, setEditingData] = useState({}); // For editing attributes in modal
  const pageSize = 20; // Items per page
  const [loading, setLoading] = useState(true); // Loading state for API calls
  const [error, setError] = useState(null); // Error state

  // --- State for Server-Side Search & Sort ---
  const [sortOrder, setSortOrder] = useState("desc"); // Default sort order ('asc' or 'desc')
  const [searchTerm, setSearchTerm] = useState(""); // Raw search input for table

  // --- Debounce the search term ---
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounce input by 500ms

  // --- Auth & Token Handling ---
  const secretKey = "TET4-1"; // Consider environment variable
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

  // Function to check if token is expired
  const isTokenExpired = useCallback((tokenToCheck) => {
    if (!tokenToCheck) return true;
    try {
      const decoded = jwt_decode(tokenToCheck);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (e) {
      console.error("Failed to decode token:", e);
      return true;
    } // Treat as expired if decode fails
  }, []);

  // Function to refresh token using the refresh token
  const refreshAuthToken = useCallback(async () => {
    if (refreshingToken) return token; // Return current token if already refreshing

    const currentRefreshToken = decryptData(
      localStorage.getItem("refresh_token")
    );
    if (!currentRefreshToken) {
      console.error("No refresh token found.");
      setError("Login session expired. Please log in again."); // Inform user
      setToken(null); // Clear potentially invalid token state
      return null;
    }

    setRefreshingToken(true);
    console.log("Attempting to refresh token...");
    try {
      const response = await axios.post(
        `${BASE_URL}/users/user/token/refresh/`, // Verify endpoint
        { refresh: currentRefreshToken }
      );
      const newAuthToken = response.data.access;
      // Encrypt before storing
      const encryptedToken = CryptoJS.AES.encrypt(
        JSON.stringify(newAuthToken),
        secretKey
      ).toString();
      localStorage.setItem("auth_token", encryptedToken);
      setToken(newAuthToken); // Update state with the new *decrypted* token for immediate use
      console.log("Token refreshed successfully.");
      setError(null); // Clear previous errors
      return newAuthToken;
    } catch (error) {
      console.error(
        "Error refreshing token:",
        error.response?.data || error.message
      );
      setError("Session expired. Please log in again."); // Inform user
      // Clear tokens and redirect to login might be appropriate here
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("id");
      localStorage.removeItem("email");
      setToken(null);
      // Example redirect: window.location.href = '/login';
      return null;
    } finally {
      setRefreshingToken(false);
    }
  }, [token, refreshingToken, decryptData, secretKey]); // Added dependencies

  // --- API Call for Orders (Server-Side Search/Sort) ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    let currentToken = token;

    // Check token validity before request
    if (!currentToken || isTokenExpired(currentToken)) {
      console.log("Token missing or expired, attempting refresh...");
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        console.error("Token refresh failed or no token available.");
        setLoading(false);
        return; // Stop fetching if no valid token
      }
    }

    try {
      const headers = { Authorization: `Bearer ${currentToken}` };
      const params = new URLSearchParams({
        pagenum: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      const orderingField = "created_at"; // Match backend field name
      const backendOrderingParam =
        sortOrder === "asc" ? orderingField : `-${orderingField}`;
      params.append("ordering", backendOrderingParam);

      const url = `${ORDERS_API_ENDPOINT}?${params.toString()}`;
      console.log("DEBUG: Fetching Past Orders URL:", url); // Debug log

      const response = await axios.get(url, { headers });
      setOrders(response.data.results || []);
      setTotalOrders(response.data.count || 0);
    } catch (error) {
      console.error(
        "Error fetching past orders:",
        error.response?.data || error.message || error
      );
      if (error.response?.status === 401) {
        // Specific handling for unauthorized
        console.log(
          "Unauthorized (401) error during fetch, attempting refresh..."
        );
        const refreshed = await refreshAuthToken(); // Try refresh again
        if (refreshed) {
          // Automatically retry the fetch ONLY if refresh was successful
          // Be cautious with recursive calls, ensure base cases are handled
          console.log("Retrying fetchOrders after successful refresh.");
          // Directly calling fetchOrders() here might cause infinite loop if refresh keeps failing
          // It's often better to let the user retry or handle the state update triggering a re-render
          // For simplicity here, we'll just log. A more robust solution might use a retry counter.
          // fetchOrders(); // Consider implications carefully before uncommenting
        } else {
          // Error state already set by refreshAuthToken
          setError("Authentication failed. Please log in again.");
        }
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

  // --- API Call for Categories ---
  const fetchCategories = useCallback(async () => {
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) return;
    }
    try {
      const headers = { Authorization: `Bearer ${currentToken}` }; // Add if endpoint requires auth
      const response = await axios.get(`${BASE_URL}/group/categories/`, {
        headers,
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [token, refreshAuthToken, isTokenExpired]); // Dependencies

  // --- API Call for Users ---
  const fetchUsers = useCallback(async () => {
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) return;
    }
    try {
      const headers = { Authorization: `Bearer ${currentToken}` }; // Add if endpoint requires auth
      const response = await axios.get(`${BASE_URL}/users/api/users/`, {
        headers,
      }); // Verify endpoint
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [token, refreshAuthToken, isTokenExpired]); // Dependencies

  // --- Event Handlers ---
  const toggleSortOrder = () => {
    setSortOrder((prevSortOrder) => (prevSortOrder === "asc" ? "desc" : "asc"));
    setCurrentPage(1); // Reset page when sort changes
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Page reset handled by useEffect watching debouncedSearchTerm
  };

  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleShowAttribute = (order) => {
    setPassedOrder(order);
    setIsViewModelOpen(true);
    setIsEditing(false); // Ensure modal opens in view mode
    setEditingData({}); // Clear previous edits
  };
  const handleClosePopup = () => {
    setIsViewModelOpen(false);
    setPassedOrder(null);
    setIsEditing(false);
  };
  const handleModalEdit = () => {
    // Renamed from handleEdit to avoid conflict
    if (!passedOrder) return;
    setIsEditing(true);
    // Deep copy attributes for editing isolation
    setEditingData({
      ...passedOrder,
      attributes: { ...(passedOrder.attributes || {}) },
    });
  };
  const handleEditingDataChange = (key, value) => {
    // Handler for modal input changes
    setEditingData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value,
      },
    }));
  };
  const handleSave = async () => {
    // Handler for modal save button
    if (!editingData || !editingData.id) return;
    setLoading(true); // Show loading during save
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        setLoading(false);
        return;
      }
    }
    // Prepare payload - only send attributes or necessary fields for update
    const payload = { attributes: editingData.attributes };
    try {
      const headers = {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      };
      // Use PATCH for partial update if supported by backend
      await axios.patch(`${ORDERS_API_ENDPOINT}${editingData.id}/`, payload, {
        headers,
      });
      Swal.fire("بروز شد!", "اطلاعات بروز شد.", "success");
      setIsEditing(false); // Exit edit mode
      handleClosePopup(); // Close modal
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error("Error updating order:", error.response?.data || error);
      Swal.fire("خطا!", "مشکلی در بروز رسانی رخ داد.", "error");
      setLoading(false); // Stop loading on error
    }
  };

  // --- useEffect Hooks ---
  // Initial data fetch for categories and users
  useEffect(() => {
    fetchCategories();
    fetchUsers();
    // fetchOrders will be called by the next effect after token state is potentially updated
  }, [fetchCategories, fetchUsers]);

  // Fetch orders whenever relevant dependencies change
  useEffect(() => {
    // Only fetch if token is potentially valid or after initial state is set
    if (token !== undefined) {
      // Avoid fetching with initial undefined token state if applicable
      fetchOrders();
    }
  }, [fetchOrders]); // fetchOrders callback dependency includes token and other factors

  // Reset page to 1 when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined && currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]); // Only depends on the debounced term

  // --- Deletion Logic ---
  const handleDelete = async (orderId) => {
    if (!orderId) return;
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) return;
    }

    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
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
        await axios.delete(`${ORDERS_API_ENDPOINT}${orderId}/`, { headers });
        Swal.fire("حذف شد!", "سفارش حذف گردید.", "success");
        // Smart pagination adjustment
        if (orders.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1); // Trigger fetch via useEffect
        } else {
          fetchOrders(); // Refetch current page
        }
      } catch (error) {
        console.error("Error deleting order:", error.response || error);
        Swal.fire("خطا!", "مشکلی در حذف سفارش پیش آمد.", "error");
        setLoading(false); // Stop loading on error
      }
      // Loading stopped by fetchOrders on success case
    }
  };

  // --- Helper Functions ---
  const formatDate = (date) => {
    if (!date) return "N/A";
    return moment(date).isValid()
      ? moment(date).format("jYYYY/jMM/jDD")
      : "تاریخ نامعتبر";
  };
  const getDesignerName = (designerDetails) => {
    if (!designerDetails)
      return <span className="text-gray-400 italic">نامشخص</span>;
    const name = designerDetails.full_name?.trim();
    // Fallback to email if name is empty or just whitespace
    return (
      name ||
      designerDetails.email || (
        <span className="text-gray-400 italic">نامشخص</span>
      )
    );
  };

  // --- JSX Render (Original Styling) ---
  return (
    <div className="w-[400px] md:w-[700px] mt-10 lg:w-[90%] mx-auto lg:overflow-hidden">
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات
      </h2>

      {error && (
        <div className="text-center text-red-600 bg-red-100 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Controls Container */}
      <div className="flex items-center justify-between mb-4">
        {/* Search Input */}
        <div className="flex items-center gap-x-3">
          <label
            htmlFor="customerSearch"
            className="block text-sm font-semibold"
          >
            جستجوی مشتری:
          </label>
          <input
            type="text"
            id="customerSearch" // Keep original ID
            placeholder="جستجو..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border rounded-md w-56 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" // Original class
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
      </div>

      {/* Table Wrapper */}
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
          {/* Table */}
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
                        {getDesignerName(order.designer_details)}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        <button
                          onClick={() => handleShowAttribute(order)}
                          className="secondry-btn mr-2"
                        >
                          نمایش
                        </button>{" "}
                        {/* Added mr-2 */}
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
                      <td
                        colSpan="6"
                        className="border p-4 text-center text-gray-500"
                      >
                        {" "}
                        {/* Adjusted colspan */}
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
            {" "}
            {/* Added margin top */}
            <Pagination
              currentPage={currentPage}
              totalOrders={totalOrders} // Use total from API
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </center>

      {/* Modal for Viewing/Editing Attributes */}
      {isViewModelOpen && passedOrder && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              {isEditing ? "ویرایش جزئیات سفارش" : "جزئیات سفارش"}
              {/* Optionally display Order ID or Name */}
              {/* <span className="text-sm font-normal text-gray-600 ml-2">({passedOrder.order_name})</span> */}
            </h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-4 text-sm">
              {/* Display non-attribute fields if desired */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-600 w-1/3">
                  نام مشتری:
                </span>
                <span className="text-gray-900 w-2/3 text-right">
                  {passedOrder.customer_name}
                </span>
              </div>
              {/* ... other fixed fields ... */}

              <hr className="my-3" />
              <h4 className="font-semibold text-gray-700 mb-2">ویژگی‌ها:</h4>
              {passedOrder.attributes &&
              typeof passedOrder.attributes === "object" &&
              Object.keys(passedOrder.attributes).length > 0 ? (
                Object.entries(passedOrder.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center border-b border-gray-200 pb-2 min-h-[36px]"
                  >
                    {" "}
                    {/* Added min-height */}
                    <span className="font-medium text-gray-600 w-1/3">
                      {key}:
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.attributes?.[key] ?? ""} // Use editingData, handle undefined
                        onChange={(e) =>
                          handleEditingDataChange(key, e.target.value)
                        }
                        className="border rounded p-1 text-gray-900 w-2/3 text-right text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Basic input style
                      />
                    ) : (
                      <span className="text-gray-900 w-2/3 text-right">
                        {String(value)}
                      </span> // Ensure value is string
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">
                  ویژگی اضافی ثبت نشده است.
                </p>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-x-4 justify-center mt-4 pt-4 border-t">
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
                <button onClick={handleModalEdit} className="secondry-btn">
                  ویرایش
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastOrders;
