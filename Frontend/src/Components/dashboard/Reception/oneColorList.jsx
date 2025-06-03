import { useCallback, useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import axios from "axios";
import Pagination from "../../../Utilities/Pagination"; // Assuming this path is correct
const BASE_URL = import.meta.env.VITE_BASE_URL;

const ColorFullList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 20;

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
        if (!decrypted) {
          console.error("Decryption resulted in empty string");
          return null;
        }
        return JSON.parse(decrypted);
      } catch (error) {
        console.error("Decryption failed:", error);
        return null;
      }
    },
    [secretKey]
  );

  const fetchOrders = useCallback(
    async (page) => {
      setLoading(true);
      const token = decryptData(localStorage.getItem("auth_token"));
      if (!token) {
        setError("توکن احراز هویت یافت نشد. لطفاً دوباره وارد شوید.");
        setLoading(false);
        setOrders([]);
        setTotalOrders(0);
        return;
      }
      try {
        const response = await axios.get(
          `${BASE_URL}/group/orders/reception_list/today/?category__category_list=WC&pagenum=${page}&page_size=${pageSize}`, // WC category
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setOrders(response.data.results || []);
        setTotalOrders(response.data.count || 0);
        setError("");
      } catch (err) {
        console.error("خطا در دریافت اطلاعات:", err);
        setError("دریافت اطلاعات ناموفق بود.");
        setOrders([]);
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    },
    [BASE_URL, decryptData, pageSize]
  );

  const fetchCategories = useCallback(async () => {
    let currentToken = decryptData(localStorage.getItem("auth_token"));
    if (!currentToken) {
      console.warn("Token not available for fetching categories");
      setCategories([]);
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}/group/categories/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setCategories(response.data || []);
    } catch (error) {
      // setError("Error fetching categories"); // Avoid overwriting primary error
      console.error("Error fetching categories:", error.response || error);
      setCategories([]);
    }
  }, [BASE_URL, decryptData]);

  useEffect(() => {
    fetchOrders(currentPage);
    fetchCategories();
  }, [currentPage, fetchOrders, fetchCategories]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrint = () => {
    window.print();
  };

  // Initial loading state
  if (loading && orders.length === 0)
    return <p className="p-4">در حال بارگذاری...</p>;
  // Initial error state
  if (error && orders.length === 0 && !loading)
    return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      {/* Main Page Title (will be hidden on print) */}
      <button
        onClick={handlePrint}
        className="no-print mb-4 ml-auto block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        چاپ این صفحه
      </button>
      <div id="printableTableArea">
        <h2 className="text-xl font-bold mb-4 text-center">
          لیست سفارشات تک رنگ (WC) - صفحه {currentPage}
        </h2>
        {loading && orders.length > 0 && (
          <p className="p-4 text-center no-print">بارگذاری صفحه جدید...</p>
        )}
        {error && !loading && orders.length > 0 && (
          <p className="p-4 text-red-500 text-center no-print">{error}</p>
        )}
        {orders.length === 0 && !loading && !error ? (
          <p className="text-center">سفارشی یافت نشد.</p>
        ) : (
          (!loading || orders.length > 0) && ( // Render table if not loading OR if orders are already loaded
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full">
                <thead>
                  <tr className="bg-green text-gray-100 text-center">
                    <th className="border border-gray-300 px-4 py-2">
                      نام مشتری
                    </th>
                    <th className="border border-gray-300 px-4 py-2">
                      نام سفارش
                    </th>
                    <th className="border border-gray-300 px-4 py-2">
                      دسته‌بندی
                    </th>
                    <th className="border border-gray-300 px-4 py-2">
                      دیزاینر
                    </th>
                    <th className="border border-gray-300 px-4 py-2">حالت</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                    >
                      <td className="border border-gray-300 px-4 py-2">
                        {order.customer_name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {order.order_name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {categories.find((cat) => cat.id === order.category)
                          ?.category_list || "نامشخص"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {order.designer_details?.full_name || "نامشخص"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {order.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>{" "}
      {/* End of printableTableArea */}
      {/* Pagination (hidden on print) */}
      {totalOrders > pageSize && !loading && orders.length > 0 && (
        <div className="mt-4 flex justify-center no-print">
          <Pagination
            currentPage={currentPage}
            totalOrders={totalOrders} // Make sure Pagination component expects this prop name
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ColorFullList;
