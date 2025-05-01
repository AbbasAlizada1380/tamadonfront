import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Bill from "../../Bill_Page/Bill";
import CryptoJS from "crypto-js";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import vazirmatnFont from "/vazirmatnBase64.txt"; // Ensure this is a valid Base64 font
import SearchBar from "../../../Utilities/Searching"; // Adjust path if needed
import Pagination from "../../../Utilities/Pagination"; // Adjust path if needed
import { CiEdit } from "react-icons/ci";
import { FaCheck, FaEdit } from "react-icons/fa";
import { Price } from "./Price";

import Swal from "sweetalert2";
import BillTotalpage from "../../Bill_Page/BillTotalpage";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const PTokenOrders = () => {
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
  const [DDate, setDDate] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [searchResults, setSearchResults] = useState([]); // Search results state
  const [showPrice, setShowPrice] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const secretKey = "TET4-1";

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
  const printBill = async () => {
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

  const getAuthToken = () => decryptData(localStorage.getItem("auth_token"));

  const isTokenExpired = (token) => {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  };

  const refreshAuthToken = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/user/token/refresh/`
      );
      const newAuthToken = response.data.access;
      decryptData(localStorage.setItem("auth_token", newAuthToken));
      return newAuthToken;
    } catch (error) {
      console.error("Unable to refresh token", error);
      return null;
    }
  };

  const fetchData = async (pageUrl = null) => {
    let token = getAuthToken();

    if (!token) {
      console.error("No authentication token found.");
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      token = await refreshAuthToken();
      if (!token) {
        console.error("Unable to refresh token.");
        setLoading(false);
        return;
      }
    }

    try {
      // Determine which URL to use for fetching orders
      const ordersUrl =
        pageUrl ||
        `${BASE_URL}/group/group/orders/reception_list/?pagenum=${currentPage}`;

      const [ordersResponse, categoriesResponse, usersResponse] =
        await Promise.all([
          axios.get(ordersUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/group/categories/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/users/api/users/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
      setOrders(ordersResponse.data.results);
      setTotalOrders(ordersResponse.data.count);
      setTotalCount(ordersResponse.data.count || 0);
      setTotalPages(Math.ceil(ordersResponse.data.count / 10)); // Assuming 10 items per page
      setCategories(categoriesResponse.data || []);
      setDesigners(usersResponse.data || []);

      const newPrices = {};
      const newReceived = {};
      const newRemainded = {};
      const newDeliveryDate = {};

      await Promise.all(
        ordersResponse.data.results.map(async (order) => {
          try {
            const priceResponse = await axios.get(
              `${BASE_URL}/group/order-by-price/`,
              {
                params: { order: order.id },
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            const data1 = priceResponse.data;
            if (data1 && data1.length > 0) {
              newPrices[order.id] = data1[0].price;
              newReceived[order.id] = data1[0].receive_price;
              newRemainded[order.id] = data1[0].reminder_price;
              newDeliveryDate[order.id] = data1[0].delivery_date;
            } else {
              console.warn(`No price data found for order ID: ${order.id}`);
            }
          } catch (priceError) {
            console.error(
              `Error fetching price for order ID: ${order.id}`,
              priceError
            );
          }
        })
      );

      setPrices((prevPrices) => ({ ...prevPrices, ...newPrices }));
      setReceivedPrices((prevReceived) => ({
        ...prevReceived,
        ...newReceived,
      }));
      setRemaindedPrices((prevRemainded) => ({
        ...prevRemainded,
        ...newRemainded,
      }));
      setDDate((prevDDate) => ({ ...prevDDate, ...newDeliveryDate }));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  const handleComplete = async (id) => {
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
      fetchData();
    } catch (error) {
      console.error("Error completing order:", error);
      await Swal.fire({
        title: "خطا!",
        text: "مشکلی پیش آمد، دوباره تلاش کنید.",
        icon: "error",
      });
    }
  };
  useEffect(() => {
    fetchData();
  }, [currentPage, showPrice]);

  useEffect(() => {
    if (searchTerm) {
      const results = orders.filter((order) => {
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
      setSearchResults(results);
      setCurrentPage(1); // Reset to first page on new search
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, orders, categories]);

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "نامشخص";
  };

  const handleShowAttribute = (order, status) => {
    setPassedOrder(order);
    setSelectedStatus(status);
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  // Show loading message while fetching data
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
    <div className="mt-8 px-10 ">
      <h2 className="md:text-2xl text-base text-center font-Ray_black font-bold mb-4">
        لیست سفارشات تکمیلی
      </h2>

      {/* Search Bar */}
      <SearchBar
        placeholder="جستجو در سفارشات"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {selectedOrders.length > 0 && (
        <button
          onClick={() => setIsTotalModelOpen(true)}
          className="secondry-btn mt-4"
        >
          نمایش بیل انتخاب شده‌ها
        </button>
      )}
      <center>
        <div className="overflow-x-scroll lg:overflow-hidden w-[420px] md:w-full rounded-lg">
          <table className="w-full  rounded-lg border  border-gray-300 shadow-md">
            <thead className=" ">
              <tr className="bg-green text-gray-100 text-center">
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  نام مشتری
                </th>
                <th className="border border-gray-300 px-6 py-2.5 tfont-semibold text-sm md:text-base">
                  نام سفارش
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  دسته‌بندی
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  دیزاینر
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  قیمت کل
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  قیمت دریافت شده
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  قیمت باقی‌مانده
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  تاریخ تحویل
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  حالت
                </th>
                <th className="border border-gray-300 px-6 py-2.5  font-semibold text-sm md:text-base">
                  جزئیات
                </th>
              </tr>
            </thead>
            <tbody className="">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                  >
                    <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                      {order.customer_name || "در حال بارگذاری..."}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                      {order.order_name || "در حال بارگذاری..."}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                      {getCategoryName(order.category) || "در حال بارگذاری..."}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700 text-sm md:text-base">
                      <td className="border-gray-300 px-6 py-2 text-gray-700">
                        {order.designer_details.full_name || "Unknown Designer"}
                      </td>
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
                        className=""
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
        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalOrders={totalOrders}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </center>
      {/* Show Bill Button */}

      {/* Popup */}
      {isModelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsModelOpen(false)}
          ></div>

          {/* Centered Modal */}
          <div className="fixed inset-0 flex  justify-center z-50">
            <div
              id="bill-content"
              className="bg-opacity-75 h-[210mm] w-[148mm] bg-white p- pb-20 relative"
            >
              {/* Close button */}
              <button
                onClick={() => setIsModelOpen(false)}
                className="absolute top-1/2 -translate-y-1/2 -right-20 border-gray-900 bg-gray-400 rounded-full p-1 h-10 w-10 text-red-800 text-3xl z-50"
              >
                ✕
              </button>

              {/* Bill content */}
              <Bill
                order={passedOrder}
                orders={orders.filter((order) =>
                  selectedOrders.includes(order.id)
                )}
              />

              {/* Print Bill button */}
              <button
                onClick={printBill}
                className="absolute -bottom-14 secondry-btn z-50"
              >
                چاپ بیل
              </button>
            </div>
          </div>
        </>
      )}
      {showPrice && (
        <div>
          <Price editingPriceId={editingPriceId} setShowPrice={setShowPrice} />
        </div>
      )}
    </div>
  );
};

export default PTokenOrders;
