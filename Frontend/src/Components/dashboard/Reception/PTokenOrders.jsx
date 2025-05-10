import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Bill from "../../Bill_Page/Bill";
import CryptoJS from "crypto-js";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import vazirmatnFont from "/vazirmatnBase64.txt"; // Ensure this is a valid Base64 font
import SearchBar from "../../../Utilities/Searching"; // Using your SearchBar component
import { useDebounce } from "use-debounce"; // Import useDebounce
import Pagination from "../../../Utilities/Pagination"; // Adjust path if needed
// import { CiEdit } from "react-icons/ci"; // Not used directly
import { FaCheck, FaEdit } from "react-icons/fa";
import { Price } from "./Price";

import Swal from "sweetalert2";
import BillTotalpage from "../../Bill_Page/BillTotalpage"; // Kept, though selectedOrders logic for it might need review if not used
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Define the API endpoint for fetching orders (from your original PTokenOrders)
const PTOKEN_ORDERS_API_ENDPOINT = `${BASE_URL}/group/group/orders/reception_list/`;

const PTokenOrders = () => {
  const [orders, setOrders] = useState([]);
  const [passedOrder, setPassedOrder] = useState(null); // Keep as is
  const [totalOrders, setTotalOrders] = useState(0);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isTotalModelOpen, setIsTotalModelOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [prices, setPrices] = useState({});
  const [receivedPrices, setReceivedPrices] = useState({});
  const [remaindedPrices, setRemaindedPrices] = useState({});
  const [DDate, setDDate] = useState({});
  // const [totalCount, setTotalCount] = useState(0); // Redundant with totalOrders, removed
  const [loading, setLoading] = useState(true);
  const pageSize = 20; // Your defined page size
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // Kept as in original
  const [selectedStatus, setSelectedStatus] = useState({});

  // --- Search State ---
  const [searchTerm, setSearchTerm] = useState(""); // Raw search input from SearchBar
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounced value for API
  // const [searchResults, setSearchResults] = useState([]); // Removed, data comes from server

  const [showPrice, setShowPrice] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const secretKey = "TET4-1";

  // --- Decryption Function (Made robust like TokenOrders) ---
  const decryptData = useCallback((hashedData) => {
    if (!hashedData) {
      // console.error("No data to decrypt");
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

  const printBill = async () => {
    const element = document.getElementById("bill-content");
    if (!element) {
      console.error("Bill content not found!");
      return;
    }
    try {
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
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 0, 0, billWidth, billHeight);
      pdf.autoPrint();
      window.open(pdf.output("bloburl"), "_blank");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // --- Auth Functions (Made robust like TokenOrders) ---
  const getAuthToken = useCallback(
    () => decryptData(localStorage.getItem("auth_token")),
    [decryptData]
  );

  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  }, []);

  const refreshAuthToken = useCallback(async () => {
    try {
      const refreshToken = decryptData(localStorage.getItem("refresh_token"));
      if (!refreshToken) throw new Error("Refresh token not found.");

      const response = await axios.post(
        `${BASE_URL}/users/user/token/refresh/`,
        { refresh: refreshToken }
      );
      const newAuthToken = response.data.access;
      const encryptedToken = CryptoJS.AES.encrypt(
        JSON.stringify(newAuthToken),
        secretKey
      ).toString();
      localStorage.setItem("auth_token", encryptedToken);
      console.log("Token refreshed successfully for PTokenOrders.");
      return newAuthToken;
    } catch (error) {
      console.error("Unable to refresh token for PTokenOrders", error);
      return null;
    }
  }, [decryptData]); // secretKey is constant

  // --- Fetch Data Function (Modified for Server-Side Search) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    let token = getAuthToken();

    if (!token) {
      console.error("No authentication token found.");
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      token = await refreshAuthToken();
      if (!token) {
        console.error("Unable to refresh token. Aborting fetch.");
        setLoading(false);
        return;
      }
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams({
        pagenum: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      const ordersUrl = `${PTOKEN_ORDERS_API_ENDPOINT}?${params.toString()}`;

      const [ordersResponse, categoriesResponse, usersResponse] =
        await Promise.all([
          axios.get(ordersUrl, { headers }),
          axios.get(`${BASE_URL}/group/categories/`, { headers }),
          axios.get(`${BASE_URL}/users/api/users/`, { headers }),
        ]);

      setOrders(ordersResponse.data.results || []);
      setTotalOrders(ordersResponse.data.count || 0);
      setTotalPages(Math.ceil((ordersResponse.data.count || 0) / pageSize)); // Corrected to use pageSize
      setCategories(categoriesResponse.data || []);
      setDesigners(usersResponse.data || []);

      const newPrices = {};
      const newReceived = {};
      const newRemainded = {};
      const newDeliveryDate = {};

      if (ordersResponse.data.results) {
        await Promise.all(
          ordersResponse.data.results.map(async (order) => {
            try {
              const priceResponse = await axios.get(
                `${BASE_URL}/group/order-by-price/`,
                { params: { order: order.id }, headers } // Pass headers with token
              );
              const data1 = priceResponse.data;
              if (data1 && data1.length > 0) {
                newPrices[order.id] = data1[0].price;
                newReceived[order.id] = data1[0].receive_price;
                newRemainded[order.id] = data1[0].reminder_price;
                newDeliveryDate[order.id] = data1[0].delivery_date;
              } else {
                // console.warn(`No price data for order ID: ${order.id}`);
              }
            } catch (priceError) {
              if (priceError.response?.status !== 404) {
                console.error(
                  `Error fetching price for order ID: ${order.id}`,
                  priceError
                );
              }
              // Set defaults if price fetch fails or no data
              newPrices[order.id] = newPrices[order.id] ?? "N/A";
              newReceived[order.id] = newReceived[order.id] ?? "N/A";
              newRemainded[order.id] = newRemainded[order.id] ?? "N/A";
              newDeliveryDate[order.id] = newDeliveryDate[order.id] ?? "N/A";
            }
          })
        );
        setPrices((prev) => ({ ...prev, ...newPrices }));
        setReceivedPrices((prev) => ({ ...prev, ...newReceived }));
        setRemaindedPrices((prev) => ({ ...prev, ...newRemainded }));
        setDDate((prev) => ({ ...prev, ...newDeliveryDate }));
      }
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        await refreshAuthToken();
      }
      setOrders([]); // Clear orders on error
      setTotalOrders(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearchTerm,
    getAuthToken,
    isTokenExpired,
    refreshAuthToken,
    showPrice,
  ]); // Added showPrice from original dependencies

  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleComplete = async (id) => {
    try {
      const authToken = getAuthToken(); // Use the callback version
      if (!authToken) {
        Swal.fire("خطا", "ابتدا وارد شوید.", "error");
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
        await axios.post(
          `${BASE_URL}/group/order-by-price/complete/${id}/`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        Swal.fire("موفق!", "باقی‌مانده با موفقیت تکمیل شد.", "success");
        fetchData(); // Refetch data
      }
    } catch (error) {
      console.error("Error completing order:", error);
      Swal.fire("خطا!", "مشکلی پیش آمد، دوباره تلاش کنید.", "error");
    }
  };

  // --- useEffect Hooks ---
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]); // fetchData now includes all its dependencies for fetching

  // Effect to reset page to 1 when debouncedSearchTerm changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined && currentPage !== 1) {
      // Check debouncedSearchTerm is defined to avoid initial trigger
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]); // Only depends on debouncedSearchTerm

  // Client-side search useEffect REMOVED:
  // useEffect(() => {
  //   if (searchTerm) { ... } else { setSearchResults([]); }
  // }, [searchTerm, orders, categories]);

  const getCategoryName = useCallback(
    (categoryId) => {
      const category = categories.find((cat) => cat.id === categoryId);
      return category ? category.name : "نامشخص";
    },
    [categories]
  );

  const handleShowAttribute = (order, status) => {
    setPassedOrder(order);
    setSelectedStatus(status);
    // setIsModelOpen(true); // Called in button onClick
  };

  const handleSearchChange = (e) => {
    // Used by your SearchBar component
    setSearchTerm(e.target.value);
  };

  if (loading && orders.length === 0) {
    // Show initial loading only if no orders are displayed
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader mr-3"></div>
        <span className="text-xl font-semibold">در حال بارگذاری...</span>
        <style jsx>{`
          .loader {
            /* ... same style ... */
          }
          @keyframes spin {
            /* ... same style ... */
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mt-8 px-4 md:px-10 pb-10">
      {" "}
      {/* Added pb-10 for spacing from TokenOrders */}
      <h2 className="md:text-2xl text-base text-center font-Ray_black font-bold mb-4">
        لیست سفارشات تکمیلی
      </h2>
      {/* Search Bar (using your existing component) */}
      <div className="flex justify-center mb-4">
        <SearchBar
          placeholder="جستجو در سفارشات..."
          value={searchTerm}
          onChange={handleSearchChange}
          // Add any other props your SearchBar might need, like a clear button if it has one
        />
        {/* Optional: Add a clear button next to your SearchBar if it doesn't have one */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="ml-2 focus:outline-none secondry-btn px-3 py-1" // Adjust styling as needed
          >
            پاک کردن
          </button>
        )}
      </div>
      {selectedOrders.length > 0 && ( // This was in your original code
        <button
          onClick={() => setIsTotalModelOpen(true)}
          className="secondry-btn my-4" // Added margin like TokenOrders
        >
          نمایش بیل انتخاب شده‌ها
        </button>
      )}
      {/* Table Section with Loading Overlay for subsequent loads/searches */}
      <div className="relative w-full mx-auto overflow-x-auto lg:overflow-hidden">
        {loading &&
          orders.length > 0 && ( // Show overlay when reloading/searching
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              {/* Loader animation */}
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
        <center
          className={`w-full ${
            loading && orders.length > 0 ? "opacity-50" : ""
          }`}
        >
          {" "}
          {/* Dim content during load */}
          <div className="overflow-x-scroll lg:overflow-hidden w-full md:w-full rounded-lg border border-gray-300 shadow-md">
            {" "}
            {/* Adjusted width from original w-[420px] */}
            <table className="w-full">
              <thead className=" ">
                <tr className="bg-green text-gray-100 text-center">
                  {/* Headers kept as in your original PTokenOrders, with consistent padding */}
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    نام مشتری
                  </th>
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    نام سفارش
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
                  <th className="border border-gray-300 px-4 py-2.5 font-semibold text-sm md:text-base whitespace-nowrap">
                    جزئیات
                  </th>
                </tr>
              </thead>
              <tbody className="">
                {/* Render directly from 'orders' state (server-filtered data) */}
                {!loading && orders && orders.length > 0
                  ? orders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                      >
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {order.customer_name || "-"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {order.order_name || "-"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {getCategoryName(order.category) || "-"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {order.designer_details?.full_name || "نامشخص"}{" "}
                          {/* Corrected nested <td> from original */}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {prices[order.id] ?? "N/A"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {receivedPrices[order.id] ?? "N/A"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {remaindedPrices[order.id] ?? "N/A"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {DDate[order.id] ?? "N/A"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {order.status || "-"}
                        </td>
                        <td className="border-gray-300 px-4 py-2 text-gray-700 text-sm md:text-base">
                          {" "}
                          {/* Adjusted padding for consistency */}
                          <div className="flex items-center justify-center gap-x-3">
                            {" "}
                            {/* Flex container from TokenOrders for button alignment */}
                            <button
                              onClick={() => {
                                handleShowAttribute(order, order.status);
                                setIsModelOpen(true);
                              }}
                              className="secondry-btn px-2 py-1 text-xs" // Smaller button
                            >
                              نمایش
                            </button>
                            <button
                              onClick={() => {
                                setShowPrice(true);
                                setEditingPriceId(order.id);
                              }}
                              className="text-blue-600 hover:text-blue-800" // Example styling
                            >
                              <FaEdit size={18} />
                            </button>
                            {remaindedPrices[order.id] != null &&
                              remaindedPrices[order.id] > 0 && (
                                <button
                                  onClick={() => {
                                    handleComplete(order.id);
                                  }}
                                  className="text-green hover:text-green-700" // Example styling
                                >
                                  <FaCheck size={18} />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  : !loading && (
                      <tr>
                        <td
                          colSpan="10"
                          className="border p-4 text-center text-gray-500"
                        >
                          {searchTerm
                            ? "هیچ سفارشی مطابق با جستجوی شما یافت نشد."
                            : "هیچ سفارشی یافت نشد."}
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalOrders={totalOrders} // Use totalOrders from state
              pageSize={pageSize}
              onPageChange={onPageChange}
              // totalPages={totalPages} // Pagination can calculate this or use totalOrders
            />
          </div>
        </center>
      </div>
      {/* Modals (kept your original modal structure and triggering) */}
      {isModelOpen && passedOrder /* Ensure passedOrder is available */ && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsModelOpen(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Adjusted modal styling to be more like TokenOrders for consistency, but content is yours */}
            <div className="relative bg-white rounded-lg shadow-xl w-[148mm] max-h-[90vh]">
              <button
                onClick={() => setIsModelOpen(false)}
                className="absolute top-2 right-2 bg-gray-200 rounded-full p-1 text-red-600 hover:bg-gray-300 z-50"
                aria-label="Close modal"
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
              <div id="bill-content" className="p-4">
                {" "}
                {/* Bill content wrapper */}
                <Bill
                  order={passedOrder} // Using passedOrder as per your original logic
                  orders={orders.filter((order) =>
                    selectedOrders.includes(order.id)
                  )} // Kept from original, ensure selectedOrders is managed if this is used
                />
              </div>
              <div className="sticky bottom-0 bg-white p-3 border-t text-center">
                {" "}
                {/* Print button container */}
                <button onClick={printBill} className="secondry-btn z-50">
                  چاپ بیل
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* isTotalModelOpen modal - kept from your original for selectedOrders bill */}
      {isTotalModelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsTotalModelOpen(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
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
              <div className="p-6">
                <BillTotalpage
                  orders={orders.filter((order) =>
                    selectedOrders.includes(order.id)
                  )}
                />
              </div>
            </div>
          </div>
        </>
      )}
      {showPrice &&
        editingPriceId && ( // Ensure editingPriceId is set
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

export default PTokenOrders;
