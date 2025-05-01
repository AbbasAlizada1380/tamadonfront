import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "use-debounce"; // Import useDebounce
import Pagination from "../../../Utilities/Pagination"; // Assuming path is correct
import axios from "axios";
import CryptoJS from "crypto-js";
import { FaSearch } from "react-icons/fa"; // Removed sort icons as button is removed
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { IoMdAddCircleOutline } from "react-icons/io";
import { FaChevronDown } from "react-icons/fa";
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import moment from "moment-jalaali";

// Define the base endpoint (ensure this matches your backend)
const ORDERS_API_ENDPOINT = `${BASE_URL}/group/orders/today/`; // Or '/group/orders/' if searching all

const AddOrder = () => {
  // --- State Variables ---
  const [categories, setCategories] = useState([]);
  const [dropdownState, setDropdownState] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]); // Data from API
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [formFields, setFormFields] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0); // Total count from API
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Adjust as needed
  const [formData, setFormData] = useState({});
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState(""); // For category dropdown search
  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- State for Server-Side Search & Sort (Sort state kept for default logic) ---
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc' - Determines default fetch order
  const [orderSearchTerm, setOrderSearchTerm] = useState(""); // Raw search input for table

  // --- Debounce the search term ---
  const [debouncedSearchTerm] = useDebounce(orderSearchTerm, 500);

  // --- Decryption Function (stable) ---
  const secretKey = "TET4-1";
  const decryptData = useCallback((hashedData) => {
    if (!hashedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }, []); // Empty dependency array as secretKey is constant

  // --- Initial Form State (stable) ---
  const getInitialFormState = useCallback(
    () => ({
      customer_name: "",
      order_name: "",
      designer:
        decryptData(localStorage.getItem("id")) ||
        decryptData(localStorage.getItem("email")), // Use ID preferably
      category: "",
      status: "Reception",
      description: "",
    }),
    [decryptData]
  );
  const [form1, setForm1] = useState(getInitialFormState());

  // --- Event Handlers ---
  const handleForm1InputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm1((prevState) => ({ ...prevState, [name]: value }));
  }, []);
  const handleInputChange = useCallback((e) => {
    // For dynamic fields
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);
  const handleEdit = useCallback(
    (order) => {
      if (!order) return;
      setIsEditing(true);
      setEditingOrderId(order.id);
      setForm1({
        customer_name: order.customer_name || "",
        order_name: order.order_name || "",
        designer: order.designer_details?.id || getInitialFormState().designer,
        category: order.category || "",
        description: order.description || "",
        status: order.status || "Reception",
      });
      setSelectedCategoryId(order.category);
      setFormData(order.attributes || {});
      setIsFormOpen(true);
    },
    [getInitialFormState]
  ); // Added dependency
  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategoryId(categoryId);
    setIsCategoryDropdownOpen(false);
    setCategorySearchTerm("");
    setFormData({});
    setForm1((prev) => ({ ...prev, category: categoryId }));
  }, []);
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  const handleOrderSearchChange = (e) => {
    // Table search handler
    setOrderSearchTerm(e.target.value);
  };

  // --- Toggle sort order function (Kept for potential future use, but no UI element) ---
  // const toggleSortOrder = () => {
  //   const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
  //   console.log(`DEBUG: Toggling sort order from ${sortOrder} to ${newSortOrder}`);
  //   setSortOrder(newSortOrder);
  //   setCurrentPage(1);
  // };

  // --- API Calls ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = decryptData(localStorage.getItem("auth_token"));
      if (!token) {
        console.error("Auth token missing.");
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams({
        pagenum: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      // *** Apply sorting based on state, even without button ***
      const orderingField = "created_at"; // MUST match backend model field & ordering_fields
      const backendOrderingParam =
        sortOrder === "asc" ? orderingField : `-${orderingField}`;
      params.append("ordering", backendOrderingParam);
      // ***-------------------------------------------------***

      const url = `${ORDERS_API_ENDPOINT}?${params.toString()}`;
      const response = await axios.get(url, { headers });
      setOrders(response.data.results || []);
      setTotalOrders(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching orders:", error.response || error);
      setOrders([]);
      setTotalOrders(0);
      // Optional: Show user error
      // Swal.fire("خطا", "خطا در بارگذاری لیست سفارشات.", "error");
    } finally {
      setLoading(false);
    }
    // Ensure decryptData is listed if token logic *inside* fetchOrders depends on it
  }, [currentPage, pageSize, debouncedSearchTerm, sortOrder, decryptData]); // sortOrder still a dependency for default sort

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/categories/`);
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  }, []);

  const fetchAttributes = useCallback(async (categoryId) => {
    if (!categoryId) {
      setFormFields([]);
      return;
    }
    try {
      const response = await axios.get(
        `${BASE_URL}/group/categories/${categoryId}/attributes/`
      );
      const { attribute_types = [], attribute_values = [] } =
        response.data || {};
      const fields = attribute_types.map((type) => ({
        ...type,
        options: attribute_values.filter(
          (value) => value.attribute === type.id
        ),
      }));
      setFormFields(fields);
    } catch (error) {
      console.error("Error fetching attributes:", error);
      setFormFields([]);
    }
  }, []);

  // --- useEffect Hooks ---
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  useEffect(() => {
    fetchAttributes(selectedCategoryId);
  }, [selectedCategoryId, fetchAttributes]);
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Depends on the stable fetchOrders callback
  useEffect(() => {
    // Reset page on search change
    if (debouncedSearchTerm !== undefined && currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]); // Only depends on the debounced term

  // --- Form Submission and Deletion ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) {
      Swal.fire("خطا!", "توکن احراز هویت یافت نشد.", "error");
      setSubmitting(false);
      return;
    }
    if (
      !form1.order_name ||
      !form1.customer_name ||
      !selectedCategoryId ||
      !form1.status ||
      !form1.description
    ) {
      Swal.fire("خطا!", "لطفا تمام فیلدهای ستاره‌دار را پر کنید.", "warning");
      setSubmitting(false);
      return;
    }

    const payload = {
      order_name: form1.order_name,
      customer_name: form1.customer_name,
      designer: decryptData(localStorage.getItem("id")), // Use ID
      category: selectedCategoryId,
      attributes: formData || {},
      status: form1.status,
      description: form1.description,
    };

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const url = isEditing
        ? `${ORDERS_API_ENDPOINT}${editingOrderId}/`
        : `${BASE_URL}/group/orders/`;
      const method = isEditing ? "put" : "post";
      await axios({ method, url, headers, data: payload });

      Swal.fire(
        "موفق!",
        isEditing ? "سفارش ویرایش شد." : "سفارش ثبت شد.",
        "success"
      );
      fetchOrders(); // Refetch
      setIsFormOpen(false);
      setIsEditing(false);
      setEditingOrderId(null);
      setSelectedCategoryId("");
      setForm1(getInitialFormState());
      setFormData({});
      setFormFields([]);
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response?.data || error.message || error
      );
      const errorDetail =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {})
          .flat()
          .join(" ") ||
        "لطفا ورودی‌ها را بررسی کنید.";
      Swal.fire(
        "خطا!",
        `مشکلی در ${isEditing ? "ویرایش" : "ثبت"} پیش آمد: ${errorDetail}`,
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (id) => {
    if (!id) return;
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) {
      Swal.fire("خطا!", "توکن احراز هویت یافت نشد.", "error");
      return;
    }

    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عمل قابل بازگشت نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن!",
      cancelButtonText: "لغو",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        await axios.delete(`${ORDERS_API_ENDPOINT}${id}/`, { headers });
        Swal.fire("حذف شد!", "سفارش حذف گردید.", "success");
        if (orders.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1); // Will trigger fetchOrders
        } else {
          fetchOrders(); // Refetch current page
        }
      } catch (error) {
        console.error("Error deleting order:", error.response || error);
        Swal.fire("خطا!", "مشکلی در حذف سفارش پیش آمد.", "error");
        setLoading(false); // Stop loading on error only
      }
      // No finally setLoading(false) here; fetchOrders handles it on success/error
    }
  };

  // --- Helper Functions ---
  const formatDate = (date) => {
    if (!date) return "N/A";
    return moment(date).isValid()
      ? moment(date).format("jYYYY/jMM/jDD")
      : "تاریخ نامعتبر"; // Original format
  };

  // --- Memoized Filtered Categories for Dropdown ---
  const filteredCategories = useMemo(() => {
    if (!categorySearchTerm) return categories;
    const lowerSearch = categorySearchTerm.toLowerCase();
    return categories
      .filter((category) => category.name.toLowerCase().includes(lowerSearch))
      .sort((a, b) => {
        const startsA = a.name.toLowerCase().startsWith(lowerSearch);
        const startsB = b.name.toLowerCase().startsWith(lowerSearch);
        return startsB - startsA;
      });
  }, [categories, categorySearchTerm]);

  // --- JSX Render (Using Original Styling Structure, Button Removed) ---
  return (
    <div className="py-10 bg-gray-200 w-full min-h-[91vh] px-5">
      {/* Add Button */}
      <div className="flex items-center justify-center py-3">
        <button
          className="secondry-btn flex items-center justify-between gap-x-3"
          onClick={() => {
            setIsFormOpen(true);
            setIsEditing(false);
            setEditingOrderId(null);
            setSelectedCategoryId("");
            setForm1(getInitialFormState());
            setFormData({});
            setFormFields([]);
          }}
        >
          افزودن سفارش
          <IoMdAddCircleOutline size={24} />
        </button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="max-w-3xl mx-auto py-4 px-5 shadow-lg bg-white rounded-md mb-8">
          <div>
            <h2 className="text-xl text-center font-Ray_black font-bold mb-4">
              {isEditing ? "ویرایش سفارش" : "فورم سفارش"}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Customer/Order Name Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer_name" className="block mb-2">
                    نام مشتری <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customer_name"
                    name="customer_name"
                    type="text"
                    value={form1.customer_name}
                    onChange={handleForm1InputChange}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none bg-gray-200 text-black"
                    placeholder="نام مشتری را وارد کنید"
                  />
                </div>
                <div>
                  <label htmlFor="order_name" className="block mb-2">
                    نام سفارش <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="order_name"
                    name="order_name"
                    type="text"
                    value={form1.order_name}
                    onChange={handleForm1InputChange}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none bg-gray-200 text-black"
                    placeholder="نام سفارش را وارد کنید"
                  />
                </div>
              </div>
              {/* Description */}
              <div className="mt-4">
                <label
                  htmlFor="description"
                  className="block mb-2 text-gray-700"
                >
                  توضیحات سفارش <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form1.description}
                  onChange={handleForm1InputChange}
                  required
                  className="w-full px-3 py-2 border rounded min-h-[100px] max-h-[100px] resize-y focus:outline-none bg-gray-200 text-black"
                  placeholder=" "
                />
              </div>
              {/* Category Selection */}
              <div className="mb-4 mt-3">
                <label className="block text-lg font-medium mb-2 text-gray-700">
                  کتگوری سفارش <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div
                    className="w-full px-3 py-2 border flex justify-between items-center bg-gray-200 rounded text-black cursor-pointer"
                    onClick={() =>
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                    }
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {selectedCategoryId
                      ? categories.find((cat) => cat.id === selectedCategoryId)
                          ?.name || "کتگوری را انتخاب کنید"
                      : "کتگوری را انتخاب کنید"}
                    <FaChevronDown
                      className={`transition-all duration-300 ${
                        isCategoryDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isCategoryDropdownOpen && (
                    <div className="absolute w-full bg-white text-black border border-gray-300 rounded-md shadow-lg mt-1 z-10">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="جستجو نمودن کتگوری..."
                          value={categorySearchTerm}
                          onChange={(e) =>
                            setCategorySearchTerm(e.target.value)
                          }
                          className="w-full p-2 border-b pl-10 pr-5 outline-none focus:border-b border-green bg-gray-300 placeholder-gray-700 "
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700" />
                      </div>
                      <ul className="max-h-[400px] overflow-y-auto">
                        {filteredCategories.map((category) => (
                          <li
                            key={category.id}
                            className="py-2 px-5 hover:bg-gray-200 border-b text-black cursor-pointer"
                            onClick={() => handleCategorySelect(category.id)}
                          >
                            {category.name}
                          </li>
                        ))}
                        {filteredCategories.length === 0 && (
                          <li className="p-3 text-gray-500">
                            نتیجه‌ای یافت نشد
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  {!selectedCategoryId && submitting && (
                    <p className="text-red-500 text-xs mt-1">
                      انتخاب کتگوری الزامی است.
                    </p>
                  )}
                </div>
              </div>
              {/* Dynamic Fields */}
              <ul className="relative grid grid-cols-1 md:grid-cols-2 gap-4 list-none">
                {formFields.map((field) => (
                  <li key={field.id} className="mb-4">
                    <label htmlFor={field.name} className="block mb-1">
                      {field.name}
                    </label>
                    {field.attribute_type === "input" && (
                      <input
                        type="text"
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded text-black"
                      />
                    )}
                    {field.attribute_type === "dropdown" && (
                      <div className="relative">
                        <div
                          className="w-full px-3 flex justify-between items-center py-2 border rounded text-black bg-white cursor-pointer"
                          onClick={() =>
                            setDropdownState((prev) => ({
                              ...prev,
                              [field.id]: !prev[field.id],
                            }))
                          }
                        >
                          {formData[field.name] || `انتخاب ${field.name}`}
                          <FaChevronDown
                            className={`transition-all duration-300 ${
                              dropdownState[field.id] ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                        {dropdownState[field.id] && (
                          <ul className="absolute max-h-[200px] overflow-y-auto w-full bg-white text-black border border-gray-300 rounded-md shadow-lg mt-1 z-10">
                            <li
                              className="p-3 hover:bg-gray-200 cursor-pointer"
                              onClick={() => {
                                handleInputChange({
                                  target: { name: field.name, value: "" },
                                });
                                setDropdownState((prev) => ({
                                  ...prev,
                                  [field.id]: false,
                                }));
                              }}
                            >
                              {" "}
                              انتخاب {field.name}{" "}
                            </li>
                            {field.options.map((option) => (
                              <li
                                key={option.id}
                                className="p-3 hover:bg-gray-200 cursor-pointer"
                                onClick={() => {
                                  handleInputChange({
                                    target: {
                                      name: field.name,
                                      value: option.attribute_value,
                                    },
                                  });
                                  setDropdownState((prev) => ({
                                    ...prev,
                                    [field.id]: false,
                                  }));
                                }}
                              >
                                {" "}
                                {option.attribute_value}{" "}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {field.attribute_type === "checkbox" && (
                      <input
                        type="checkbox"
                        id={field.name}
                        name={field.name}
                        checked={!!formData[field.name]}
                        onChange={handleInputChange}
                        className="w-6 h-8 border rounded text-green "
                      />
                    )}
                    {field.attribute_type === "date" && (
                      <input
                        type="date"
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded text-black"
                      />
                    )}
                  </li>
                ))}
              </ul>
              {/* Buttons */}
              <div className="flex items-center justify-center gap-x-5 ">
                <button
                  type="submit"
                  disabled={submitting}
                  className={` ${
                    submitting
                      ? "cursor-not-allowed opacity-70 text-green"
                      : "secondry-btn"
                  }`}
                >
                  {" "}
                  {submitting
                    ? "در حال ارسال"
                    : isEditing
                    ? "ذخیره ویرایش"
                    : " ثبت"}{" "}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className=" bg-red-600 hover:bg-red-700 text-sm text-white py-2 px-5 rounded-lg hover:!scale-105 duration-300"
                >
                  لغو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="w-[350px] sm:w-[450px] md:w-[700px] mt-10 lg:w-[80%] mx-auto overflow-x-auto lg:overflow-hidden relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <span className="ml-2 text-gray-600">در حال بارگذاری...</span>
            <style jsx>{`
              /* Simple Loader CSS */
              .loader {
                border-top-color: #3b82f6;
                animation: spinner 1.2s linear infinite;
              }
              @keyframes spinner {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        )}

        {/* Controls - Only Search */}
        <div className="flex items-center justify-between mb-4">
          {/* Search Input */}
          <div className="flex items-center gap-x-3 flex-grow">
            {" "}
            {/* Added flex-grow */}
            <label
              htmlFor="customerSearch"
              className="block text-sm font-semibold whitespace-nowrap" /* Added whitespace-nowrap */
            >
              جستجوی مشتری:
            </label>
            <input
              type="text"
              id="customerSearch"
              value={orderSearchTerm}
              onChange={handleOrderSearchChange}
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" // Original class, added w-full
              placeholder="نام مشتری، سفارش، کتگوری..."
            />
            {orderSearchTerm && ( // Show clear button conditionally
              <button
                onClick={() => setOrderSearchTerm("")}
                className="focus:outline-none secondry-btn" // Original class
              >
                پاک کردن
              </button>
            )}
          </div>

          {/* Sort Button - REMOVED */}
          {/*
           <button
            onClick={toggleSortOrder}
            className="flex items-center gap-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded hover:bg-gray-100 focus:outline-none" // Original class
          >
            مرتب‌سازی بر اساس تاریخ
            {sortOrder === "asc" ? (
              <FaSortAlphaUp className="w-4 h-4" />
            ) : (
              <FaSortAlphaDown className="w-4 h-4" />
            )}
          </button>
          */}
        </div>

        {/* Table */}
        <table
          className={`w-full rounded-lg border overflow-auto border-gray-300 shadow-md ${
            loading ? "opacity-30" : ""
          }`}
        >
          <thead>
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نام مشتری
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نام سفارش
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                کتگوری
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                تاریخ ایجاد
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading && orders.length > 0
              ? orders.map((order) => (
                  <tr
                    key={order.id}
                    className="text-center border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                  >
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      {order.customer_name}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      {order.order_name}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      {categories.find(
                        (category) => category.id === order.category
                      )?.name || "دسته‌بندی نامشخص"}
                    </td>
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      {formatDate(order.created_at)}
                    </td>
                    {/* Original Actions Cell & Buttons */}
                    <td className="flex items-center justify-center gap-x-5 border-gray-300 px-6 py-2 text-gray-700">
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-green hover:scale-105 transition-all duration-300"
                      >
                        <FaRegEdit size={24} />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:scale-105 transition-all duration-300"
                      >
                        <IoTrashSharp size={24} />
                      </button>
                    </td>
                  </tr>
                ))
              : !loading && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-10 text-gray-500 px-6"
                    >
                      {orderSearchTerm
                        ? "هیچ سفارشی مطابق با جستجوی شما یافت نشد."
                        : "هنوز سفارشی برای امروز ثبت نشده است."}
                    </td>
                  </tr>
                )}
          </tbody>
        </table>

        {/* Pagination */}
        {/* {!loading && totalOrders > pageSize && ( */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalOrders={totalOrders}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        {/* )} */}
      </div>
    </div>
  );
};

export default AddOrder;
