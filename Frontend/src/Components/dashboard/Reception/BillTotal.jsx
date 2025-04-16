import React, { useEffect, useState } from "react";
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

const BillTotal = () => {
  const [orders, setOrders] = useState([]);
  const [passedOrder, setPassedOrder] = useState([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isTotalModelOpen, setIsTotalModelOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [prices, setPrices] = useState({});
  const [receivedPrices, setReceivedPrices] = useState({});
  const [remaindedPrices, setRemaindedPrices] = useState({});
  const [DDate, setDDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAttribute, setSelectedAttribute] = useState([]);
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
  const status = [
    { id: 1, name: "Designer" },
    { id: 2, name: "Reception" },
    // { id: 0, name: "Admin" },
    { id: 3, name: "Head of designers" },
    { id: 4, name: "Printer" },
    { id: 5, name: "Delivery Agent" },
    { id: 6, name: "Digital" },
    { id: 7, name: "Bill" },
    { id: 8, name: "Chaspak" },
    { id: 9, name: "Shop role" },
    { id: 10, name: "Laser" },
  ];
  const toggleOrderSelection = (neworder) => {
    setSelectedOrders((prevSelected) =>
      prevSelected.includes(neworder)
        ? prevSelected.filter((order) => order !== neworder)
        : [...prevSelected, neworder]
    );
  };

  const printBill = async () => {
    const element = document.getElementById("bill-content");
    if (!element) {
      console.error("Bill content not found!");
      return;
    }

    try {
      // Fixed bill size (190mm x 320mm)
      const billWidth = 210;
      const billHeight = 148;

      const pdf = new jsPDF({
        orientation: "Landscape",
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

      const imgData = canvas.toDataURL("image/jpeg", 0.5);

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

  const fetchData = async () => {
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
      const [ordersResponse, categoriesResponse, usersResponse] =
        await Promise.all([
          axios.get(`${BASE_URL}/group/order/`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { status: "done" }, // Fetch only "done" orders
          }),
          axios.get(`${BASE_URL}/group/categories/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/users/api/users/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      setOrders(ordersResponse.data);
      setCategories(categoriesResponse.data);
      setDesigners(usersResponse.data);

      const newPrices = {};
      const newReceived = {};
      const newRemainded = {};
      const newDeliveryDate = {};

      await Promise.all(
        ordersResponse.data.map(async (order) => {
          try {
            const priceResponse = await axios.get(
              `${BASE_URL}/group/order-by-price/`,
              { params: { order: order.id } }
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
  }, [showPrice]);

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

  const getDesignerName = (designerId) => {
    const designer = designers.find((des) => des.id === designerId);
    return designer ? designer.first_name : "نامشخص";
  };

  const handleShowAttribute = (order, status) => {
    setPassedOrder(order);
    setSelectedStatus(status);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const dataToPaginate = searchResults.length > 0 ? searchResults : orders;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(dataToPaginate.length / postsPerPage);
  const paginatedOrders = [...dataToPaginate] // Create a copy to avoid mutation
    .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  if (loading) return <div>Loading...</div>;

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
                <th className="border border-gray-300 px-6 py-2.5 font-semibold text-sm md:text-base">
                  انتخاب
                </th>
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
              {orders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                  >
                    {" "}
                    <td className="border-gray-300 px-6 py-2">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order)}
                        onChange={() => toggleOrderSelection(order)}
                      />
                    </td>
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
                      {getDesignerName(order.designer) || "در حال بارگذاری..."}
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
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </center>
      {/* Show Bill Button */}

      {/* Popup */}
      {isModelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsModelOpen(false)}
          ></div>

          <div
            id="bill-content"
            className="scale-75 fixed inset-0 bg-opacity-75 flex top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center justify-center z-50"
          >
            <button
              onClick={() => setIsModelOpen(!isModelOpen)}
              className="absolute -top-16 border-gray-900 bg-gray-400 rounded-full p-1 h-10 w-10 text-red-800 text-3xl z-50"
            >
              ✕
            </button>
            <Bill
              order={passedOrder}
              orders={orders.filter((order) =>
                selectedOrders.includes(order.id)
              )}
            />
            <button
              onClick={printBill}
              className="absolute secondry-btn -bottom-20 text-lg px-4  z-50"
            >
              چاپ بیل
            </button>
          </div>
        </>
      )}
      {isTotalModelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsModelOpen(false)}
          ></div>

          <div
            id="bill-content"
            className="scale-75 fixed inset-0 bg-opacity-75 flex top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center justify-center z-50"
          >
            <button
              onClick={() => setIsTotalModelOpen(!isTotalModelOpen)}
              className="absolute -top-16 border-gray-900 bg-gray-400 rounded-full p-1 h-10 w-10 text-red-800 text-3xl z-50"
            >
              ✕
            </button>
            <BillTotalpage
              // order={passedOrder}
              orders={orders.filter((order) => selectedOrders.includes(order))}
            />
            <button
              onClick={printBill}
              className="absolute secondry-btn -bottom-20 text-lg px-4  z-50"
            >
              چاپ بیل
            </button>
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

export default BillTotal;
