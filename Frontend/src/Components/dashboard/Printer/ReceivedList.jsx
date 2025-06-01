import axios from "axios";
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import SearchBar from "../../../Utilities/Searching";
import Pagination from "../../../Utilities/Pagination";
import jalaali from "jalaali-js";
import { useDebounce } from "use-debounce";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ReceivedList = () => {
  const secretKey = "TET4-1";

  const decryptData = useCallback(
    (hashedData) => {
      if (!hashedData) {
        return null;
      }
      try {
        const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
          return null;
        }
        return JSON.parse(decrypted);
      } catch (error) {
        return null;
      }
    },
    [secretKey]
  );

  const getInitialUserRole = useCallback(() => {
    const roleData = localStorage.getItem("role");
    if (roleData) {
      const decryptedRole = decryptData(roleData);
      if (
        Array.isArray(decryptedRole) &&
        decryptedRole.length > 0 &&
        typeof decryptedRole[0] === "number"
      ) {
        return decryptedRole[0];
      }
    }
    return null;
  }, [decryptData]);

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderPrice, setOrderprice] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [userRole, setUserRole] = useState(getInitialUserRole());
  const [loading, setLoading] = useState(true);
  // console.log(orderDetails); // You can keep or remove this as needed

  const [inputFilterDate, setInputFilterDate] = useState("");
  const [appliedFilterDate, setAppliedFilterDate] = useState("");

  const roles = useMemo(
    () => [
      { id: 1, name: "Designer" },
      { id: 2, name: "Reception" },
      { id: 3, name: "Head_of_designers" },
      { id: 4, name: "Printer" },
      { id: 5, name: "Delivery" },
      { id: 6, name: "Digital" },
      { id: 7, name: "Bill" },
      { id: 8, name: "Chaspak" },
      { id: 9, name: "Shop_role" },
      { id: 10, name: "Laser" },
    ],
    []
  );

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [BASE_URL]); // Removed BASE_URL from dependency array as it's not expected to change, but can be kept if desired

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [BASE_URL]); // Same as above

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, [fetchUsers, fetchCategories]);

  const getTakenList = useCallback(
    async (page, search = "", filterDate = "") => {
      if (typeof userRole !== "number") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = decryptData(localStorage.getItem("auth_token"));
        if (!token) {
          console.error("Authentication token not found or invalid.");
          setOrders([]);
          setTotalOrders(0);
          setLoading(false);
          return;
        }
        const roleDetails = roles.find((r) => r.id === userRole);
        const roleName = roleDetails?.name;

        if (!roleName) {
          console.error("User role name could not be determined.");
          setOrders([]);
          setTotalOrders(0);
          setLoading(false);
          return;
        }

        let url = `${BASE_URL}/group/orders/status_list/${roleName}/?pagenum=${page}&page_size=${pageSize}`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }

        // --- DATE FILTERING LOGIC ---
        if (filterDate) {
          // filterDate here is the appliedFilterDate
          // IMPORTANT: Ensure your backend expects the query parameter 'date'
          // and the format 'YYYY-MM-DD' (which <input type="date"> provides).
          // If your backend expects a different parameter name (e.g., 'order_date'), change 'date' below.
          // If it expects a different format, you'll need to convert filterDate before appending.
          url += `&date=${filterDate}`;
        }
        // --- END DATE FILTERING LOGIC ---

        // --- ADD THIS CONSOLE.LOG TO DEBUG THE URL ---
        console.log("Requesting URL for orders:", url);
        // --- You should see something like: ...&date=2023-11-21 if a date is applied ---

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        // console.log("API Response for orders:", response); // Optional: log the full response

        setOrders(response.data.results || []);
        setTotalOrders(response.data.count || 0);
      } catch (err) {
        console.error("Error fetching List", err);
        setOrders([]);
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    },
    [BASE_URL, userRole, decryptData, roles, pageSize] // Dependencies for useCallback
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
        setIsModelOpen(true);
      } catch (err) {
        console.error("Error fetching order details:", err);
      }
    },
    [BASE_URL, decryptData]
  );

  const convertToHijriShamsi = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "تاریخ نامعتبر";
      const gYear = date.getFullYear();
      const gMonth = date.getMonth() + 1;
      const gDay = date.getDate();
      const { jy, jm, jd } = jalaali.toJalaali(gYear, gMonth, gDay);
      return `${jy}/${jm.toString().padStart(2, "0")}/${jd
        .toString()
        .padStart(2, "0")}`;
    } catch (error) {
      console.error("Error converting date:", error);
      return "خطا در تاریخ";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) {
      return null;
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error in formatTime:", error);
      return null;
    }
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

      let nextStatus;
      const category = categories.find((cat) => cat.id === order.category);

      if (category && Array.isArray(category.stages)) {
        const currentIndex = category.stages.indexOf(order.status);
        if (currentIndex !== -1 && currentIndex < category.stages.length - 1) {
          nextStatus = category.stages[currentIndex + 1];
        } else {
          Swal.fire("توجه", "مرحله بعدی برای این سفارش وجود ندارد.", "info");
          return;
        }
      } else {
        Swal.fire("خطا", "اطلاعات مراحل دسته بندی یافت نشد.", "error");
        return;
      }

      try {
        const token = decryptData(localStorage.getItem("auth_token"));
        if (!token) {
          Swal.fire(
            "خطا",
            "توکن احراز هویت یافت نشد. لطفاً دوباره وارد شوید.",
            "error"
          );
          return;
        }

        await axios.post(
          `${BASE_URL}/group/orders/update-status/`,
          { order_id: order.id, status: nextStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        getTakenList(currentPage, debouncedSearchTerm, appliedFilterDate);

        Swal.fire({
          icon: "success",
          title: "سفارش بروزرسانی شد",
          text: `وضعیت سفارش به '${nextStatus}' تغییر کرد.`,
          confirmButtonText: "باشه",
        });
      } catch (err) {
        console.error("Error changing status", err);
        Swal.fire({
          icon: "error",
          title: "خطا در تغییر وضعیت",
          text:
            err.response?.data?.detail ||
            "مشکلی در تغییر وضعیت سفارش به وجود آمد.",
          confirmButtonText: "متوجه شدم",
        });
      }
    },
    [
      BASE_URL,
      categories,
      decryptData,
      getTakenList, // getTakenList is stable due to its own useCallback
      currentPage,
      debouncedSearchTerm,
      appliedFilterDate,
    ]
  );

  const handleClosePopup = useCallback(() => {
    setIsModelOpen(false);
  }, []);

  const handleApplyDateFilter = useCallback(() => {
    setAppliedFilterDate(inputFilterDate); // This will trigger the useEffect below
    // No need to call getTakenList here directly, useEffect will handle it
    // setCurrentPage(1); // Reset to page 1 when filter is applied - this will be handled by the other useEffect
  }, [inputFilterDate]); // Dependency: inputFilterDate

  const handleClearDateFilter = useCallback(() => {
    setInputFilterDate("");
    setAppliedFilterDate(""); // This will trigger the useEffect below
    // setCurrentPage(1); // Reset to page 1 - this will be handled by the other useEffect
  }, []); // No dependencies needed for clearing

  // Effect for fetching data when page, search term, userRole, or APPLIED DATE changes
  useEffect(() => {
    if (typeof userRole === "number") {
      // The getTakenList function itself is memoized by useCallback.
      // appliedFilterDate changing will trigger this effect.
      getTakenList(currentPage, debouncedSearchTerm, appliedFilterDate);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    userRole,
    getTakenList, // Add getTakenList here as it's a dependency
    appliedFilterDate,
  ]);

  // Effect to reset page to 1 when debouncedSearchTerm or appliedFilterDate changes
  const firstMountRef = useRef(true);
  useEffect(() => {
    if (firstMountRef.current) {
      firstMountRef.current = false;
      return;
    }
    // Only reset if the current page is not already 1
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, appliedFilterDate]); // No currentPage dependency here to avoid loops

  useEffect(() => {
    const handleStorageChange = () => {
      const roleData = localStorage.getItem("role");
      if (roleData) {
        try {
          const decryptedRole = decryptData(roleData);
          if (Array.isArray(decryptedRole) && decryptedRole.length > 0) {
            const roleValue = decryptedRole[0];
            if (typeof roleValue === "number") {
              setUserRole((prevRole) =>
                prevRole !== roleValue ? roleValue : prevRole
              );
            } else {
              console.warn("Decrypted role value is not a number.");
            }
          } else {
            console.warn(
              "Decrypted role data is not in the expected format (array with at least one number)."
            );
          }
        } catch (error) {
          console.error("Error decrypting role from storage change:", error);
        }
      } else {
        console.warn("No 'role' found in localStorage during storage event.");
        setUserRole(null);
      }
    };
    handleStorageChange(); // Initial check
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [decryptData]); // Removed getInitialUserRole, not needed here as decryptData covers it

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  if (
    loading &&
    orders.length === 0 &&
    !appliedFilterDate &&
    !debouncedSearchTerm
  ) {
    // Avoid showing loading if it's just an empty filter result
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-[400px] md:w-[950px] mt-10 lg:w-[90%] mx-auto lg:overflow-hidden">
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات دریافتی
      </h2>
      <SearchBar
        placeholder="جستجو بر اساس نام مشتری، نام سفارش، کد سفارش..."
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <div className="flex flex-col md:flex-row gap-4 my-4 p-4 border border-gray-200 rounded-lg bg-gray-50 items-center">
        <div className="flex items-center gap-2 w-full md:w-auto flex-grow">
          <label
            htmlFor="filterDate"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            فیلتر بر اساس تاریخ:
          </label>
          <input
            type="date"
            id="filterDate"
            value={inputFilterDate}
            onChange={(e) => setInputFilterDate(e.target.value)}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full"
          />
        </div>
        <div className="flex gap-2 mt-3 md:mt-0 flex-shrink-0">
          <button
            onClick={handleApplyDateFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!inputFilterDate}
          >
            اعمال فیلتر
          </button>
          <button
            onClick={handleClearDateFilter}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!inputFilterDate && !appliedFilterDate}
          >
            پاک کردن
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-2">در حال بارگذاری لیست...</div>
      )}
      <div className="overflow-x-scroll lg:overflow-hidden bg-white w-full rounded-lg md:w-full mt-4">
        <table className="min-w-full bg-white rounded-lg border border-gray-200">
          <thead className="bg-gray-100">
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                کد سفارش
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                مشتری
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نام سفارش
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                طراح
              </th>
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
            {!loading && orders.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="border p-4 text-center text-gray-600"
                >
                  {debouncedSearchTerm || appliedFilterDate
                    ? `هیچ سفارشی برای فیلترهای اعمال شده پیدا نشد.`
                    : "هیچ سفارشی برای این وضعیت وجود ندارد."}
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const designerName =
                  order.designer_details?.full_name ||
                  users.find((user) => user.id === order.designer)?.full_name ||
                  "نامشخص";

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
                      {designerName}
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
                          setOrderDetails(order); // This is correct for setting the details for the modal
                          getDetails(order.id);
                        }}
                        className="secondry-btn"
                      >
                        جزئیات
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalOrders > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalOrders={totalOrders}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {isModelOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              اطلاعات سفارش
            </h3>
            <div className="bg-gray-100 p-4 rounded overflow-auto text-sm space-y-2 max-h-[60vh]">
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

              {orderDetails.description && (
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium text-gray-700">توضیحات:</span>
                  <span className="text-gray-900">
                    {orderDetails.description}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">
                  تاریخ و زمان اخذ:
                </span>
                <span className="text-gray-900">
                  {(() => {
                    const dateValue = orderDetails.created_at;
                    if (!dateValue) return "نامشخص";
                    const shamsiDateText = convertToHijriShamsi(dateValue);
                    const timeText = formatTime(dateValue);
                    const dateError =
                      shamsiDateText === "N/A" ||
                      shamsiDateText.includes("نامعتبر") ||
                      shamsiDateText.includes("خطا");
                    if (dateError) return shamsiDateText;
                    return timeText
                      ? `${shamsiDateText} ساعت ${timeText}`
                      : shamsiDateText;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">تاریخ تحویل:</span>
                <span className="text-gray-900">
                  {orderPrice[0]?.delivery_date?.replace(/-/g, "/") || "نامشخص"}
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
