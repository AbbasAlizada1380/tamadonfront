import axios from "axios";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import SearchBar from "../../../Utilities/Searching";
import Pagination from "../../../Utilities/Pagination";
import jalaali from "jalaali-js";
import { useDebounce } from "use-debounce";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Helper function to parse Shamsi date string (YYYY/MM/DD) and convert to Gregorian (YYYY-MM-DD)
const parseAndConvertToGregorian = (shamsiDateString) => {
  if (!shamsiDateString || !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(shamsiDateString)) {
    return null; // Invalid format
  }
  const parts = shamsiDateString.split("/");
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);

  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) {
    return null; // Invalid Jalaali date
  }

  const gregorian = jalaali.toGregorian(jy, jm, jd);
  return `${gregorian.gy}-${String(gregorian.gm).padStart(2, "0")}-${String(
    gregorian.gd
  ).padStart(2, "0")}`;
};

const ReceivedList = () => {
  const secretKey = "TET4-1";

  const decryptData = useCallback(
    (hashedData) => {
      if (!hashedData) return null;
      try {
        const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) return null;
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
      if (Array.isArray(decryptedRole) && decryptedRole.length > 0 && typeof decryptedRole[0] === 'number') {
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
  // const [selectedOrderId, setSelectedOrderId] = useState(); // Seems unused, consider removing if not needed
  const [orderPrice, setOrderprice] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [userRole, setUserRole] = useState(getInitialUserRole());
  const [loading, setLoading] = useState(true);

  // --- Date Filter States ---
  const [shamsiStartDateInput, setShamsiStartDateInput] = useState("");
  const [shamsiEndDateInput, setShamsiEndDateInput] = useState("");
  const [debouncedShamsiStartDate] = useDebounce(shamsiStartDateInput, 600);
  const [debouncedShamsiEndDate] = useDebounce(shamsiEndDateInput, 600);
  const [apiStartDate, setApiStartDate] = useState(null); // Gregorian YYYY-MM-DD for API
  const [apiEndDate, setApiEndDate] = useState(null);     // Gregorian YYYY-MM-DD for API
  const [dateError, setDateError] = useState("");


  const roles = useMemo(() => [
    { id: 1, name: "Designer" }, { id: 2, name: "Reception" },
    { id: 3, name: "Head_of_designers" }, { id: 4, name: "Printer" },
    { id: 5, name: "Delivery" }, { id: 6, name: "Digital" },
    { id: 7, name: "Bill" }, { id: 8, name: "Chaspak" },
    { id: 9, name: "Shop_role" }, { id: 10, name: "Laser" },
  ], []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [BASE_URL]);

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
  }, [fetchUsers, fetchCategories]);

  const getTakenList = useCallback(
    async (page, search = "", gregorianStartDate = null, gregorianEndDate = null) => { // Added date params
      if (typeof userRole !== 'number') {
        setLoading(false);
        return;
      }
      setLoading(true);
      setDateError(""); // Clear previous date errors
      try {
        const token = decryptData(localStorage.getItem("auth_token"));
        if (!token) {
            console.error("Authentication token not found or invalid.");
            setOrders([]); setTotalOrders(0); setLoading(false);
            return;
        }
        const roleDetails = roles.find((r) => r.id === userRole);
        const roleName = roleDetails?.name;
        if (!roleName) {
            console.error("User role name could not be determined.");
            setOrders([]); setTotalOrders(0); setLoading(false);
            return;
        }
        
        let url = `${BASE_URL}/group/orders/status_list/${roleName}/?pagenum=${page}&page_size=${pageSize}`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        // Add date parameters if they exist
        // Ensure your backend expects these parameter names (e.g., start_date, end_date)
        // and the date field to filter on (e.g., created_at)
        if (gregorianStartDate) {
            url += `&start_date=${gregorianStartDate}`;
        }
        if (gregorianEndDate) {
            // For end_date, you might want to include the whole day, e.g., by setting time to 23:59:59
            // or the backend handles inclusivity appropriately.
            url += `&end_date=${gregorianEndDate}`;
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
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
    [BASE_URL, userRole, decryptData, roles, pageSize]
  );

    // Effect to parse debounced Shamsi dates and set API-ready Gregorian dates
    useEffect(() => {
        let validDates = true;
        let newApiStartDate = null;
        let newApiEndDate = null;
        setDateError("");

        if (debouncedShamsiStartDate) {
            newApiStartDate = parseAndConvertToGregorian(debouncedShamsiStartDate);
            if (!newApiStartDate) {
                setDateError("فرمت تاریخ شروع نامعتبر است. (مثال: 1403/01/20)");
                validDates = false;
            }
        }
        if (debouncedShamsiEndDate) {
            newApiEndDate = parseAndConvertToGregorian(debouncedShamsiEndDate);
            if (!newApiEndDate) {
                setDateError(prev => prev + (prev ? " " : "") + "فرمت تاریخ پایان نامعتبر است. (مثال: 1403/01/25)");
                validDates = false;
            }
        }

        if (validDates) {
            // Optional: Check if start date is before end date
            if (newApiStartDate && newApiEndDate && newApiStartDate > newApiEndDate) {
                setDateError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.");
                // Decide if you still want to set them or clear them
                // For now, we'll set them and let the main useEffect trigger a fetch (backend might also error)
            }
            setApiStartDate(newApiStartDate);
            setApiEndDate(newApiEndDate);
        } else {
            // If any date is invalid, don't use them for filtering
            setApiStartDate(null);
            setApiEndDate(null);
        }
    }, [debouncedShamsiStartDate, debouncedShamsiEndDate]);


  const getDetails = useCallback( /* ... (no change) ... */
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

  const convertToHijriShamsi = (dateString) => { /* ... (no change) ... */
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
        return "خطا در تاریخ"
    }
  };

  const handleAdd = useCallback( /* ... (no change, but ensure getTakenList is called with current filters) ... */
    async (order) => {
      const result = await Swal.fire({ /* ... */ });
      if (!result.isConfirmed) return;
      // ... (rest of the logic for finding nextStatus)
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
        if (!token) { /* ... */ return; }
        await axios.post(
            `${BASE_URL}/group/orders/update-status/`,
            { order_id: order.id, status: nextStatus },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        // Refetch list with current filters
        getTakenList(currentPage, debouncedSearchTerm, apiStartDate, apiEndDate); 
        Swal.fire({ /* ... */ });
      } catch (err) {
        console.error("Error changing status", err);
        Swal.fire({ /* ... */ });
      }
    },
    [BASE_URL, categories, decryptData, getTakenList, currentPage, debouncedSearchTerm, apiStartDate, apiEndDate] // Added apiStartDate, apiEndDate
  );

  const handleClosePopup = useCallback(() => { /* ... (no change) ... */
    setIsModelOpen(false);
  }, []);

  // Effect for fetching data when page, search term, userRole, OR API DATES change
  useEffect(() => {
    if (typeof userRole === 'number') {
      getTakenList(currentPage, debouncedSearchTerm, apiStartDate, apiEndDate);
    }
  }, [currentPage, debouncedSearchTerm, userRole, getTakenList, apiStartDate, apiEndDate]); // Added apiStartDate, apiEndDate


  const firstMountRefSearch = useRef(true);
  useEffect(() => {
    if (firstMountRefSearch.current) {
      firstMountRefSearch.current = false; return;
    }
    if (currentPage !== 1) setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Effect to reset page to 1 when apiStartDate or apiEndDate changes (but not on initial load)
  const firstMountRefDates = useRef(true);
  useEffect(() => {
      if (firstMountRefDates.current) {
          firstMountRefDates.current = false;
          return; // Don't run on initial mount
      }
      if (currentPage !== 1) {
          setCurrentPage(1); // This will trigger the main data fetching useEffect
      }
  }, [apiStartDate, apiEndDate]); // Depends on the final API-ready dates


  useEffect(() => { /* ... (storage change listener - no change) ... */
    const handleStorageChange = () => {
      const roleData = localStorage.getItem("role");
      if (roleData) {
        try {
          const decryptedRole = decryptData(roleData);
          if (Array.isArray(decryptedRole) && decryptedRole.length > 0) {
            const roleValue = decryptedRole[0];
            if (typeof roleValue === "number") {
              setUserRole(prevRole => prevRole !== roleValue ? roleValue : prevRole);
            } else { console.warn("Decrypted role value is not a number."); }
          } else { console.warn("Decrypted role data is not in the expected format."); }
        } catch (error) { console.error("Error decrypting role from storage change:", error); }
      } else {
        console.warn("No 'role' found in localStorage during storage event.");
        setUserRole(null);
      }
    };
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [decryptData, getInitialUserRole]);


  const handleSearchChange = useCallback((e) => { /* ... (no change) ... */
    setSearchTerm(e.target.value);
  }, []);

  const onPageChange = useCallback((page) => { /* ... (no change) ... */
    setCurrentPage(page);
  }, []);

  const handleClearDates = () => {
    setShamsiStartDateInput("");
    setShamsiEndDateInput("");
    // apiStartDate and apiEndDate will be set to null by their useEffect
    // The main useEffect for getTakenList will then refetch without date filters
    setDateError("");
  };

  if (loading && orders.length === 0) { /* ... (no change) ... */
    return <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;
  }
  
  return (
    <div className="w-[400px] md:w-[700px] mt-10 lg:w-[70%] mx-auto lg:overflow-hidden">
      <h2 className="md:text-2xl text-base font-Ray_black text-center font-bold mb-4">
        لیست سفارشات دریافتی
      </h2>
      <SearchBar
        placeholder="جستجو بر اساس نام مشتری، نام سفارش، کد سفارش..."
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {/* Date Filter Inputs */}
      <div className="my-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full sm:w-auto">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            از تاریخ (مثال: 1402/11/05)
          </label>
          <input
            type="text"
            id="startDate"
            name="startDate"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
            placeholder="YYYY/MM/DD"
            value={shamsiStartDateInput}
            onChange={(e) => setShamsiStartDateInput(e.target.value)}
          />
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            تا تاریخ (مثال: 1402/12/10)
          </label>
          <input
            type="text"
            id="endDate"
            name="endDate"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
            placeholder="YYYY/MM/DD"
            value={shamsiEndDateInput}
            onChange={(e) => setShamsiEndDateInput(e.target.value)}
          />
        </div>
        <button
            onClick={handleClearDates}
            className="mt-2 sm:mt-6 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 self-end sm:self-center"
        >
            پاک کردن تاریخ‌ها
        </button>
      </div>
      {dateError && <p className="text-red-500 text-sm text-center my-2">{dateError}</p>}


      {loading && <div className="text-center py-2">در حال بارگذاری لیست...</div>}
      <div className="overflow-x-scroll lg:overflow-hidden bg-white w-full rounded-lg md:w-full mt-4">
        {/* ... Table structure remains the same ... */}
        <table className="min-w-full bg-white rounded-lg border border-gray-200">
          <thead className="bg-gray-100">
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">کد سفارش</th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">مشتری</th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">نام سفارش</th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">طراح</th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">حالت</th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">دسته بندی</th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {!loading && orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="border p-4 text-center text-gray-600">
                  {debouncedSearchTerm || apiStartDate || apiEndDate
                    ? `هیچ سفارشی برای فیلترهای اعمال شده پیدا نشد.`
                    : "هیچ سفارشی برای این وضعیت وجود ندارد."}
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const designerName = order.designer_details?.full_name || users.find(
                  (user) => user.id === order.designer
                )?.full_name || "نامشخص";
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
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">{order.secret_key}</td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">{order.customer_name}</td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">{order.order_name}</td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">{designerName}</td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">{order.status}</td>
                    <td className="border border-gray-300 px-6 py-2 text-gray-700">{categoryName}</td>
                    <td className="border border-gray-300 px-6 py-2 flex items-center gap-x-5 justify-center text-gray-700">
                      <button onClick={() => handleAdd(order)} className="secondry-btn">تایید تکمیلی</button>
                      <button
                        onClick={() => {
                          setOrderDetails(order);
                          getDetails(order.id);
                        }}
                        className="secondry-btn"
                      >جزئیات</button>
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

      {isModelOpen && ( /* ... Modal JSX ... */
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">اطلاعات سفارش</h3>
            <div className="bg-gray-100 p-4 rounded overflow-auto text-sm space-y-2 max-h-[60vh]">
              {orderDetails.attributes && Object.entries(orderDetails.attributes).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="text-gray-900">{String(value)}</span>
                </div>
              ))}
              {orderDetails.description && (
                <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                  <span className="font-medium text-gray-700">توضیحات:</span>
                  <span className="text-gray-900">{orderDetails.description}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">تاریخ اخذ</span>
                <span className="text-gray-900">{convertToHijriShamsi(orderDetails.created_at)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">تاریخ تحویل</span>
                <span className="text-gray-900">{orderPrice[0]?.delivery_date?.replace(/-/g, "/") || "نامشخص"}</span>
              </div>
            </div>
            <div className="flex justify-center mt-5 items-center w-full">
              <button onClick={handleClosePopup} className="tertiary-btn">بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivedList;