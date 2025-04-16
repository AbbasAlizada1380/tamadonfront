import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import Pagination from "../../../Utilities/Pagination.jsx";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import moment from "moment-hijri";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const OrderList = () => {
  const [showBill, setShowBill] = useState(false); // State to control Bill rendering
  const [orders, setOrders] = useState([]);
  const [passedOrder, setPassedOrder] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20;
  const [selectedOrderId, setSelectedOrderId] = useState(null); // Store the orderId of the order to be deleted
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isViewModelOpen, setIsViewModelOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState({}); // State for popup data
  const [categories, setCategories] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({});

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
    deliveryDate: moment(), // Initialize with the current date or a valid date
    order: selectedOrder,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(
    decryptData(localStorage.getItem("auth_token"))
  );
  const [refreshingToken, setRefreshingToken] = useState(false); // Prevent multiple refresh requests
  const [role, setRole] = useState(decryptData(localStorage.getItem("role")));
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

  const fetchOrders = async (page = 1) => {
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
      const response = await axios.get(
        `${BASE_URL}/group/group/orders/status_supper/?pagenum=${currentPage}`,
        {
          params: { pagenum: currentPage },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data.results);

      setTotalOrders(response.data.count);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Error fetching orders.");
    }
  };
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  const handleEdit = (order) => {
    setIsEditing(true);
    setEditingData(order);
  };

  const handleSave = async () => {
    const { id, attributes } = editingData;
    try {
      const response = await axios.put(
        `${BASE_URL}/group/group/orders/status_supper/${id}/`,
        editingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Data updated successfully");
      // Optionally, update the local state or refresh data
      setIsEditing(false);
      handleClosePopup();
      fetchOrders(currentPage);
    } catch (error) {
      console.error("Error updating data:", error);
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
  // Fetch orders and categories on mount
  useEffect(() => {
    fetchOrders();
    fetchCategories();
    fetchUsers();
  }, [token]); // Dependency array now includes token to refetch when token changes

  // Handle "check" button click (open modal)
  const handleCheckClick = (order) => {
    setSelectedOrder(order.id);
    const category = categories.find((cat) => cat.id === order.category_id);
    const initialPrice =
      category && category.default_price !== undefined
        ? category.default_price
        : "";

    setModalData({
      receive_price: order.receive_price || "",
      total_price: order.total_price || "",
      reminder_price: order.reminder_price || "", // Show reminder_price here
      deliveryDate: "",
      order: order || null,
      order_name: order.order_name,
      customer_name: order.customer_name,
      description: order.description || "",
      category_name: category ? category.name : "",
    });

    setShowModal(true);
  };

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
        `${BASE_URL}/group/group/orders/status_supper/${orderId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Order deleted:", response.data);
      setOrders(orders.filter((order) => order.id !== orderId)); // Remove deleted order
      setIsModelOpen(false); // Close modal

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
  const handleDateChange = (date) => {
    // Function to convert Persian characters to English characters
    const convertPersianToEnglish = (str) => {
      // Replace Persian digits (۰-۹) with English digits (0-9)
      return str.replace(
        /[۰-۹]/g,
        (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]
      );
    };

    // Example if 'date' has a 'format' method like the Jalali date object
    if (date && date.format) {
      const formattedDate = date.format("YYYY-MM-DD"); // Format the date as YYYY-MM-DD

      // Convert Persian digits to English digits in the formatted date
      const convertedDate = convertPersianToEnglish(formattedDate);

      // Store the converted date
      setModalData((prevData) => ({
        ...prevData,
        deliveryDate: convertedDate, // Store the formatted and converted date
      }));
    } else {
      console.log("Invalid or Empty Date:", date);
      setModalData((prevData) => ({
        ...prevData,
        deliveryDate: null, // Handle invalid date
      }));
    }
  };

  // Handle form submission in modal (update order)
  const handleModalSubmit = async () => {
    setSubmitting(true);
    if (!modalData.total_price || !modalData.receive_price) {
      Swal.fire({
        icon: "error",
        title: "خطا",
        text: "لطفا قیمت و قیمت دریافتی را وارد کنید.",
        confirmButtonText: "متوجه شدم",
      });
      return;
    }
    // Check if modalData.deliveryDate is a moment object
    const formattedDate = modalData.deliveryDate
      ? typeof modalData.deliveryDate === "string" &&
        moment(modalData.deliveryDate, "jYYYY/jMM/jDD", true).isValid() // Check if it's a valid Persian date string
        ? moment(modalData.deliveryDate, "jYYYY/jMM/jDD") // Parse using the correct format
            .format("iYYYY-iMM-iDD")
            .replace(/[/]/g, "-")
            .replace(/[۰-۹]/g, (d) => "0123456789"["۰-۹".indexOf(d)] || d) // Replace Persian numerals
        : modalData.deliveryDate instanceof Date &&
          !isNaN(modalData.deliveryDate) // If it's a valid Date object
        ? moment(modalData.deliveryDate) // Parse using Date object
            .format("iYYYY-iMM-iDD")
            .replace(/[/]/g, "-")
            .replace(/[۰-۹]/g, (d) => "0123456789"["۰-۹".indexOf(d)] || d)
        : null // Return null if invalid date
      : null; // If no date exists, return null

    const updatedOrder = {
      price: convertToEnglishNumbers(modalData.total_price) || null,
      receive_price: convertToEnglishNumbers(modalData.receive_price) || null,
      delivery_date: modalData.deliveryDate, // This should now be in Hijri format
      order: selectedOrder || null,
    };
    let token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (!token) {
        throw new Error("توکن احراز هویت وجود ندارد.");
      }

      if (isTokenExpired(token)) {
        token = await refreshAuthToken();
        if (!token) {
          throw new Error("بروزرسانی توکن با شکست مواجه شد.");
        }
      }
      const category = categories.find(
        (category) => category.id == modalData.order.category
      );
      const statusStage = category?.stages; // Get stages from the found category
      let nextStatus;
      if (Array.isArray(statusStage)) {
        const currentIndex = statusStage.indexOf(modalData.order.status);
        if (currentIndex) {
          // Assign the next index status
          nextStatus = statusStage[currentIndex + 1];
        } else {
          console.log(
            "The current status is the last in the stages array or does not exist."
          );
        }
      } else {
        console.log("Stages not found or not an array.");
      }
      // console.log(nextStatus);
      // Update order status
      console.log(nextStatus, selectedOrder);

      await axios.post(
        `${BASE_URL}/group/orders/update-status/`,
        { order_id: selectedOrder, status: nextStatus },
        { headers }
      );

      const response = await axios.post(
        `${BASE_URL}/group/reception-orders/`,
        updatedOrder,
        { headers }
      );
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
        timer: 1000,
        showConfirmButton: false,
      });
      fetchOrders();
    } catch (error) {
      console.error("Error updating the order:", error.response || error);
      const remove = await axios.post(
        `${BASE_URL}/group/update-order-status/`,
        { order_id: selectedOrder, status: "Reception" },
        { headers }
      );

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
    } finally {
      setSubmitting(false); // اینجا مقدار را برمی‌گردانیم به false
    }
  };
  useEffect(() => {
    fetchOrders();
  }, [currentPage]); // Re-fetch when the filterDate, or refreshOrders changes

  const convertToEnglishNumbers = (num) => {
    if (!num) return num;
    return num
      .toString()
      .replace(/[۰-۹]/g, (d) => "0123456789"[+"۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
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

  // Calculate pagination

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader mr-3"></div>
        <span className="text-xl font-semibold">در حال بارگذاری...</span>

        <style jsx>{`
          .loader {
            width: 40px;
            height: 40px;
            border: 4px solid #16a34a; /* Tailwind green-600 */
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-[400px] md:w-[700px]  mt-10 lg:w-[90%] mx-auto  lg:overflow-hidden">
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات
      </h2>
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
                  اقدامات
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
                      {order.designer_details.full_name || "Unknown Designer"}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700 gap-x-5 flex justify-center ">
                      <button
                        onClick={() => handleCheckClick(order)}
                        className="bg-green h-8 w-8 text-white p-1 rounded"
                      >
                        ✔
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="bg-red-500 text-white p-1 h-8 w-8 rounded hover:bg-red-600"
                      >
                        ✖
                      </button>
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      <button
                        onClick={() => {
                          handleShowAttribute(order);
                        }}
                        className="secondry-btn"
                      >
                        نمایش
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="border p-2 text-center">
                    هیچ سفارشی بدون قیمت پیدا نشد
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
      {/* Modal for Price and Delivery Date */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col gap-5 items-center justify-center">
          <div className="bg-white">
            <div className="bg-white p-6 rounded  w-[350px]  md:w-[600px]">
              <h3 className="text-lg text-center font-bold mb-4">
                اضافه کردن قیمت و تاریخ تحویل
              </h3>
              <div className="mb-4">
                <label className="block mb-1 font-medium">قیمت:</label>
                <input
                  type="number"
                  name="total_price"
                  value={modalData.total_price || ""}
                  onChange={handleModalChange}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green"
                  placeholder="قیمت را وارد کنید"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-medium">قیمت دریافتی:</label>
                <input
                  type="number"
                  name="receive_price"
                  value={modalData.receive_price}
                  onChange={handleModalChange}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green"
                  placeholder="قیمت دریافتی را وارد کنید"
                  required
                />
              </div>

              <div className="mb-4 w-full">
                <label className="block mb-1 font-medium">تاریخ تحویل:</label>
                <DatePicker
                  style={{ width: "500px" }}
                  value={modalData.deliveryDate}
                  onChange={handleDateChange}
                  calendar={persian} // Use Hijri Shamsi (Jalali) Calendar
                  locale={persian_fa} // Persian language support
                  inputClass=" border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green"
                />
              </div>
            </div>
            <div className="flex justify-center pb-6 items-center gap-5">
              <button
                onClick={handleModalSubmit}
                disabled={submitting}
                className={`secondry-btn ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? "در حال ارسال..." : "تایید"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="tertiary-btn"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
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

              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">توضیحات</span>
                <span className="border rounded p-1 text-gray-900 w-1/2">
                  {passedOrder.description}
                </span>
              </div>
            </div>

            <div className="flex gap-x-5 justify-center mt-4">
              <button
                onClick={() => {
                  handleClosePopup();
                  setIsEditing(false);
                }}
                className="tertiary-btn"
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
                  className="bg-update text-sm text-white py-2 px-5 rounded-lg hover:!scale-105 duration-300 hover:bg-yellow-700"
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

export default OrderList;
