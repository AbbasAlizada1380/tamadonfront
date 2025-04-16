import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jwt_decode from "jwt-decode";
import CryptoJS from "crypto-js";
import Pagination from "../../../Utilities/Pagination.jsx";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import moment from "moment-jalaali";
import { FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";

const PastOrders = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [passedOrder, setPassedOrder] = useState([]);
  const [isViewModelOpen, setIsViewModelOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [totalOrders, setTotalOrders] = useState(null);
  const [totalCount, setTotalCount] = useState(null);
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({});
  const pageSize = 20;

  // New state variables
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]); // Orders after filtering/searching/sorting
  const [selectedAttribute, setSelectedAttribute] = useState(null);

  const secretKey = "TET4-1"; // Use a strong secret key
  const decryptData = (hashedData) => {
    if (!hashedData) {
      console.error("No data to decrypt");
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
  };
  const [modalData, setModalData] = useState({
    receive_price: "",
    total_price: "",
    reminder_price: "",
    deliveryDate: "",
    order: selectedOrder,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [id, setId] = useState(decryptData(localStorage.getItem("id")));
  const [token, setToken] = useState(
    decryptData(localStorage.getItem("auth_token"))
  );
  const [refreshingToken, setRefreshingToken] = useState(false); // Prevent multiple refresh requests

  // Function to get JWT token from localStorage
  const getAuthToken = () => {
    return decryptData(localStorage.getItem("auth_token"));
  };

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  };

  // Function to refresh token using the refresh token
  const refreshAuthToken = async () => {
    if (refreshingToken) return; // Prevent multiple refresh requests

    setRefreshingToken(true);
    try {
      const refreshToken = decryptData(localStorage.getItem("refresh_token"));
      const response = await axios.post(
        `${BASE_URL}/users/user/token/refresh/`,
        { refresh: refreshToken }
      );
      const newAuthToken = response.data.access;
      decryptData(localStorage.setItem("auth_token", newAuthToken));
      setToken(newAuthToken);
      return newAuthToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      setError("Error refreshing token");
      return null;
    } finally {
      setRefreshingToken(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) {
      setError("No authentication token found.");
      return;
    }

    if (isTokenExpired(token)) {
      const newToken = await refreshAuthToken();
      if (!newToken) {
        setError("Unable to refresh token");
        return;
      }
    }

    try {
      let url = `${BASE_URL}/group/orders/?pagenum=${currentPage}`;
      const params = new URLSearchParams();
      if (filterDate) {
        const formattedDate = moment(filterDate).format("YYYY-MM-DD");
        params.append("created_at", formattedDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.results);
      setTotalOrders(response.data.count);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Error fetching orders.");
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (order) => {
    setIsEditing(true);
    setEditingData(order);
  };

  const handleSave = async () => {
    const { id, attributes } = editingData;
    try {
      const response = await axios.put(
        `${BASE_URL}/group/orders/${id}/`,
        editingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Optionally, update the local state or refresh data
      setIsEditing(false);
      handleClosePopup();

      // Show success notification with Swal
      Swal.fire({
        icon: "success",
        title: "بروز رسانی موفق",
        text: "اطلاعات با موفقیت بروز شد.",
        confirmButtonText: "باشه",
      });
    } catch (error) {
      console.error("Error updating data:", error);

      // Show error notification with Swal
      Swal.fire({
        icon: "error",
        title: "خطا در بروز رسانی",
        text: "مشکلی در بروز رسانی اطلاعات رخ داده است.",
        confirmButtonText: "تلاش مجدد",
      });
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    if (!token) {
      setError("No authentication token found.");
      return;
    }

    if (isTokenExpired(token)) {
      const newToken = await refreshAuthToken();
      if (!newToken) {
        setError("Unable to refresh token");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/group/categories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const categoriesData = await response.json();
      setCategories(categoriesData);
    } catch (error) {
      setError("Error fetching categories");
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/api/users`);
      setUsers(response.data);
    } catch (error) {
      setError("Error fetching categories");
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };
  // Function to handle date filter change
  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prevSortOrder) => (prevSortOrder === "asc" ? "desc" : "asc"));
  };

  const sortOrders = (ordersToSort, sortDirection) => {
    // Create a copy to avoid mutating the original array
    const sortedOrders = [...ordersToSort];

    sortedOrders.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);

      if (sortDirection === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    return sortedOrders;
  };

  // Apply sorting, filtering, and searching
  useEffect(() => {
    let results = [...orders]; // Start with all orders (copy to avoid mutation)

    // 1. Date Filter
    if (filterDate) {
      // Convert to Jalali and compare
      const formattedDate = moment(filterDate).format("jYYYY-jMM-jDD");
      results = results.filter((order) => {
        const orderDateJalaali = moment(order.created_at).format(
          "jYYYY-jMM-jDD"
        );
        return orderDateJalaali === formattedDate;
      });
    }

    // 2. Search Filter
    if (searchTerm) {
      results = results.filter((order) => {
        const customerName = order.customer_name || "";
        const orderName = order.order_name || "";
        const categoryName =
          categories.find((category) => category.id === order.category)?.name ||
          "";

        return (
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          orderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoryName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // 3. Sorting
    results = sortOrders(results, sortOrder);
    setFilteredOrders(results);
  }, [orders, filterDate, searchTerm, sortOrder, categories]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  // Fetch orders and categories on mount
  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, [token]); // Dependency array now includes token to refetch when token changes

  // Handle delete button click
  const handleDelete = async (orderId) => {
    let token = decryptData(localStorage.getItem("auth_token"));

    if (!token) {
      setError("No authentication token found.");
      return;
    }

    if (isTokenExpired(token)) {
      token = await refreshAuthToken();
      if (!token) {
        setError("Unable to refresh token");
        return;
      }
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "پس از حذف، این سفارش قابل بازیابی نخواهد بود!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود",
      cancelButtonText: "لغو",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.delete(
        `${BASE_URL}/group/orders/${orderId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Order deleted:", response.data);
      setOrders(orders.filter((order) => order.id !== orderId)); // Remove deleted order
      // Show success message
      Swal.fire({
        title: "حذف شد!",
        text: "سفارش مورد نظر با موفقیت حذف گردید.",
        icon: "success",
        confirmButtonText: "باشه",
      });
    } catch (error) {
      console.error("Error deleting order:", error);

      // Show error message
      Swal.fire({
        title: "خطا!",
        text: "حذف سفارش با مشکل مواجه شد. لطفاً دوباره امتحان کنید.",
        icon: "error",
        confirmButtonText: "متوجه شدم",
      });
    }
  };

  // Handle input change in the modal
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle form submission in modal (update order)

  const handleModalSubmit = async () => {
    const updatedOrder = {
      price: modalData.total_price || null,
      receive_price: modalData.receive_price || null,
      delivery_date: modalData.deliveryDate || null,
      order: selectedOrder || null,
    };

    try {
      let token = getAuthToken();
      if (!token) {
        throw new Error("توکن احراز هویت وجود ندارد.");
      }

      if (isTokenExpired(token)) {
        token = await refreshAuthToken();
        if (!token) {
          throw new Error("بروز رسانی توکن با شکست مواجه شد.");
        }
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Update order status
      await axios.post(
        `${BASE_URL}/group/update-order-status/`,
        { order_id: selectedOrder, status: "taken" },
        { headers }
      );

      // Update the order details
      await axios.post(`${BASE_URL}/group/reception-orders/`, updatedOrder, {
        headers,
      });

      // Close the modal and update orders list
      setShowModal(false);
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== selectedOrder)
      );

      // Success message
      Swal.fire({
        icon: "success",
        title: "قیمت با موفقیت ثبت شد",
        text: "سفارش با موفقیت بروزرسانی شد.",
        confirmButtonText: "تایید",
      });

      console.log("Order updated successfully.");
    } catch (error) {
      console.error("Error updating the order:", error);

      let errorMessage = "خطا در به‌روزرسانی سفارش. لطفاً دوباره تلاش کنید.";

      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = "شما اجازه ویرایش این سفارش را ندارید.";
        } else {
          errorMessage = `به‌روزرسانی سفارش ناموفق بود. سرور پاسخ داد: ${
            error.response.data.message || error.response.status
          }`;
        }
      }

      // Error message
      Swal.fire({
        icon: "error",
        title: "خطا در ثبت قیمت",
        text: errorMessage,
        confirmButtonText: "متوجه شدم",
      });
    }
  };

  const handleShowAttribute = (order) => {
    setPassedOrder(order);
    // Convert JSON object to an array
    const attributeArray = Object.entries(order.attributes); // Converts to array of [key, value] pairs
    setIsViewModelOpen(!isViewModelOpen);
    // Update state
    setSelectedAttribute(order);
  };

  const handleClosePopup = () => {
    setIsViewModelOpen(false);
  };
  //  pagination section

  // Format date in Jalaali calendar
  const formatDate = (date) => {
    if (!date) return "N/A"; // Handle cases where the date is null/undefined
    return moment(date).format("jYYYY/jMM/jDD");
  };

  // Calculate pagination

  // Function to handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="w-[400px] md:w-[700px]  mt-10 lg:w-[90%] mx-auto  lg:overflow-hidden">
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات
      </h2>

      {loading && <p>در حال بارگذاری...</p>}
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
            placeholder="جستجو..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border rounded-md w-56 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            onClick={() => setSearchTerm("")}
            className="focus:outline-none secondry-btn"
          >
            پاک کردن
          </button>
        </div>
        {/* Sort Button */}
        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-00 focus:outline-none"
        >
          مرتب‌سازی بر اساس تاریخ
          {sortOrder === "asc" ? (
            <FaSortAlphaUp className="w-4 h-4" />
          ) : (
            <FaSortAlphaDown className="w-4 h-4" />
          )}
        </button>
      </div>

      <center>
        <div className=" overflow-x-scroll lg:overflow-hidden bg-white w-full rounded-lg md:w-full">
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
              {orders && orders.length > 0 ? (
                orders.map((order) => (
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
                      {users.find((user) => user.id === order.designer)
                        ? `${
                            users.find((user) => user.id === order.designer)
                              ?.first_name
                          } ${
                            users.find((user) => user.id === order.designer)
                              ?.last_name
                          }`
                        : "Unknown Designer"}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      <button
                        onClick={() => {
                          handleShowAttribute(order);
                        }}
                        className="secondry-btn"
                      >
                        نمایش
                      </button>{" "}
                      <button
                        onClick={() => {
                          handleDelete(order.id);
                        }}
                        className=" bg-red-600 text-sm text-white py-2 px-5 rounded-lg hover:!scale-105 duration-300"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="border p-2 text-center">
                    هیچ سفارشی پیدا نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination Component */}
        </div>
        <Pagination
          currentPage={currentPage}
          totalOrders={totalOrders}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </center>
      {/* Conditionally render the Bill component */}
      {isViewModelOpen && passedOrder && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {isEditing ? "ویرایش سفارش" : "اطلاعات سفارش"}
            </h3>
            <div className="bg-gray-100 p-4 rounded overflow-auto text-sm space-y-2">
              {Object.entries(passedOrder.attributes).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center border-b border-gray-300 pb-2"
                >
                  <span className="font-medium text-gray-700">{key}</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingData.attributes[key] || ""}
                      onChange={(e) =>
                        setEditingData((prev) => ({
                          ...prev,
                          attributes: {
                            ...prev.attributes,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="border rounded p-1 text-gray-900 w-1/2"
                    />
                  ) : (
                    <span className="text-gray-900">{String(value)}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-x-5 justify-center mt-4">
              <button
                onClick={() => {
                  handleClosePopup();
                  setIsEditing(false);
                }}
                className="bg-red-600 text-sm text-white py-2 px-5 rounded-lg hover:!scale-105 duration-300 hover:bg-red-700"
              >
                بستن
              </button>

              {isEditing ? (
                <button onClick={handleSave} className="secondry-btn">
                  ذخیره
                </button>
              ) : (
                <button
                  onClick={() => handleEdit(passedOrder)}
                  className="secondry-btn"
                >
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
