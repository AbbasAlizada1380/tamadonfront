import axios from "axios";
import React, { useEffect, useState } from "react";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null); // State to track the order being edited
  const [isPopupOpen, setIsPopupOpen] = useState(false); // State to manage popup visibility

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) throw new Error("You are not logged in.");

        const ordersResponse = await fetch(
          `${BASE_URL}/group/orders/`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } }
        );
        if (!ordersResponse.ok) throw new Error("Failed to fetch orders");
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);

        const response = await axios.get(
          `${BASE_URL}/group/categories/`
        );
        setCategories(response.data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

   const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.delete(
        `${BASE_URL}/group/orders/${id}`
      );
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
    } catch (error) {
      setError(error.message);
      console.error("Error deleting order:", error);
    }
  };

  const openEditPopup = (order) => {
    setEditingOrder(order);
    setIsPopupOpen(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await axios.put(
        `${BASE_URL}/group/orders/${editingOrder.id}`,
        editingOrder,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === editingOrder.id ? editingOrder : order
        )
      );
      setIsPopupOpen(false);
      setEditingOrder(null);
    } catch (error) {
      setError(error.message);
      console.error("Error updating order:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">جدول سفارشات</h2>
      {loading && <p>در حال بارگذاری...</p>}
      {error && <p className="text-red-500">{`خطا: ${error}`}</p>}
      {!loading && !error && (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 border px-4">نام مشتری</th>
              <th className="py-2 border px-4">نام سفارش</th>
              <th className="py-2 border px-4">دسته‌بندی</th>
              <th className="py-2 border px-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-2 border px-4">{order.customer_name}</td>
                <td className="py-2 border px-4">{order.order_name}</td>
                <td className="py-2 border px-4">
                  {categories.find((category) => category.id === order.category)
                    ?.name || "دسته‌بندی نامشخص"}
                </td>
                <td className="py-2 border px-4">
                  <button
                    onClick={() => openEditPopup(order)}
                    className="m-2 px-2 py-1 bg-yellow-500 text-white rounded"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-1/2 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">ویرایش سفارش</h3>
            {Object.keys(editingOrder).map((key) => {
              if (
                key === "attribute" &&
                typeof editingOrder[key] === "object"
              ) {
                return (
                  <div key={key} className="mb-4">
                    <h4 className="font-semibold mb-2">ویژگی‌ها:</h4>
                    {Object.keys(editingOrder[key]).map((attrKey) => (
                      <div key={attrKey} className="mb-2">
                        <label className="block mb-1">{attrKey}:</label>
                        <input
                          type="text"
                          className="border w-full px-2 py-1"
                          value={editingOrder[key][attrKey] || ""}
                          onChange={(e) =>
                            setEditingOrder({
                              ...editingOrder,
                              attribute: {
                                ...editingOrder.attribute,
                                [attrKey]: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div key={key} className="mb-4">
                    <label className="block mb-2">
                      {key === "category"
                        ? "دسته‌بندی:"
                        : key === "customer_name"
                        ? "نام مشتری:"
                        : key === "order_name"
                        ? "نام سفارش:"
                        : key}
                    </label>
                    {key === "category" ? (
                      <select
                        className="border w-full px-2 py-1"
                        value={editingOrder[key] || ""}
                        onChange={(e) =>
                          setEditingOrder({
                            ...editingOrder,
                            [key]: parseInt(e.target.value, 10),
                          })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="border w-full px-2 py-1"
                        value={editingOrder[key] || ""}
                        onChange={(e) =>
                          setEditingOrder({
                            ...editingOrder,
                            [key]: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                );
              }
            })}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded mr-2"
              >
                ذخیره
              </button>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
