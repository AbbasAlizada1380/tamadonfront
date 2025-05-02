import axios from "axios";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import SearchBar from "../../../Utilities/Searching";
import Pagination from "../../../Utilities/Pagination";
import jalaali from "jalaali-js";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const ReceivedList = () => {
  const secretKey = "TET4-1";
  const decryptData = useCallback(
    (hashedData) => {
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
    },
    [secretKey]
  );

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState();
  const [orderPrice, setOrderprice] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20;

  const [userRole, setUserRole] = useState(
    decryptData(localStorage.getItem("role"))
  );
  const [loading, setLoading] = useState(true);
  const [deliverDate, setDeliveryDate] = useState();
  const roles = [
    { id: 1, name: "Designer" },
    { id: 2, name: "Reception" },
    // { id: 0, name: "Admin" },
    { id: 3, name: "Head_of_designers" },
    { id: 4, name: "Printer" },
    { id: 5, name: "Delivery" },
    { id: 6, name: "Digital" },
    { id: 7, name: "Bill" },
    { id: 8, name: "Chaspak" },
    { id: 9, name: "Shop_role" },
    { id: 10, name: "Laser" },
  ];

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
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, []);
  const getTakenList = useCallback(
    async (currentPage) => {
      try {
        const token = decryptData(localStorage.getItem("auth_token"));
        const newrole = roles.find((r) => r.id == userRole)?.name;
        const response = await axios.get(
          `${BASE_URL}/group/orders/status_list/${newrole}/?pagenum=${currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setOrders(response.data.results);
        console.log(response.data.results);

        setTotalOrders(response.data.count);
      } catch (err) {
        console.error("Error fetching List", err);
        setOrders([]); // Ensure orders is always an array
      }
    },
    [BASE_URL, userRole]
  );
  const getDetails = useCallback(
    async (id) => {
      try {
        const token = decryptData(localStorage.getItem("auth_token"));
        const response = await axios.get(
          `${BASE_URL}/group/order-by-price/?order=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setOrderprice(response.data);
        setIsModelOpen(!isModelOpen);
      } catch (err) {
        console.error("Error fetching order details:", err);
      }
    },
    [BASE_URL, decryptData]
  );
  const convertToHijriShamsi = (dateString) => {
    // Parse the date string
    const date = new Date(dateString);

    // Extract the Gregorian year, month, and day
    const gYear = date.getFullYear();
    const gMonth = date.getMonth() + 1; // Months are zero-indexed
    const gDay = date.getDate();

    // Convert to Hijri Shamsi
    const { jy, jm, jd } = jalaali.toJalaali(gYear, gMonth, gDay);

    // Format the date as "yyyy/mm/dd"
    return `${jy}/${jm.toString().padStart(2, "0")}/${jd
      .toString()
      .padStart(2, "0")}`;
  };
  const handleAdd = useCallback(
    async (order) => {
      const result = await Swal.fire({
        title: "آیا مطمئن هستید؟",
        text: "این سفارش به وضعیت 'کامل' تغییر خواهد کرد!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "بله، تغییر بده",
        cancelButtonText: "لغو",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      console.log(order);

      let nextStatus;
      const category = categories.find((cat) => cat.id === order.category);

      if (category && Array.isArray(category.stages)) {
        const currentIndex = category.stages.indexOf(order.status);

        if (currentIndex !== -1 && currentIndex < category.stages.length - 1) {
          nextStatus = category.stages[currentIndex + 1];
        } else {
          console.log("No next status available.");
          return;
        }
      } else {
        console.log("Stages not found or not an array.");
        return;
      }

      try {
        console.log(order.id, nextStatus);

        await axios.post(`${BASE_URL}/group/orders/update-status/`, {
          order_id: order.id,
          status: nextStatus,
        });

        // ✅ Correctly update the order status without removing the order
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o.id === order.id ? { ...o, status: nextStatus } : o
          )
        );

        Swal.fire({
          icon: "success",
          title: "سفارش بروزرسانی شد",
          text: `وضعیت سفارش به 'کامل' تغییر کرد.`,
          confirmButtonText: "باشه",
        });
        getTakenList(currentPage);
      } catch (err) {
        console.error("Error changing status", err);

        Swal.fire({
          icon: "error",
          title: "خطا در تغییر وضعیت",
          text: "مشکلی در تغییر وضعیت سفارش به وجود آمد. لطفاً دوباره تلاش کنید.",
          confirmButtonText: "متوجه شدم",
        });
      }
    },
    [BASE_URL, categories]
  );

  const handleClosePopup = useCallback(() => {
    setIsModelOpen(false);
  }, []);

  useEffect(() => {
    getTakenList(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const handleStorageChange = () => {
      const roleData = localStorage.getItem("role");
      if (roleData) {
        try {
          const decryptedRole = decryptData(roleData);
          if (
            typeof decryptedRole === "object" &&
            Array.isArray(decryptedRole) &&
            decryptedRole.length > 0
          ) {
            const roleValue = decryptedRole[0];
            if (typeof roleValue === "number") {
              setUserRole(roleValue);
            } else {
              console.warn("Role must be number, but is not.");
            }
          }
        } catch (error) {
          console.error("Error decrypting role:", error);
        }
      } else {
        console.warn("No 'role' found in localStorage.");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [decryptData]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return []; // Ensure it’s an array

    return orders;
  }, [orders, userRole]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const results = filteredOrders.filter((order) => {
        const customerName = order.customer_name || "";
        const orderName = order.order_name || "";

        return (
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          orderName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, filteredOrders, categories]);

  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[400px] md:w-[700px] mt-10 lg:w-[70%] mx-auto lg:overflow-hidden">
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات دریافتی
      </h2>
      <SearchBar
        placeholder="جستجو..."
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <div className="overflow-x-scroll lg:overflow-hidden bg-white w-full rounded-lg md:w-full">
        <table className="min-w-full bg-white rounded-lg border border-gray-200">
          <thead className="bg-gray-100">
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                کد سفارش{" "}
              </th>{" "}
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                مشتری
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نام سفارش
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                طراح
              </th>{" "}
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                حالت
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                دسته بندی
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                اقدامات
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order, index) => {
                const designer = users.find(
                  (user) => user.id === order.designer
                );
                const categoryName =
                  categories.find((category) => category.id === order.category)
                    ?.name || "دسته‌بندی نامشخص";

                return (
                  <tr
                    key={order.id}
                    className={`text-center font-bold border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100 transition-all`}
                  >
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">
                      {order.secret_key}
                    </td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">
                      {order.customer_name}
                    </td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">
                      {order.order_name}
                    </td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">
                      {order.designer_details.full_name}
                    </td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">
                      {order.status}
                    </td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">
                      {categoryName}
                    </td>
                    <td className="border border-gray-300 px-6 py-2 flex items-center gap-x-5 justify-center text-gray-700">
                      <button
                        onClick={() => handleAdd(order)}
                        className="secondry-btn"
                      >
                        تایید تکمیلی
                      </button>
                      <button
                        onClick={() => {
                          setOrderDetails(order);
                          getDetails(order.id);
                          setSelectedOrderId(order.id);
                        }}
                        className="secondry-btn"
                      >
                        جزئیات
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="border p-2 text-center text-gray-600"
                >
                  هیچ سفارشی برای وضعیت "{searchTerm ? "جستجو" : "در انتظار"}"
                  پیدا نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalOrders={totalOrders}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />

      {isModelOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg  w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              اطلاعات سفارش
            </h3>
            <div className="bg-gray-100 p-4 rounded overflow-auto text-sm space-y-2">
              {orderDetails.attributes &&
                Object.entries(orderDetails.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center border-b border-gray-300 pb-2"
                  >
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}

              {/* Description */}
              {orderDetails.description && (
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium text-gray-700">توضیحات:</span>
                  <span className="text-gray-900">
                    {orderDetails.description}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">تاریخ اخذ</span>
                <span className="text-gray-900">
                  {convertToHijriShamsi(orderDetails.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">تاریخ تحویل</span>
                <span className="text-gray-900">
                  {orderPrice[0]?.delivery_date?.replace(/-/g, "/")}
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-5 items-center w-full">
              <button onClick={handleClosePopup} className="tertiary-btn">
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivedList;
