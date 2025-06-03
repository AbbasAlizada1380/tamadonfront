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
import { useDebounce } from "use-debounce"; // Import useDebounce for search

const BASE_URL = import.meta.env.VITE_BASE_URL;

const OrderList = () => {
  const [showBill, setShowBill] = useState(false); // Kept original state
  const [orders, setOrders] = useState([]);
  const [passedOrder, setPassedOrder] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20; // Kept original pageSize
  const [selectedOrderId, setSelectedOrderId] = useState(null); // Kept original state
  const [isModelOpen, setIsModelOpen] = useState(false); // Kept original state (though unused in provided JSX)
  const [isViewModelOpen, setIsViewModelOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState({}); // Kept original state
  const [categories, setCategories] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({});

  // --- Search State (Integration Start) ---
  const [searchTerm, setSearchTerm] = useState(""); // Raw search input
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounced value for API
  // --- Search State (Integration End) ---

  const secretKey = "TET4-1"; // Kept original key

  // --- Keep original decryptData ---
  const decryptData = (hashedData) => {
    if (!hashedData) {
      // console.error("No data to decrypt"); // Keep original comment behavior
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

  // --- Keep original modalData state ---
  const [modalData, setModalData] = useState({
    receive_price: "",
    total_price: "",
    reminder_price: "",
    deliveryDate: moment(),
    order: selectedOrder,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(
    decryptData(localStorage.getItem("auth_token"))
  );
  const [refreshingToken, setRefreshingToken] = useState(false); // Kept original state
  const [role, setRole] = useState(decryptData(localStorage.getItem("role"))); // Kept original state

  // --- Keep original token functions ---
  const getAuthToken = useCallback(() => {
    // Added useCallback
    return decryptData(localStorage.getItem("auth_token"));
  }, []); // Removed decryptData dependency as it's stable outside component scope

  const isTokenExpired = useCallback((tokenToCheck) => {
    // Added useCallback
    if (!tokenToCheck) return true; // Added check for null/undefined token
    try {
      const decoded = jwt_decode(tokenToCheck);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true; // Treat errors as expired
    }
  }, []);

  const refreshAuthToken = useCallback(async () => {
    // Added useCallback
    if (refreshingToken) return;

    setRefreshingToken(true);
    try {
      const refreshToken = decryptData(localStorage.getItem("refresh_token"));
      if (!refreshToken) throw new Error("Refresh token not found."); // Added check

      const response = await axios.post(
        `${BASE_URL}/users/user/token/refresh/`,
        { refresh: refreshToken }
      );
      const newAuthToken = response.data.access;
      // Encrypt and store consistently
      const encryptedToken = CryptoJS.AES.encrypt(
        JSON.stringify(newAuthToken),
        secretKey
      ).toString();
      localStorage.setItem("auth_token", encryptedToken);
      setToken(newAuthToken); // Update state with raw token for immediate use
      return newAuthToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      setError("Error refreshing token");
      // Consider handling logout here if refresh fails
      return null;
    } finally {
      setRefreshingToken(false);
    }
  }, [refreshingToken]); // Removed decryptData dependency

  // --- Fetch Orders Function (Modified for Search Integration) ---
  const fetchOrders = useCallback(
    async (page = 1) => {
      // Added useCallback
      let currentToken = token; // Use state token initially

      if (!currentToken) {
        currentToken = getAuthToken(); // Try getting from storage if state is null
        if (!currentToken) {
          setError("No authentication token found.");
          setLoading(false); // Ensure loading stops
          return;
        }
        setToken(currentToken); // Update state if found in storage
      }

      if (isTokenExpired(currentToken)) {
        const newToken = await refreshAuthToken();
        if (!newToken) {
          setError("Unable to refresh token");
          setLoading(false); // Ensure loading stops
          return;
        }
        currentToken = newToken; // Use the newly refreshed token
      }

      setLoading(true); // Set loading true before fetch attempt
      try {
        // --- Build URL with Search and Pagination (Integration) ---
        const params = new URLSearchParams();
        // Use currentPage state for pagination
        params.append("pagenum", currentPage.toString());

        // Conditionally add search parameter if debounced term exists
        if (debouncedSearchTerm) {
          params.append("search", debouncedSearchTerm);
        }

        // Construct the final URL
        const ordersUrl = `${BASE_URL}/group/group/orders/status_supper/?${params.toString()}`;
        // --- End URL Building (Integration) ---

        const response = await axios.get(ordersUrl, {
          headers: { Authorization: `Bearer ${currentToken}` }, // Use the validated/refreshed token
        });

        setOrders(response.data.results || []); // Update orders directly
        setTotalOrders(response.data.count || 0); // Update total count
      } catch (error) {
        console.error("Error fetching orders:", error.response || error);
        // Handle potential 401/403 errors more specifically if needed
        setError("Error fetching orders.");
        setOrders([]); // Clear orders on error
        setTotalOrders(0);
      } finally {
        setLoading(false); // Ensure loading is set to false in finally block
      }
      // Add dependencies for useCallback
    },
    [
      currentPage,
      debouncedSearchTerm,
      token,
      getAuthToken,
      isTokenExpired,
      refreshAuthToken,
    ]
  ); // Include token and related functions

  // --- Keep original onPageChange ---
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // --- Keep original handleEdit, handleSave ---
  const handleEdit = (order) => {
    setIsEditing(true);
    // Deep copy attributes to avoid direct state mutation issues
    setEditingData({ ...order, attributes: { ...(order.attributes || {}) } });
  };

  const handleSave = async () => {
    // Use a validated token
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        Swal.fire("خطا!", "توکن نامعتبر است، لطفا دوباره وارد شوید.", "error");
        return;
      }
    }

    const { id } = editingData; // Only need id from editingData for URL
    try {
      // Send only the necessary data for update, verify API expects this format
      const payload = {
        ...passedOrder,
        attributes: {
          ...(editingData.attributes || {}),
        },
      };

      const response = await axios.put(
        // Use PUT for updating existing resource
        `${BASE_URL}/group/group/orders/status_supper/${id}/`, // Correct endpoint for specific order
        payload, // Send the payload with changes
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`, // Use validated token
          },
        }
      );
      console.log("Data updated successfully", response.data);
      setIsEditing(false);
      handleClosePopup(); // Close the popup modal
      fetchOrders(currentPage); // Refresh the list
      Swal.fire("موفق!", "اطلاعات با موفقیت ویرایش شد.", "success");
    } catch (error) {
      console.error(
        "Error updating data:",
        error.response?.data || error.message || error
      );
      Swal.fire(
        "خطا!",
        `ویرایش اطلاعات ناموفق بود: ${
          error.response?.data?.detail || error.message
        }`,
        "error"
      );
    }
  };

  // --- Keep original fetchCategories, fetchUsers ---
  const fetchCategories = useCallback(async () => {
    // Added useCallback
    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        setError("Unable to refresh token for categories");
        return;
      }
    }

    // setLoading(true); // Avoid resetting loading if fetchOrders is also running
    try {
      // Using axios for consistency
      const response = await axios.get(`${BASE_URL}/group/categories/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setCategories(response.data || []);
    } catch (error) {
      setError("Error fetching categories");
      console.error("Error fetching categories:", error.response || error);
      setCategories([]); // Clear on error
    } finally {
      // setLoading(false); // Let fetchOrders handle final loading state
    }
  }, [token, isTokenExpired, refreshAuthToken]);

  const fetchUsers = useCallback(async () => {
    // Added useCallback
    // Assume users don't require auth, otherwise add token logic like fetchCategories
    try {
      const response = await axios.get(`${BASE_URL}/users/api/users`);
      setUsers(response.data || []);
    } catch (error) {
      // setError("Error fetching users"); // Avoid overriding other errors
      console.error("Error fetching users:", error.response || error);
      setUsers([]); // Clear on error
    } finally {
      // setLoading(false); // Let fetchOrders handle final loading state
    }
  }, []); // No dependencies needed if no auth required

  // --- useEffect Hooks ---
  useEffect(() => {
    // Fetch all necessary data on mount and when dependencies change
    fetchOrders(); // fetchOrders now depends on token, currentPage, debouncedSearchTerm
    fetchCategories(); // fetchCategories depends on token
    fetchUsers(); // fetchUsers has no dependencies currently
  }, [fetchOrders, fetchCategories, fetchUsers]); // Depend on the useCallback functions

  // --- Effect to reset page on search change (Integration) ---
  useEffect(() => {
    // Reset page to 1 only when debouncedSearchTerm changes (and not on initial load)
    if (debouncedSearchTerm !== undefined && currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]); // Dependency is the debounced search term

  // --- Keep original handleCheckClick ---
  const handleCheckClick = (order) => {
    setSelectedOrder(order.id);
    const category = categories.find((cat) => cat.id === order.category); // Use order.category directly if it's the ID
    // Removed category_id assumption

    // Find price info if it exists directly on order or needs separate fetch
    // Assuming price info might come from a related object or needs fetch
    // For now, initialize based on potentially existing fields or empty
    const existingPriceInfo = {}; // Placeholder - fetch or access actual price data if needed

    setModalData({
      // Initialize with existing price data if available, else empty/defaults
      receive_price: existingPriceInfo.receive_price || "",
      total_price: existingPriceInfo.total_price || "",
      reminder_price: existingPriceInfo.reminder_price || "", // Calculate if needed
      deliveryDate: existingPriceInfo.delivery_date
        ? moment(existingPriceInfo.delivery_date)
        : moment(), // Initialize date
      order: order.id, // Pass only the order ID
      // Pass other relevant details for display in modal if needed
      order_name: order.order_name,
      customer_name: order.customer_name,
      description: order.description || "",
      category_name: category ? category.name : "",
      current_status: order.status, // Pass current status
    });
    setShowModal(true);
  };

  // --- Keep original handleDelete ---
  const handleDelete = async (orderId) => {
    let currentToken = token; // Use state token

    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        Swal.fire("خطا!", "توکن نامعتبر است.", "error");
        return;
      }
    }

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
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );

      console.log("Order deleted:", response.data);
      // Update state locally BEFORE showing success message for better UX
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );
      setTotalOrders((prevTotal) => prevTotal - 1); // Decrement total count
      // Adjust current page if the last item on a page > 1 was deleted
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1); // This will trigger a fetch for the previous page
      }

      Swal.fire("حذف شد!", "سفارش مورد نظر با موفقیت حذف گردید.", "success");

      // No need to call fetchOrders() if state is updated locally and pagination handled
    } catch (error) {
      console.error("Error deleting order:", error.response || error);
      Swal.fire("خطا!", "حذف سفارش با مشکل مواجه شد.", "error");
    }
  };

  // --- Keep original handleModalChange, handleDateChange ---
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleDateChange = (dateObject) => {
    // Renamed parameter for clarity
    if (dateObject && dateObject.isValid) {
      // Format directly to 'YYYY-MM-DD' which is usually backend-friendly
      const formattedDate = dateObject.format("YYYY-MM-DD");
      setModalData((prevData) => ({
        ...prevData,
        deliveryDate: formattedDate,
      }));
    } else {
      console.log("Invalid Date Object:", dateObject);
      setModalData((prevData) => ({
        ...prevData,
        deliveryDate: null, // Or keep previous valid date, or set empty string
      }));
    }
  };

  // --- Keep original handleModalSubmit ---
  const handleModalSubmit = async () => {
    setSubmitting(true); // Moved to the beginning

    if (!modalData.total_price || !modalData.receive_price) {
      Swal.fire("خطا", "لطفا قیمت کل و قیمت دریافتی را وارد کنید.", "warning");
      setSubmitting(false); // Ensure submitting is reset on validation fail
      return;
    }

    let currentToken = token;
    if (!currentToken || isTokenExpired(currentToken)) {
      currentToken = await refreshAuthToken();
      if (!currentToken) {
        Swal.fire("خطا!", "توکن نامعتبر است.", "error");
        setSubmitting(false);
        return;
      }
    }
    const headers = { Authorization: `Bearer ${currentToken}` };

    // Prepare data for the price creation endpoint
    const pricePayload = {
      // Ensure keys match the backend expectations for '/group/reception-orders/'
      price: convertToEnglishNumbers(modalData.total_price), // Assuming 'price' is total_price
      receive_price: convertToEnglishNumbers(modalData.receive_price),
      delivery_date: modalData.deliveryDate, // Already formatted as YYYY-MM-DD
      order: selectedOrder, // The ID of the order
      reception_name: decryptData(localStorage.getItem("id")),
    };

    try {
      // 1. Find the category to get stages
      const orderDetails = orders.find((o) => o.id === selectedOrder);
      const category = categories.find(
        (cat) => cat.id === orderDetails?.category
      );
      const statusStages = category?.stages; // Get stages from the found category

      let nextStatus = null;
      if (Array.isArray(statusStages) && orderDetails?.status) {
        const currentIndex = statusStages.indexOf(orderDetails.status);
        if (currentIndex !== -1 && currentIndex < statusStages.length - 1) {
          nextStatus = statusStages[currentIndex + 1]; // Get the next status
        } else {
          console.log(
            "Current status is the last stage or not found in stages."
          );
          // Decide what to do: keep current status, set to a default, or error?
          // Keeping current status if it's the last one:
          // nextStatus = orderDetails.status;
        }
      } else {
        console.log("Stages not found, not an array, or order status missing.");
        // Handle error or default behavior
      }

      // 2. Create the price record
      console.log(pricePayload);
      
      const priceResponse = await axios.post(
        `${BASE_URL}/group/reception-orders/`, // Endpoint for creating price/reception info
        pricePayload,
        { headers }
      );
      console.log("Price record created:", priceResponse.data);

      // 3. Update the order status *only if* a next status was determined
      if (nextStatus) {
        try {
          await axios.post(
            `${BASE_URL}/group/orders/update-status/`, // Endpoint for updating status
            { order_id: selectedOrder, status: nextStatus },
            { headers }
          );
          console.log(`Order status updated to: ${nextStatus}`);
        } catch (statusError) {
          // Important: If status update fails, decide how to proceed.
          // Maybe log the error but still consider price creation successful?
          // Or rollback/delete the created price record? (More complex)
          console.error(
            "Error updating order status:",
            statusError.response || statusError
          );
          // Optionally inform the user the status update failed but price was saved
          Swal.fire(
            "توجه",
            "قیمت ثبت شد، اما به‌روزرسانی وضعیت سفارش با مشکل مواجه شد.",
            "warning"
          );
        }
      }

      // 4. Update UI and show success
      setShowModal(false);
      // Optimistically remove order from THIS list (Reception list)
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== selectedOrder)
      );
      setTotalOrders((prevTotal) => prevTotal - 1);
      // Adjust pagination if needed
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1); // Will trigger refetch via useEffect
      }

      Swal.fire({
        icon: "success",
        title: "موفق",
        text: "قیمت با موفقیت ثبت و وضعیت سفارش به‌روزرسانی شد.", // Adjust message if status update might fail
        timer: 1500,
        showConfirmButton: false,
      });

      // Optional: You might not need a full fetchOrders() if UI is updated locally
      // fetchOrders();
    } catch (error) {
      console.error(
        "Error processing order submission:",
        error.response || error
      );
      // If the initial price creation failed, no need to revert status usually
      let errorMessage = "خطا در ثبت اطلاعات قیمت.";
      if (error.response?.data) {
        // Try to get specific error messages from backend response
        const errorData = error.response.data;
        errorMessage += " " + (errorData.detail || JSON.stringify(errorData));
      }

      Swal.fire("خطا", errorMessage, "error");

      // No status rollback needed here if the price creation itself failed.
      // If price succeeded but status failed, that's handled within the try block.
    } finally {
      setSubmitting(false);
    }
  };

  // --- Keep original convertToEnglishNumbers ---
  const convertToEnglishNumbers = (num) => {
    if (num === null || num === undefined) return num; // Handle null/undefined
    return num
      .toString()
      .replace(/[۰-۹]/g, (d) => "0123456789"[+"۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
  };

  // --- Keep original handleShowAttribute, handleClosePopup ---
  const handleShowAttribute = (order) => {
    setPassedOrder(order); // Keep original state update
    // Removed attributeArray conversion as it wasn't used in the modal JSX
    setIsViewModelOpen(!isViewModelOpen); // Keep original toggle
    setSelectedAttribute(order); // Keep original state update (seems redundant with passedOrder)
    // Set editing data when viewing, in case user clicks edit
    handleEdit(order); // Prepare editingData immediately
  };

  const handleClosePopup = () => {
    setIsViewModelOpen(false);
    setIsEditing(false); // Reset editing state when closing
    setEditingData({}); // Clear editing data
  };

  // --- Keep original Loading check ---
  if (loading && orders.length === 0) {
    // Show only on initial load
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader mr-3"></div>
        <span className="text-xl font-semibold">در حال بارگذاری...</span>
        {/* Keep original style tag */}
        <style jsx>{`
          .loader {
            /* ... keep styles ... */
          }
          @keyframes spin {
            /* ... keep styles ... */
          }
        `}</style>
      </div>
    );
  }

  // --- Keep original JSX structure, add Search Input ---
  return (
    // Added padding bottom for spacing
    <div className="w-[400px] md:w-[700px] mt-10 lg:w-[90%] mx-auto lg:overflow-hidden pb-10">
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات
      </h2>

      {/* --- Search Input Section (Integration) --- */}
      <div className="flex items-center justify-center mb-4 gap-x-3 px-4">
        <label
          htmlFor="orderSearchList" // Unique ID for label
          className="block text-sm font-semibold whitespace-nowrap"
        >
          جستجو:
        </label>
        <input
          type="text"
          id="orderSearchList"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update search term state
          className="shadow-sm appearance-none border rounded-md w-full md:w-1/2 lg:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-green focus:border-transparent" // Adjusted focus style
          placeholder="نام مشتری، سفارش، کتگوری..."
        />
        {searchTerm && ( // Show clear button conditionally
          <button
            onClick={() => setSearchTerm("")} // Clear the search term
            className="focus:outline-none secondry-btn text-xs px-3 py-1" // Smaller clear button
          >
            پاک کردن
          </button>
        )}
      </div>
      {/* --- End Search Input Section --- */}

      {/* --- Table Section with Loading Overlay --- */}
      <div className="relative">
        {/* Loading Overlay (shows during refetch/search) */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10 rounded-lg">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
            {/* <span className="ml-2 text-gray-600">...</span> */}
            <style jsx>{`
              .loader {
                border-top-color: #3b82f6;
                animation: spin 1.2s linear infinite;
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
        <center
          className={`transition-opacity duration-300 ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          <div className="overflow-x-scroll lg:overflow-hidden bg-white w-full rounded-lg md:w-full border border-gray-200 shadow-md">
            <table className="min-w-full bg-white ">
              {" "}
              {/* Removed redundant border/shadow */}
              {/* Keep original thead */}
              <thead className="">
                <tr className="bg-green text-gray-100 text-center">
                  <th className="border border-gray-300 px-4 py-2.5 text-sm font-semibold whitespace-nowrap">
                    نام مشتری
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 text-sm font-semibold whitespace-nowrap">
                    نام سفارش
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 text-sm font-semibold whitespace-nowrap">
                    دسته‌بندی
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 text-sm font-semibold whitespace-nowrap">
                    طراح
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 text-sm font-semibold whitespace-nowrap">
                    اقدامات
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 text-sm font-semibold whitespace-nowrap">
                    جزئیات
                  </th>
                </tr>
              </thead>
              {/* Render directly from 'orders' state */}
              <tbody>
                {!loading && orders && orders.length > 0 // Check loading state as well
                  ? orders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-100 transition-colors duration-150" // Subtle hover
                      >
                        {/* Keep original td structure and content */}
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm">
                          {order.customer_name}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm">
                          {order.order_name}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm">
                          {categories.find((cat) => cat.id === order.category)
                            ?.name || "نامشخص"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm">
                          {order.designer_details?.full_name || "نامشخص"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700">
                          <div className="flex justify-center items-center gap-x-2">
                            {" "}
                            {/* Reduced gap */}
                            <button
                              onClick={() => handleCheckClick(order)}
                              className="bg-green hover:bg-green-700 transition-colors text-white p-1 h-7 w-7 rounded flex items-center justify-center text-xs" // Smaller button
                              title="ثبت قیمت" // Added tooltip
                            >
                              ✔
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="bg-red-500 hover:bg-red-600 transition-colors text-white p-1 h-7 w-7 rounded flex items-center justify-center text-xs" // Smaller button
                              title="حذف سفارش" // Added tooltip
                            >
                              ✖
                            </button>
                          </div>
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700">
                          <button
                            onClick={() => handleShowAttribute(order)}
                            className="secondry-btn text-xs px-3 py-1" // Smaller button
                          >
                            نمایش
                          </button>
                        </td>
                      </tr>
                    ))
                  : !loading && ( // Render message only when not loading and no orders
                      <tr>
                        {/* Adjusted colspan to 6 */}
                        <td
                          colSpan="6"
                          className="border p-4 text-center text-gray-500"
                        >
                          {/* Update message based on search term */}
                          {searchTerm
                            ? "هیچ سفارشی مطابق با جستجوی شما یافت نشد."
                            : "هیچ سفارشی برای قیمت‌گذاری یافت نشد."}
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
          {/* Keep original Pagination Component */}
          {totalOrders > 0 && ( // Conditionally render pagination
            <Pagination
              currentPage={currentPage}
              totalOrders={totalOrders}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          )}
        </center>
      </div>

      {/* --- Keep original Modals (Price/Delivery, View/Edit Details) --- */}
      {showModal && (
        // Using a portal might be better for modals, but keeping original structure
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg">
            {" "}
            {/* Responsive width */}
            <div className="p-6">
              <h3 className="text-lg text-center font-bold mb-4">
                ثبت قیمت و تاریخ تحویل
              </h3>
              {/* Keep original form inputs */}
              <div className="mb-4">
                <label
                  className="block mb-1 font-medium text-sm"
                  htmlFor="total_price_modal"
                >
                  قیمت کل:
                </label>
                <input
                  type="number"
                  id="total_price_modal"
                  name="total_price"
                  value={modalData.total_price || ""}
                  onChange={handleModalChange}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green text-sm"
                  placeholder="قیمت کل به عدد وارد شود"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block mb-1 font-medium text-sm"
                  htmlFor="receive_price_modal"
                >
                  قیمت دریافتی:
                </label>
                <input
                  type="number"
                  id="receive_price_modal"
                  name="receive_price"
                  value={modalData.receive_price}
                  onChange={handleModalChange}
                  className="w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green text-sm"
                  placeholder="مبلغ دریافتی به عدد وارد شود"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block mb-1 font-medium text-sm"
                  htmlFor="delivery_date_modal"
                >
                  تاریخ تحویل:
                </label>
                <DatePicker
                  id="delivery_date_modal"
                  containerClassName="w-full" // Ensure container takes full width
                  inputClass="w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green text-sm" // Apply width to input
                  value={modalData.deliveryDate}
                  onChange={handleDateChange}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="auto" // Auto position calendar
                />
              </div>
            </div>
            {/* Keep original modal buttons */}
            <div className="bg-gray-50 px-6 py-3 flex justify-center items-center gap-x-4 rounded-b-lg">
              <button
                onClick={handleModalSubmit}
                disabled={submitting}
                className={`secondry-btn ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? "درحال ثبت..." : "تایید"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="tertiary-btn"
                disabled={submitting} // Disable cancel during submission
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keep original View/Edit Details Modal */}
      {/* View/Edit Details Modal */}
      {isViewModelOpen && passedOrder && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {isEditing ? "ویرایش سفارش" : "اطلاعات سفارش"}
            </h3>
            <div className="bg-gray-100 p-4 rounded overflow-auto text-sm space-y-2">
              {/* Map editingData.attributes instead of passedOrder.attributes */}
              {Object.entries(
                isEditing ? editingData.attributes : passedOrder.attributes
              ).map(([key, value]) => (
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

              {/* Description Field */}
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">توضیحات</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingData.description || ""}
                    onChange={(e) =>
                      setEditingData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="border rounded p-1 text-gray-900 w-1/2"
                  />
                ) : (
                  <span className="text-gray-900">
                    {passedOrder.description || "بدون توضیحات"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-x-5 justify-center mt-4">
              <button onClick={handleClosePopup} className="tertiary-btn">
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
