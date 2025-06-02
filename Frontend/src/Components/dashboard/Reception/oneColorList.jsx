import { useCallback, useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import axios from "axios";
import Pagination from "../../../Utilities/Pagination"; 
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
          `${BASE_URL}/group/orders/reception_list/today/?category__category_list=WC&pagenum=${page}&page_size=${pageSize}`,
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
      setError("Error fetching categories"); // This might overwrite error from fetchOrders
      console.error("Error fetching categories:", error.response || error);
      setCategories([]);
    }
  }, [BASE_URL, decryptData]); 

  useEffect(() => {
    fetchOrders(currentPage); 
    fetchCategories();
  }, [currentPage, fetchOrders, fetchCategories]); // Added currentPage and memoized functions as dependencies

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading && orders.length === 0)
    return <p className="p-4">در حال بارگذاری...</p>; // Show loading only if orders are not yet loaded
  if (error && orders.length === 0)
    return <p className="p-4 text-red-500">{error}</p>; // Show error if initial load fails

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">لیست سفارشات تک رنگ (WC)</h2>

      {loading && <p className="p-4 text-center">بارگذاری صفحه جدید...</p>}

      {error && !loading && (
        <p className="p-4 text-red-500 text-center">{error}</p>
      )}

      {orders.length === 0 && !loading ? (
        <p>سفارشی یافت نشد.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-green text-gray-100 text-center">
                <th className="border border-gray-300 px-4 py-2">نام مشتری</th>
                <th className="border border-gray-300 px-4 py-2">نام سفارش</th>
                <th className="border border-gray-300 px-4 py-2">دسته‌بندی</th>
                <th className="border border-gray-300 px-4 py-2">دیزاینر</th>
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
      )}

      {totalOrders > pageSize && !loading && orders.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalOrders={totalOrders}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ColorFullList;
