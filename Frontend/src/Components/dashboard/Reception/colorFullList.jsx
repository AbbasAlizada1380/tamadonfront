import { useCallback, useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import axios from "axios";
import Pagination from "../../../Utilities/Pagination"; // Assuming this path is correct
const BASE_URL = import.meta.env.VITE_BASE_URL;

const ColorFullList = () => {
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
  const fetchData = useCallback(async () => {
    const token = decryptData(localStorage.getItem("auth_token"));
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // --- Build URL with Search and Pagination ---
      const params = new URLSearchParams({
        pagenum: Page.toString(),
        page_size: pageSize.toString(), // Add page_size if your API supports it
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm); // Add search parameter if term exists
      }

      // Ensure the endpoint supports these parameters
      const ordersUrl = `${ORDERS_API_ENDPOINT}?${params.toString()}`;
      // --- End URL Building ---

      // Fetch orders, categories, and users (keep this structure if needed)
      const [ordersResponse, categoriesResponse, usersResponse] =
        await Promise.all([
          axios.get(ordersUrl, { headers }), // Use the constructed URL
          axios.get(`${BASE_URL}/group/categories/`, { headers }),
          axios.get(`${BASE_URL}/users/api/users/`, { headers }), // Make sure this endpoint is correct
        ]);

      setOrders(ordersResponse.data.results || []);
      setTotalOrders(ordersResponse.data.count || 0);
      // setTotalCount(ordersResponse.data.count || 0); // Redundant with totalOrders
      // setTotalPages(Math.ceil(ordersResponse.data.count / pageSize)); // Calculated in Pagination

      setCategories(categoriesResponse.data || []);
      setDesigners(usersResponse.data || []); // Ensure this state is used or remove fetch

      // --- Fetch Prices Logic (Keep as is) ---
      const newPrices = {};
      const newReceived = {};
      const newRemainded = {};
      const newDeliveryDate = {};
      const newReception_name = {};
      if (ordersResponse.data.results) {
        await Promise.all(
          ordersResponse.data.results.map(async (order) => {
            try {
              // Consider adding a check if price data is actually needed for the current view/search results
              const priceResponse = await axios.get(
                `${BASE_URL}/group/order-by-price/`,
                {
                  params: { order: order.id },
                  headers: { Authorization: `Bearer ${token}` }, // Pass token here too
                }
              );

              const data1 = priceResponse.data;
              if (data1 && data1.length > 0) {
                newPrices[order.id] = data1[0].price;
                newReceived[order.id] = data1[0].receive_price;
                newRemainded[order.id] = data1[0].reminder_price;
                newDeliveryDate[order.id] = data1[0].delivery_date;
                newReception_name[order.id] = data1[0].reception_name;
              } else {
                // console.warn(`No price data found for order ID: ${order.id}`);
              }
            } catch (priceError) {
              // Handle price fetch errors gracefully (e.g., don't block UI)
              if (priceError.response?.status === 404) {
                // console.warn(`Price data not found for order ID: ${order.id}`);
              } else {
                // console.error(`Error fetching price for order ID: ${order.id}`, priceError);
              }
              // Set default/placeholder values if needed
              newPrices[order.id] = newPrices[order.id] ?? "N/A";
              newReceived[order.id] = newReceived[order.id] ?? "N/A";
              newRemainded[order.id] = newRemainded[order.id] ?? "N/A";
              newDeliveryDate[order.id] = newDeliveryDate[order.id] ?? "N/A";
              newReception_name[order.id] =
                newReception_name[order.id] ?? "N/A";
            }
          })
        );
        // Update price states outside the map loop for efficiency
        setPrices((prevPrices) => ({ ...prevPrices, ...newPrices }));
        setReceivedPrices((prevReceived) => ({
          ...prevReceived,
          ...newReceived,
        }));
        setRemaindedPrices((prevRemainded) => ({
          ...prevRemainded,
          ...newRemainded,
        }));
        setReception_name((prevReception_name) => ({
          ...prevReception_name,
          ...newReception_name,
        }));
        setDDate((prevDDate) => ({ ...prevDDate, ...newDeliveryDate }));
      }
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message || error
      );
      if (error.response?.status === 401) {
        // Specific handling for unauthorized, maybe try refresh again or logout
        console.error(
          "Unauthorized access - token might be invalid or expired."
        );
        await refreshAuthToken(); // Attempt refresh again or trigger logout
      }
      // Set empty state on error to avoid displaying stale data
      setOrders([]);
      setTotalOrders(0);
      setCategories([]);
      setDesigners([]);
      // Optional: Show error message to user using Swal or similar
    } finally {
      setLoading(false);
    }
  }, [
  ]); // Add dependencies
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
        `${BASE_URL}/group/orders/reception_list/today/?category__category_list=CF&pagenum=${page}&page_size=${pageSize}`,
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
          لیست سفارشات رنگی (CF) - صفحه {currentPage}
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

export default ColorFullList;
