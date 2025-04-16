import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import Pagination from "../../../Utilities/Pagination";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const Customer = () => {
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
  const fileInputRef = useRef(null); // ✅ Add ref for file input

  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  // Set axios default header for Authorization using token in localStorage
  useEffect(() => {
    const token = decryptData(localStorage.getItem("auth_token")); // Replace 'auth_token' with the actual key you store your token in
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch customers on initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/common/customer-images/`);
      setCustomers(response.data);
    } catch (error) {
      console.error("خطا در دریافت اطلاعات مشتریان:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const customerData = new FormData();
    customerData.append("name", formData.name);
    if (formData.image) {
      customerData.append("image", formData.image);
    }

    try {
      if (editingCustomerId) {
        await axios.put(
          `${BASE_URL}/common/customer-images/${editingCustomerId}/`,
          customerData
        );
        Swal.fire({
          title: "به‌روزرسانی شد!",
          text: "اطلاعات مشتری با موفقیت به‌روزرسانی شد.",
          icon: "success",
          confirmButtonText: "تایید",
        });
      } else {
        await axios.post(`${BASE_URL}/common/customer-images/`, customerData);
        Swal.fire({
          title: "افزوده شد!",
          text: "مشتری جدید با موفقیت اضافه شد.",
          icon: "success",
          confirmButtonText: "تایید",
        });
      }

      setFormData({ name: "", image: null });
      setErrors({});
      setEditingCustomerId(null);
      fetchCustomers();

      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // ✅ Clear file input
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
        Swal.fire({
          title: "خطا!",
          text: "لطفاً اطلاعات ورودی را بررسی کنید.",
          icon: "error",
          confirmButtonText: "باشه",
        });
      } else {
        console.error("خطا در ارسال داده:", error);
        Swal.fire({
          title: "خطای سرور!",
          text: "مشکلی در ارتباط با سرور پیش آمد.",
          icon: "error",
          confirmButtonText: "باشه",
        });
      }
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      image: customer.image, // This will store the image URL from backend
    });
    setEditingCustomerId(customer.id);
  };

  const handleDelete = async (customerId) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عملیات قابل بازگشت نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "لغو",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_URL}/common/customer-images/${customerId}/`);
        fetchCustomers();

        Swal.fire({
          title: "حذف شد!",
          text: "مشتری با موفقیت حذف شد.",
          icon: "success",
          confirmButtonText: "تایید",
        });
      } catch (error) {
        console.error("خطا در حذف مشتری:", error);
        Swal.fire({
          title: "خطا!",
          text: "مشکلی در حذف مشتری پیش آمد.",
          icon: "error",
          confirmButtonText: "باشه",
        });
      }
    }
  };

  //  pagination section
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(customers.length / postsPerPage);
  const paginatedOrders = [...customers] // Create a copy to avoid mutation
    .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <div className="py-10 bg-gray-200 w-full">
      <div className="max-w-3xl mx-auto p-2 shadow-lg bg-white rounded-md">
        <h1 className="md:text-xl text-base text-center font-bold mb-4">
          مدیریت مشتری
        </h1>

        <form
          onSubmit={handleSubmit}
          className=" border-t m-1  p-2 flex flex-col justify-center items-center space-y-4"
        >
          <div className="relative w-full">
            <label className="block text-lg font-semibold mb-2">نام</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="نام مشتری"
              required
              className="peer w-full border-b border-gray-600 bg-transparent py-1.5 px-1 text-base focus:outline-none focus:border-blue-600"
            />

            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-green transition-all peer-focus:w-full"></span>
            {errors.name && (
              <div className="text-red-500 text-sm mt-1">{errors.name[0]}</div>
            )}
          </div>

          <div className="w-full">
            <label className="block text-lg font-semibold mb-2">تصویر</label>
            <input
              type="file"
              name="image"
              ref={fileInputRef}
              onChange={handleFileChange}
              rows={4}
              className="border p-1.5 hover:bg-white w-full rounded-sm"
            />
            {errors.image && (
              <div className="text-red-500 text-sm mt-1">{errors.image[0]}</div>
            )}

            {formData.image && (
              <div className="mt-4">
                <p>تصویر انتخاب شده:</p>
                <img
                  src={
                    formData.image instanceof File
                      ? URL.createObjectURL(formData.image)
                      : formData.image
                  }
                  alt="Customer"
                  className="w-32 h-32 object-cover mt-2"
                />
              </div>
            )}
          </div>

          <button type="submit" className="secondry-btn">
            {editingCustomerId ? "به روز رسانی مشتری" : "افزودن مشتری"}
          </button>
        </form>
      </div>
      {/* Displaying blogs */}
      <div className="p-5 mt-3">
        <p className="text-xl font-Ray_black font-bold text-center">
          لیست مشتریان
        </p>
      </div>
      <div className="w-[400px] md:w-[700px] lg:w-[80%] mx-auto  lg:overflow-hidden">
        <table className="w-full  rounded-lg border border-gray-300 overflow-x-scroll shadow-md">
          <thead>
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نام
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                تصویر
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              paginatedOrders.map((customer) => (
                <tr
                  key={customer.id}
                  className="text-center border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                >
                  <td className="border px-4 py-2">{customer.name}</td>
                  <td className="border px-4 py-2">
                    <img
                      src={`${customer.image}`} // Make sure this URL is correctly pointing to the image
                      alt={customer.name}
                      className="w-14 h-10 object-cover rounded-lg border  border-gray-300 shadow-sm"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className=" text-green px-1 py-1 rounded-md transition-all"
                    >
                      <FaRegEdit size={24} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className=" text-red-500 px-1 py-1 rounded-md transition-all disabled:opacity-50"
                    >
                      <IoTrashSharp size={24} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-3 text-center text-gray-500">
                  هیچ داده ای برای نمایش وجود ندارد
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination Component */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default Customer;
