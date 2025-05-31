import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Bill from "../../Bill_Page/Bill";
import CryptoJS from "crypto-js";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import vazirmatnFont from "/vazirmatnBase64.txt"; // Ensure this is a valid Base64 font
// import SearchBar from "../../../Utilities/Searching"; // Using direct input for clarity like AddOrder
import { FaSearch } from "react-icons/fa"; // Import search icon
import { useDebounce } from "use-debounce"; // Import useDebounce
import Pagination from "../../../Utilities/Pagination"; // Adjust path if needed
import { CiEdit } from "react-icons/ci";
import { FaCheck, FaEdit } from "react-icons/fa";
import { Price } from "./Price";

import Swal from "sweetalert2";
import BillTotalpage from "../../Bill_Page/BillTotalpage";
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Define the API endpoint for fetching orders (similar to AddOrder)
const ORDERS_API_ENDPOINT = `${BASE_URL}/group/orders/reception_list/today/`; // Or adjust if a different endpoint is needed for TokenOrders search

const TokenOrders = () => {
  const [orders, setOrders] = useState([]);
  const [passedOrder, setPassedOrder] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isTotalModelOpen, setIsTotalModelOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [prices, setPrices] = useState({});
  const [receivedPrices, setReceivedPrices] = useState({});
  const [remaindedPrices, setRemaindedPrices] = useState({});
  const [reception_name, setReception_name] = useState({});
  const [DDate, setDDate] = useState({});
  // const [totalCount, setTotalCount] = useState(0); // totalOrders is already used for this
  const [loading, setLoading] = useState(true);
  const pageSize = 20; // Keep your desired page size
  const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1); // Can be calculated from totalOrders and pageSize
  const [selectedAttribute, setSelectedAttribute] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [users, setUsers] = useState({});
  const [isClicked, setIsClicked] = useState(false);

  // --- Search State ---
  const [searchTerm, setSearchTerm] = useState(""); // Raw search input
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounced value for API call

  const [showPrice, setShowPrice] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const secretKey = "TET4-1";

  // --- Decryption Function (Keep as is) ---
  const decryptData = useCallback((hashedData) => {
    if (!hashedData) {
      // console.error("No data to decrypt"); // Keep console logs minimal if preferred
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
  }, []);

  const handleClick = () => {
    setIsClicked(!isClicked);
  };
  // --- Helper Functions (Keep printBill, getAuthToken, isTokenExpired, refreshAuthToken as is) ---
  const printBill = async () => {
    // ... (keep existing printBill logic)
    const element = document.getElementById("bill-content");
    if (!element) {
      console.error("Bill content not found!");
      return;
    }

    try {
      // A5 Portrait: 148mm x 210mm
      const billWidth = 148;
      const billHeight = 210;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [billHeight, billWidth],
      });

      pdf.addFileToVFS("Vazirmatn.ttf", vazirmatnFont);
      pdf.addFont("vazirmatn.ttf", "vazirmatn", "normal");
      pdf.setFont("vazirmatn");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      pdf.addImage(imgData, "JPEG", 0, 0, billWidth, billHeight);

      pdf.autoPrint();
      window.open(pdf.output("bloburl"), "_blank");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const getAuthToken = useCallback(
    () => decryptData(localStorage.getItem("auth_token")),
    [decryptData]
  );

  const isTokenExpired = (token) => {
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true; // Assume expired if decoding fails
    }
  };

  const refreshAuthToken = useCallback(async () => {
    try {
      // Assuming refresh token logic exists and is stored securely
      const refreshToken = decryptData(localStorage.getItem("refresh_token")); // Or however you store it
      if (!refreshToken) throw new Error("Refresh token not found.");

      const response = await axios.post(
        `${BASE_URL}/users/user/token/refresh/`,
        {
          refresh: refreshToken,
        }
      );

      const newAuthToken = response.data.access;
      // Encrypt and store the new token (ensure encryption is consistent)
      const encryptedToken = CryptoJS.AES.encrypt(
        JSON.stringify(newAuthToken),
        secretKey
      ).toString();
      localStorage.setItem("auth_token", encryptedToken);
      // Optionally update refresh token if backend sends a new one
      // if (response.data.refresh) { ... }
      console.log("Token refreshed successfully.");
      return newAuthToken; // Return the raw (decrypted) new token for immediate use
    } catch (error) {
      console.error("Unable to refresh token", error);
      // Handle logout or redirect to login if refresh fails
      // e.g., localStorage.clear(); window.location.href = '/login';
      return null;
    }
  }, [decryptData]); // Add decryptData dependency
 const fetchUsers = async () => {
   try {
     const response = await axios.get(`${BASE_URL}/users/api/users/`);
     setUsers(response.data);
   } catch (error) {
     console.error("Error fetching users:", error);
   }
  };
  useEffect(() => {fetchUsers()}, [])
  // --- Fetch Data Function (Modified for Search) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    let token = getAuthToken();

    if (!token) {
      console.error("No authentication token found.");
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      console.log("Auth token expired, attempting refresh...");
      token = await refreshAuthToken();
      if (!token) {
        console.error("Token refresh failed. Aborting fetch.");
        // Handle logout or redirect appropriately here
        setLoading(false);
        return;
      }
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // --- Build URL with Search and Pagination ---
      const params = new URLSearchParams({
        pagenum: currentPage.toString(),
        page_size: pageSize.toString(), // Add page_size if your API supports it
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm); // Add search parameter if term exists
      }

      // Ensure the endpoint supports these parameters
      const ordersUrl = `${ORDERS_API_ENDPOINT}?${params.toString()}`;
      // --- End URL Building ---

      // Fetch orders, categories, and users (keep this structure if needed)
      const [ordersResponse, categoriesResponse, usersResponse] =
        await Promise.all([
          axios.get(ordersUrl, { headers }), // Use the constructed URL
          axios.get(`${BASE_URL}/group/categories/`, { headers }),
          axios.get(`${BASE_URL}/users/api/users/`, { headers }), // Make sure this endpoint is correct
        ]);

      setOrders(ordersResponse.data.results || []);
      setTotalOrders(ordersResponse.data.count || 0);
      // setTotalCount(ordersResponse.data.count || 0); // Redundant with totalOrders
      // setTotalPages(Math.ceil(ordersResponse.data.count / pageSize)); // Calculated in Pagination

      setCategories(categoriesResponse.data || []);
      setDesigners(usersResponse.data || []); // Ensure this state is used or remove fetch

      // --- Fetch Prices Logic (Keep as is) ---
      const newPrices = {};
      const newReceived = {};
      const newRemainded = {};
      const newDeliveryDate = {};
      const newReception_name = {};
      if (ordersResponse.data.results) {
        await Promise.all(
          ordersResponse.data.results.map(async (order) => {
            try {
              // Consider adding a check if price data is actually needed for the current view/search results
              const priceResponse = await axios.get(
                `${BASE_URL}/group/order-by-price/`,
                {
                  params: { order: order.id },
                  headers: { Authorization: `Bearer ${token}` }, // Pass token here too
                }
              );

              const data1 = priceResponse.data;
              if (data1 && data1.length > 0) {
                newPrices[order.id] = data1[0].price;
                newReceived[order.id] = data1[0].receive_price;
                newRemainded[order.id] = data1[0].reminder_price;
                newDeliveryDate[order.id] = data1[0].delivery_date;
                newReception_name[order.id] = data1[0].reception_name;
              } else {
                // console.warn(`No price data found for order ID: ${order.id}`);
              }
            } catch (priceError) {
              // Handle price fetch errors gracefully (e.g., don't block UI)
              if (priceError.response?.status === 404) {
                // console.warn(`Price data not found for order ID: ${order.id}`);
              } else {
                // console.error(`Error fetching price for order ID: ${order.id}`, priceError);
              }
              // Set default/placeholder values if needed
              newPrices[order.id] = newPrices[order.id] ?? "N/A";
              newReceived[order.id] = newReceived[order.id] ?? "N/A";
              newRemainded[order.id] = newRemainded[order.id] ?? "N/A";
              newDeliveryDate[order.id] = newDeliveryDate[order.id] ?? "N/A";
              newReception_name[order.id] = newReception_name[order.id] ?? "N/A";
            }
          })
        );
        // Update price states outside the map loop for efficiency
        setPrices((prevPrices) => ({ ...prevPrices, ...newPrices }));
        setReceivedPrices((prevReceived) => ({
          ...prevReceived,
          ...newReceived,
        }));
        setRemaindedPrices((prevRemainded) => ({
          ...prevRemainded,
          ...newRemainded,
        }));
        setReception_name((prevReception_name) => ({
          ...prevReception_name,
          ...newReception_name,
        }));
        setDDate((prevDDate) => ({ ...prevDDate, ...newDeliveryDate }));
      }
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message || error
      );
      if (error.response?.status === 401) {
        // Specific handling for unauthorized, maybe try refresh again or logout
        console.error(
          "Unauthorized access - token might be invalid or expired."
        );
        await refreshAuthToken(); // Attempt refresh again or trigger logout
      }
      // Set empty state on error to avoid displaying stale data
      setOrders([]);
      setTotalOrders(0);
      setCategories([]);
      setDesigners([]);
      // Optional: Show error message to user using Swal or similar
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearchTerm,
    getAuthToken,
    refreshAuthToken,
  ]); // Add dependencies

  // --- Event Handlers (Keep existing handlers, add search handler) ---
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // No need to set page here, the useEffect below handles it
  };

  const handleComplete = async (id) => {
    // ... (keep existing handleComplete logic)
    try {
      const authToken = decryptData(localStorage.getItem("auth_token"));
      if (!authToken) {
        console.error("No auth token found");
        return;
      }

      const confirm = await Swal.fire({
        title: "آیا مطمئن هستید که می‌خواهید باقی‌مانده را تکمیل کنید؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "بله",
        cancelButtonText: "خیر",
      });

      if (confirm.isConfirmed) {
        const completeResponse = await axios.post(
          `${BASE_URL}/group/order-by-price/complete/${id}/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        await Swal.fire({
          title: "موفق!",
          text: "باقی‌مانده با موفقیت تکمیل شد.",
          icon: "success",
        });
      }
      fetchData(); // Refetch data after completion
    } catch (error) {
      console.error("Error completing order:", error);
      await Swal.fire({
        title: "خطا!",
        text: "مشکلی پیش آمد، دوباره تلاش کنید.",
        icon: "error",
      });
    }
  };

  const getCategoryName = useCallback(
    (categoryId) => {
      const category = categories.find((cat) => cat.id === categoryId);
      return category ? category.name : "نامشخص";
    },
    [categories]
  ); // Add categories dependency

  const handleShowAttribute = (order, status) => {
    setPassedOrder(order);
    setSelectedStatus(status);
    // setIsModelOpen(true); // This is called in the button's onClick directly
  };

  // --- useEffect Hooks ---
  useEffect(() => {
    fetchData();
    // Dependency array includes fetchData which includes its own dependencies (currentPage, debouncedSearchTerm, etc.)
  }, [fetchData]);

  // Effect to reset page to 1 when search term changes (debounced)
  useEffect(() => {
    // Check specifically if debouncedSearchTerm is defined to avoid triggering on initial mount
    // and only reset if not already on page 1
    if (debouncedSearchTerm !== undefined && currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]); // Only depend on the debounced term

  // --- Remove Client-Side Search Effect ---
  // useEffect(() => {
  //   if (searchTerm) {
  //     const results = orders.filter(/* ... */); // This is no longer needed
  //     setSearchResults(results);
  //   } else {
  //     setSearchResults([]);
  //   }
  // }, [searchTerm, orders, categories]);
  // const [searchResults, setSearchResults] = useState([]); // Remove this state

  // --- Loading State ---
  if (loading && orders.length === 0) {
    // Show initial loading indicator
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
    <div className="mt-8 px-4 md:px-10 pb-10">
      {" "}
      {/* Added padding bottom */}
      <h2 className="md:text-2xl text-base text-center font-Ray_black font-bold mb-4">
        لیست سفارشات تکمیلی
      </h2>
      {/* --- Search Bar Section (Similar to AddOrder) --- */}
      <div className="flex items-center justify-center mb-4 gap-x-3">
        <label
          htmlFor="orderSearch"
          className="block text-sm font-semibold whitespace-nowrap"
        >
          جستجو:
        </label>
        <input
          type="text"
          id="orderSearch"
          value={searchTerm}
          onChange={handleSearchChange}
          className="shadow appearance-none border rounded-md w-full md:w-1/2 lg:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="نام مشتری، سفارش، کتگوری..."
        />
        {searchTerm && ( // Show clear button conditionally
          <button
            onClick={() => setSearchTerm("")} // Clear the search term
            className="focus:outline-none secondry-btn" // Use your button style
          >
            پاک کردن
          </button>
        )}
        {/* Optional: Add search icon if desired */}
        {/* <FaSearch className="text-gray-500 ml-[-30px]" /> */}
      </div>
      {/* --- End Search Bar Section --- */}
      {/* Keep Bill Button as is */}
      {selectedOrders.length > 0 && (
        <button
          onClick={() => setIsTotalModelOpen(true)}
          className="secondry-btn my-4" // Added margin
        >
          نمایش بیل انتخاب شده‌ها
        </button>
      )}
      {/* Table Section with Loading Overlay */}
      <div className="relative w-full mx-auto overflow-x-auto lg:overflow-hidden">
        {/* Loading Overlay (shows during refetch/search) */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <span className="ml-2 text-gray-600">در حال بارگذاری...</span>
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

        {/* Table */}
        <center className={`w-full ${loading ? "opacity-50" : ""}`}>
          <div className="overflow-x-scroll lg:overflow-hidden w-full rounded-lg border border-gray-300 shadow-md">
            <table className="w-full ">
              <thead className=" ">
                <tr className="bg-green text-gray-100 text-center">
                  {/* Keep table headers as they are */}
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    نام مشتری
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    نام سفارش
                  </th>{" "}
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    پذیرش
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    دسته‌بندی
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    دیزاینر
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    قیمت کل
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    دریافتی
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    باقی‌مانده
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    تاریخ تحویل
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    حالت
                  </th>
                  <th
                    // onClick={() => handleClick()}
                    className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap"
                  >
                    جزئیات
                  </th>
                </tr>
              </thead>
              <tbody className="">
                {orders && orders.length > 0 ? (
                  (isClicked ? orders.slice(0, 5) : orders).map((order) => (
                    <tr
                      key={order.id}
                      className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                    >
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {order.customer_name || "در حال بارگذاری..."}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {order.order_name || "در حال بارگذاری..."}
                      </td>{" "}
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {(() => {
                          const user = users.find(
                            (user) => user.id === reception_name[order.id]
                          );
                          return user
                            ? `${user.first_name} ${user.last_name}`
                            : "در حال بارگذاری...";
                        })()}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {getCategoryName(order.category) ||
                          "در حال بارگذاری..."}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {order.designer_details.full_name || "Unknown Designer"}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {prices[order.id] || "در حال بارگذاری..."}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {receivedPrices[order.id] || "در حال بارگذاری..."}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {remaindedPrices[order.id] || "در حال بارگذاری..."}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {DDate[order.id] || "در حال بارگذاری..."}
                      </td>
                      <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        {order.status || "در حال بارگذاری..."}
                      </td>
                      <td className="flex items-center gap-x-5 border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                        <button
                          onClick={() => {
                            handleShowAttribute(order, order.status);
                            setIsModelOpen(true);
                          }}
                          className="secondry-btn"
                        >
                          نمایش
                        </button>
                        <button
                          onClick={() => {
                            setShowPrice(true);
                            setEditingPriceId(order.id);
                          }}
                        >
                          <FaEdit size={20} className="text-green" />
                        </button>
                        <button
                          onClick={() => {
                            handleComplete(order.id);
                          }}
                          className="text-green"
                        >
                          <FaCheck />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="border p-3 text-center">
                      هیچ سفارشی با وضعیت 'گرفته شده' وجود ندارد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (Ensure totalOrders is passed correctly) */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalOrders={totalOrders} // Use totalOrders from state
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        </center>
      </div>
      {/* --- Modals (Keep Bill and Price Modals as is) --- */}
      {isModelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsModelOpen(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {" "}
            {/* Added padding */}
            <div className="relative bg-white rounded-lg shadow-xl w-[148mm] max-h-[90vh] ">
              {" "}
              {/* Max height and scroll */}
              {/* Close button inside */}
              <button
                onClick={() => setIsModelOpen(false)}
                className="absolute top-2 right-2 bg-gray-200 rounded-full p-1 text-red-600 hover:bg-gray-300 z-50"
                aria-label="Close modal" // Accessibility
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {/* Bill content with ID */}
              <div id="bill-content" className="p-4">
                {" "}
                {/* Adjust padding as needed */}
                <Bill
                  order={passedOrder}
                  orders={orders.filter((order) =>
                    selectedOrders.includes(order.id)
                  )} // Pass selected if needed, or just passedOrder
                />
              </div>
              {/* Print button outside the scrollable content, positioned relative to the modal */}
              <div className="sticky bottom-0 bg-white p-3 border-t text-center">
                <button onClick={printBill} className="secondry-btn z-50">
                  چاپ بیل
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {isTotalModelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsTotalModelOpen(false)}
          ></div>
          {/* Centered Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              {/* Close button */}
              <button
                onClick={() => setIsTotalModelOpen(false)}
                className="absolute top-2 right-2 bg-gray-200 rounded-full p-1 text-red-600 hover:bg-gray-300 z-50"
                aria-label="Close total bill modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {/* Total Bill Content */}
              <div className="p-6">
                {" "}
                {/* Add padding */}
                <BillTotalpage
                  orders={orders.filter((order) =>
                    selectedOrders.includes(order.id)
                  )}
                  // Pass other necessary props if BillTotalpage requires them
                />
              </div>
              {/* Optional: Add print button for total bill if needed */}
              {/* <div className="sticky bottom-0 bg-white p-3 border-t text-center">
                             <button onClick={handlePrintTotalBill} className="secondry-btn">چاپ بیل کلی</button>
                         </div> */}
            </div>
          </div>
        </>
      )}
      {showPrice &&
        editingPriceId && ( // Ensure editingPriceId is set before rendering
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <Price
              editingPriceId={editingPriceId}
              setShowPrice={setShowPrice}
              onPriceUpdate={fetchData} // Pass fetchData to refresh after update
            />
          </div>
        )}
    </div>
  );
};

export default TokenOrders;
