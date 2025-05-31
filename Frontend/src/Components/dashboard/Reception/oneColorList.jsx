import { useCallback, useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import axios from "axios";
import Pagination from "../../../Utilities/Pagination"; // Assuming this path is correct
const BASE_URL = import.meta.env.VITE_BASE_URL;

const OneColorList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [orderPrice, setOrderPrice] = useState([]);
  const [users, setUsers] = useState([]);

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
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/api/users/`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
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

        const ordersData = response.data.results || [];
        setOrders(ordersData);
        setTotalOrders(response.data.count || 0);
        setError("");

        // Initialize temp containers
        const newPrices = {};

        // Fetch prices for each order
        await Promise.all(
          ordersData.map(async (order) => {
            try {
              const priceResponse = await axios.get(
                `${BASE_URL}/group/order-by-price/`,
                {
                  params: { order: order.id },
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              const priceData = priceResponse.data?.[0]; // Assuming it's an array
              if (priceData) {
                newPrices[order.id] = priceData;
              }
            } catch (priceError) {
              console.error(
                `خطا در دریافت قیمت برای سفارش ${order.id}:`,
                priceError
              );
            }
          })
        );

        // Update state once after all fetches
        setOrderPrice((prev) => ({ ...prev, ...newPrices }));
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
    fetchUsers();
  }, [currentPage, fetchOrders, fetchCategories]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && orders.length === 0)
    return <p className="p-4">در حال بارگذاری...</p>;
  if (error && orders.length === 0 && !loading)
    return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="no-print bg-green text-white px-7 font-bold py-2 rounded hover:bg-green/90"
      >
        چاپ این صفحه
      </button>
      <div id="printableTableArea">
        {" "}
        {/* Div to define printable content */}
        <h2 className="text-xl font-bold mb-4 text-center">
          {" "}
          {/* Centered title for print */}
          لیست سفارشات رنگی (WC) - صفحه {currentPage}
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
          (!loading || orders.length > 0) && ( // Render table if not loading or if orders are already loaded
            <div className="overflow-x-auto">
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
                    <th className="border border-gray-300 px-4 py-2">
                      تاریخ تحویل دهی
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
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
                          {orderPrice[order.id]?.delivery_date || "نامشخص"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        {error ? (
                          <span className="text-red-500">{error}</span>
                        ) : (
                          "سفارشی یافت نشد."
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>{" "}
      {/* End of printableTableArea */}
      {totalOrders > pageSize && !loading && orders.length > 0 && (
        <div className="mt-4 flex justify-center no-print">
          {" "}
          {/* Added no-print to pagination */}
          <Pagination
            currentPage={currentPage}
            totalOrders={totalOrders} // Renamed from totalOrders to totalItems if Pagination expects that
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />          
        </div>
      )}
    </div>
  );
};

export default OneColorList;
