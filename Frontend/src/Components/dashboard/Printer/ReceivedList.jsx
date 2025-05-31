import axios from "axios";
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react"; // Added useRef
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
import SearchBar from "../../../Utilities/Searching";
import Pagination from "../../../Utilities/Pagination";
import jalaali from "jalaali-js";
import { useDebounce } from "use-debounce"; // Import useDebounce

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ReceivedList = () => {
  const secretKey = "TET4-1"; // Consider moving to .env if possible

  // Moved decryptData outside component or ensure stable secretKey if it were a prop
  const decryptData = useCallback(
    (hashedData) => {
      if (!hashedData) {
        // console.error("No data to decrypt"); // Be less noisy for initial checks
        return null;
      }
      try {
        const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
          // Handle cases where decryption results in empty string
          // console.warn("Decryption resulted in empty string, possibly invalid data or key.");
          return null;
        }
        return JSON.parse(decrypted);
      } catch (error) {
        // console.error("Decryption failed:", error); // Avoid console flooding for expected nulls
        return null;
      }
    },
    [secretKey] // secretKey is constant, so this is stable
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
    return null; // Return null if no valid role found
  }, [decryptData]);

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounce search term
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState();
  const [orderPrice, setOrderprice] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20;

  const [userRole, setUserRole] = useState(getInitialUserRole());
  const [loading, setLoading] = useState(true); // Keep loading state
  // const [deliverDate, setDeliveryDate] = useState(); // This state seems unused, can be removed if so

  const roles = useMemo(
    () => [
      // useMemo for roles if they don't change
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
    // Added useCallback
    // No changes needed here other than potentially adding token refresh if API requires auth
    try {
      const response = await axios.get(`${BASE_URL}/users/api/users`);
      setUsers(response.data);
    } catch (error) {
      // setError("Error fetching users"); // Consider adding an error state
      console.error("Error fetching users:", error);
    }
    // setLoading(false) here might be premature if other fetches are pending
  }, [BASE_URL]); // Added BASE_URL dependency

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
  }, [fetchUsers, fetchCategories]); // Correct dependencies

  const getTakenList = useCallback(
    async (page, search = "") => {
      // Added search parameter
      if (typeof userRole !== "number") {
        // console.log("User role not yet available for fetching list.");
        setLoading(false); // Stop loading if role isn't set
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
          // Potentially redirect to login or show error message
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
          url += `&search=${encodeURIComponent(search)}`; // Add search query
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setOrders(response.data.results || []); // Ensure results is an array
        setTotalOrders(response.data.count || 0);
      } catch (err) {
        console.error("Error fetching List", err);
        setOrders([]); // Ensure orders is always an array on error
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    },
    [BASE_URL, userRole, decryptData, roles, pageSize] // Added dependencies
  );

  const getDetails = useCallback(
    async (id) => {
      // This function remains largely the same
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
        setIsModelOpen(true); // Simpler toggle
      } catch (err) {
        console.error("Error fetching order details:", err);
      }
    },
    [BASE_URL, decryptData] // Removed isModelOpen from deps, handled by setIsModelOpen
  );

  const convertToHijriShamsi = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "تاریخ نامعتبر"; // Check for invalid date
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

  const handleAdd = useCallback(
    async (order) => {
      // This function logic remains the same for updating status
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
        // Assuming token is needed for update status as well
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
          { headers: { Authorization: `Bearer ${token}` } } // Add token if required by backend
        );

        // Instead of optimistic update, refetch the list to get the most current data
        // This is safer with server-side pagination/filtering
        getTakenList(currentPage, debouncedSearchTerm);

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
      getTakenList,
      currentPage,
      debouncedSearchTerm,
    ] // Added dependencies
  );

  const handleClosePopup = useCallback(() => {
    setIsModelOpen(false);
  }, []);

  // Effect for fetching data when page, search term, or userRole changes
  useEffect(() => {
    if (typeof userRole === "number") {
      // Ensure userRole is valid before fetching
      getTakenList(currentPage, debouncedSearchTerm);
    }
  }, [currentPage, debouncedSearchTerm, userRole, getTakenList]);

  // Effect to reset page to 1 when debouncedSearchTerm changes (but not on initial load)
  const firstMountRef = useRef(true);
  useEffect(() => {
    if (firstMountRef.current) {
      firstMountRef.current = false;
      return; // Don't run on initial mount
    }
    if (currentPage !== 1) {
      setCurrentPage(1); // This will trigger the main data fetching useEffect
    }
    // If currentPage is already 1, the main data fetching useEffect
    // will be triggered by the debouncedSearchTerm change directly.
  }, [debouncedSearchTerm]); // Only depends on debouncedSearchTerm

  useEffect(() => {
    const handleStorageChange = () => {
      const roleData = localStorage.getItem("role");
      if (roleData) {
        try {
          const decryptedRole = decryptData(roleData);
          if (Array.isArray(decryptedRole) && decryptedRole.length > 0) {
            const roleValue = decryptedRole[0];
            if (typeof roleValue === "number") {
              // Only update if the role has actually changed
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
        setUserRole(null); // Clear role if removed from storage
      }
    };
    // Call once on mount to ensure role is correctly set up initially
    handleStorageChange();

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [decryptData, getInitialUserRole]); // Added getInitialUserRole to ensure it's stable

  // Client-side filtering is no longer needed as server handles it
  // const filteredOrders = useMemo(() => { ... }); // REMOVE
  // const [searchResults, setSearchResults] = useState([]); // REMOVE
  // useEffect for client-side search // REMOVE

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    // setCurrentPage(1) will be handled by the debouncedSearchTerm effect
  }, []);

  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  if (loading && orders.length === 0) {
    // Show loading only if there are no orders yet
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
                  colSpan="7" // Adjusted colSpan
                  className="border p-4 text-center text-gray-600"
                >
                  {debouncedSearchTerm // Check debounced term for "no results" message
                    ? `هیچ سفارشی برای جستجوی "${debouncedSearchTerm}" پیدا نشد.`
                    : "هیچ سفارشی برای این وضعیت وجود ندارد."}
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                // designer finding logic can be simplified if designer_details is always present
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
                          setOrderDetails(order); // Set details for modal
                          getDetails(order.id); // Fetch price details
                          // setSelectedOrderId(order.id); // This seems unused now if getDetails opens the modal
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
      {totalOrders > pageSize && ( // Conditionally render pagination
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
                <span className="font-medium text-gray-700">تاریخ اخذ</span>
                <span className="text-gray-900">
                  {convertToHijriShamsi(orderDetails.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="font-medium text-gray-700">تاریخ تحویل</span>
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
