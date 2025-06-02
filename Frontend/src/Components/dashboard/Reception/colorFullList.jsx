import { useCallback, useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const ColorFullList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const secretKey = "TET4-1"; // Use a strong secret key
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
  const fetchOrders = async () => {
    const token = decryptData(localStorage.getItem("auth_token"));

    try {
      const response = await axios.get(
        `${BASE_URL}/group/orders/reception_list/today/?category__category_list=CF`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setOrders(response.data.results || []);
    } catch (err) {
      console.error("خطا در دریافت اطلاعات:", err);
      setError("دریافت اطلاعات ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };
  const fetchCategories = useCallback(async () => {
    // Added useCallback
    let currentToken = decryptData(localStorage.getItem("auth_token"));

    // setLoading(true); // Avoid resetting loading if fetchOrders is also running
    try {
      // Using axios for consistency
      const response = await axios.get(`${BASE_URL}/group/categories/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setCategories(response.data || []);
    } catch (error) {
      setError("Error fetching categories");
      console.error("Error fetching categories:", error.response || error);
      setCategories([]); // Clear on error
    } finally {
      // setLoading(false); // Let fetchOrders handle final loading state
    }
  }, []);

  useEffect(() => {
      fetchOrders();
      fetchCategories();
  }, []);

  if (loading) return <p className="p-4">در حال بارگذاری...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">لیست سفارشات رنگی (WC)</h2>

      {orders.length === 0 ? (
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
                    {categories
                      .find((cat) => cat.id === order.category)
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
    </div>
  );
};

export default ColorFullList;
