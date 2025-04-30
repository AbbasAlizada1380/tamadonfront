import React, { useState, useEffect, useCallback } from "react";
import Pagination from "../../../Utilities/Pagination";
import axios from "axios";
import CryptoJS from "crypto-js";
import {
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaFilter,
} from "react-icons/fa";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { IoMdAddCircleOutline } from "react-icons/io";
import { FaChevronDown } from "react-icons/fa";
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import moment from "moment-jalaali";

const AddOrder = () => {
  const [categories, setCategories] = useState([]);
  const [dropdownState, setDropdownState] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [formFields, setFormFields] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Adjust page size as needed
  const [formData, setFormData] = useState({});
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [refreshOrders, setRefreshOrders] = useState(false); // Add a state to force refresh
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [searchResults, setSearchResults] = useState([]); // Search results state
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
  const [form1, setForm1] = useState({
    customer_name: "",
    order_name: "",
    designer: decryptData(localStorage.getItem("email")),
    category: "",
    status: "Reception",
    description: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [id, setId] = useState(decryptData(localStorage.getItem("id")));

  const handleForm1InputChange = (e) => {
    const { name, value } = e.target;
    setForm1((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const fetchOrders = async (page = 1) => {
    try {
      const token = decryptData(localStorage.getItem("auth_token"));
      if (!token) {
        console.error("No authentication token found in localStorage.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const params = new URLSearchParams({
        pagenum: page,
        page_size: pageSize, // Assuming backend supports this
      });

      const url = `${BASE_URL}/group/orders/today/?pagenum=${currentPage}`;
      const response = await axios.get(url, { headers });
      setOrders(response.data.results);
      setTotalOrders(response.data.count); // Total number of orders
    } catch (error) {
      console.error("Error fetching orders:", error.response || error);
    }
  };
  // Function to handle date filter change
  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
  };
  // Function to handle customer search change
  const handleCustomerSearchChange = (e) => {
    setCustomerSearchTerm(e.target.value);
  };
  // Fetch categories from the endpoint
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/group/categories/`);
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []); // Fetch categories only once on mount

  useEffect(() => {
    fetchOrders();
  }, [currentPage]); // Re-fetch when the filterDate, or refreshOrders changes

  // Fetch form fields for the selected category
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchAttributes = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/group/categories/${selectedCategoryId}/attributes/`
          );
          const { attribute_types, attribute_values } = response.data;

          const fields = attribute_types.map((type) => ({
            ...type,
            options: attribute_values.filter(
              (value) => value.attribute === type.id
            ),
          }));

          setFormFields(fields);
        } catch (error) {
          console.error("Error fetching attributes:", error);
        }
      };

      fetchAttributes();
    } else {
      setFormFields([]);
    }
  }, [selectedCategoryId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (order) => {
    setIsEditing(true);
    setEditingOrderId(order.id);

    setForm1({
      customer_name: order.customer_name,
      order_name: order.order_name,
      category: order.category,
      description: order.description,
      status: order.status,
    });

    // Set the selected category to load its dynamic form fields
    setSelectedCategoryId(order.category);

    // Populate the dynamic form fields (attributes)
    setFormData(order.attributes || {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) {
      Swal.fire({
        title: "خطا!",
        text: "توکن احراز هویت یافت نشد.",
        icon: "error",
      });
      setSubmitting(false);
      return;
    }

    // Validate required fields
    if (!form1.order_name) {
      Swal.fire({
        title: "خطا!",
        text: "نام سفارش را وارد کنید.",
        icon: "warning",
      });
      setSubmitting(false);
      return;
    }

    if (!form1.customer_name) {
      Swal.fire({
        title: "خطا!",
        text: "نام مشتری را وارد کنید.",
        icon: "warning",
      });
      setSubmitting(false);
      return;
    }

    if (!selectedCategoryId) {
      Swal.fire({
        title: "خطا!",
        text: "دسته‌بندی را انتخاب کنید.",
        icon: "warning",
      });
      setSubmitting(false);
      return;
    }

    if (!form1.status) {
      Swal.fire({
        title: "خطا!",
        text: "وضعیت سفارش را مشخص کنید.",
        icon: "warning",
      });
      setSubmitting(false);
      return;
    }

    if (!form1.description) {
      Swal.fire({
        title: "خطا!",
        text: "توضیحات سفارش را وارد کنید.",
        icon: "warning",
      });
      setSubmitting(false);
      return;
    }

    const payload = {
      order_name: form1.order_name,
      customer_name: form1.customer_name,
      designer: decryptData(localStorage.getItem("id")),
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

      let response;
      if (isEditing) {
        response = await axios.put(
          `${BASE_URL}/group/orders/today/${editingOrderId}/`,
          payload,
          { headers }
        );
      } else {
        response = await axios.post(`${BASE_URL}/group/orders/`, payload, {
          headers,
        });
      }

      Swal.fire({
        title: "موفق!",
        text: isEditing
          ? "سفارش با موفقیت ویرایش شد."
          : "سفارش با موفقیت ثبت شد.",
        icon: "success",
      });
      fetchOrders();
      setRefreshOrders((prev) => !prev); // Trigger re-fetch
      setSelectedCategoryId("");
      setIsEditing(false);
      setEditingOrderId(null);
      setForm1({
        customer_name: "",
        order_name: "",
        designer: decryptData(localStorage.getItem("email")),
        category: "",
        description: "",
        status: "Reception",
      });
      setFormData({});
    } catch (error) {
      console.error("Error submitting form:", error.response || error);
      Swal.fire({
        title: "خطا!",
        text: "مشکلی در ثبت سفارش پیش آمد.",
        icon: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const onPageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  const handleDelete = async (id) => {
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) {
      console.error("No authentication token found in localStorage.");
      return;
    }

    // Show confirmation alert
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این سفارش پس از حذف قابل بازیابی نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
    });

    if (result.isConfirmed) {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        await axios.delete(`${BASE_URL}/group/orders/today/${id}/`, {
          headers,
        });

        Swal.fire({
          title: "حذف شد!",
          text: "سفارش با موفقیت حذف گردید.",
          icon: "success",
        });
        fetchOrders(currentPage);
        setRefreshOrders((prev) => !prev); // Trigger re-fetch
      } catch (error) {
        console.error("Error deleting order:", error);
        Swal.fire({
          title: "خطا!",
          text: "مشکلی در حذف سفارش پیش آمد.",
          icon: "error",
        });
      }
    }
  };

  // Function to handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setIsCategoryDropdownOpen(false);
    setSearchTerm(""); // Reset search after selection
    setFormData([]); // Reset form data when category changes
  };

  // Sort categories: Move matching ones to the top
  const filteredCategories = categories
    .filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const startsWithA = a.name
        .toLowerCase()
        .startsWith(searchTerm.toLowerCase());
      const startsWithB = b.name
        .toLowerCase()
        .startsWith(searchTerm.toLowerCase());
      return startsWithB - startsWithA;
    });
  const postsPerPage = 15;

  // Format date in Jalaali calendar
  const formatDate = (date) => {
    if (!date) return "N/A"; // Handle cases where the date is null/undefined
    return moment(date).format("jYYYY/jMM/jDD");
  };

  // Sort function that uses localeCompare for string comparison and handles number conversion
  const sortOrders = (a, b) => {
    const dateA = new Date(a.created_at || 0); // Treat null dates as the epoch
    const dateB = new Date(b.created_at || 0);

    if (sortOrder === "asc") {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  };

  // Sort orders based on sortOrder state
  const sortedOrders = [...orders].sort(sortOrders);

  // Pagination logic
  const dataToPaginate =
    searchResults.length > 0 ? searchResults : sortedOrders;
  const totalPages = Math.ceil(dataToPaginate.length / postsPerPage);

  const paginatedOrders = [...dataToPaginate].slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const toggleSortOrder = () => {
    setSortOrder((prevSortOrder) => (prevSortOrder === "asc" ? "desc" : "asc"));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (searchTerm) {
      const results = sortedOrders.filter((order) => {
        const customerName = order.customer_name || "";
        const orderName = order.order_name || "";
        const categoryName =
          categories.find((category) => category.id === order.category)?.name ||
          "";

        return (
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          orderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoryName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setSearchResults(results);
      setCurrentPage(1);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, orders, categories]);

  // Function to filter orders for today
  const getOrdersForToday = () => {
    const today = moment().format("YYYY-MM-DD"); // Get today's date in YYYY-MM-DD format
    return sortedOrders.filter((order) => {
      const orderDate = moment(order.created_at).format("YYYY-MM-DD"); // Format order's created_at date
      return orderDate === today; // Compare if the order date is today
    });
  };
  const todayOrders = getOrdersForToday();
  const dataToPaginateToday =
    searchResults.length > 0 ? searchResults : todayOrders;
  return (
    <div className="py-10 bg-gray-200 w-full min-h-[91vh] px-5">
      <div className="flex items-center justify-center py-3">
        <button
          className="secondry-btn flex items-center justify-between gap-x-3"
          onClick={() => setIsFormOpen((prev) => !prev)}
        >
          افزودن سفارش
          <IoMdAddCircleOutline size={24} />
        </button>
      </div>

      {isFormOpen && (
        <div className="max-w-3xl mx-auto py-4 px-5 shadow-lg bg-white rounded-md">
          {(isFormOpen || isEditing) && (
            <div>
              <h2 className="text-xl text-center font-Ray_black  font-bold mb-4">
                {isEditing ? "ویرایش سفارش" : "فورم سفارش"}
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Form content remains the same */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer_name" className="block mb-2">
                      نام مشتری
                    </label>
                    <input
                      id="customer_name"
                      name="customer_name"
                      type="text"
                      value={form1.customer_name}
                      onChange={handleForm1InputChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none bg-gray-200 text-black"
                      placeholder="نام مشتری را وارد کنید"
                    />
                  </div>

                  {/* Order Name */}
                  <div>
                    <label htmlFor="order_name" className="block mb-2">
                      نام سفارش
                    </label>
                    <input
                      id="order_name"
                      name="order_name"
                      type="text"
                      value={form1.order_name}
                      onChange={handleForm1InputChange}
                      className="w-full px-3 py-2 border focus:outline-none rounded bg-gray-200 text-black"
                      placeholder="نام سفارش را وارد کنید"
                    />
                  </div>
                </div>
                {/* Order Name */}
                <div className="mt-4">
                  <label
                    htmlFor="description"
                    className="block mb-2 text-gray-700"
                  >
                    توضیحات سفارش
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form1.description} // should reflect the current state correctly
                    onChange={handleForm1InputChange} // this updates the state when the user types
                    // maxLength={3} // ensure this is appropriate for your use case
                    className="w-full px-3 py-2 border rounded min-h-[100px] max-h-[100px] resize-y focus:outline-none bg-gray-200 text-black"
                    placeholder=" "
                  />
                </div>
                {/* Category Selection */}
                <div className="mb-4 mt-3">
                  <label className="block text-lg font-medium mb-2 text-gray-700">
                    کتگوری سفارش
                  </label>
                  <div className="relative">
                    {/* Dropdown Button */}
                    <div
                      className="w-full px-3 py-2 border flex justify-between items-center bg-gray-200 rounded text-black cursor-pointer"
                      onClick={() =>
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                      }
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {selectedCategoryId
                        ? categories.find(
                            (cat) => cat.id === selectedCategoryId
                          )?.name || "کتگوری را انتخاب کنید"
                        : "کتگوری را انتخاب کنید"}
                      <FaChevronDown
                        className={`transition-all duration-300 ${
                          isCategoryDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {/* Dropdown List */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute w-full bg-white text-black border border-gray-300 rounded-md shadow-lg mt-1 z-10">
                        {/* Search Input */}
                        <div className="relative">
                          {/* Search Input */}
                          <input
                            type="text"
                            placeholder="جستجو نمودن کتگوری..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border-b pl-10 pr-5 outline-none focus:border-b border-green bg-gray-300 placeholder-gray-700 "
                          />

                          {/* Search Icon */}
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700" />
                        </div>
                        {/* Categories List */}
                        <ul className="max-h-[400px] overflow-y-auto">
                          {filteredCategories.map((category) => (
                            <li
                              key={category.id}
                              className="py-2  px-5 hover:bg-gray-200 border-b text-black cursor-pointer"
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
                  </div>
                </div>

                {/* Dynamic Fields */}
                <ul className="relative grid grid-cols-1 md:grid-cols-2 gap-4 list-none">
                  {formFields.map((field, index) => (
                    <li key={index} className="mb-4">
                      <label htmlFor={field.name} className="block mb-1">
                        {field.name}
                      </label>
                      {field.attribute_type === "input" ? (
                        <input
                          type="text"
                          id={field.name}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded text-black"
                        />
                      ) : field.attribute_type === "dropdown" ? (
                        <div className="relative">
                          {/* Dropdown Button */}
                          <div
                            className="w-full px-3 flex justify-between items-center py-2 border rounded text-black bg-white cursor-pointer"
                            onClick={() =>
                              setDropdownState((prev) => ({
                                ...prev,
                                [field.name]: !prev[field.name], // Toggle dropdown for this field
                              }))
                            }
                          >
                            {formData[field.name] || `انتخاب ${field.name}`}
                            <FaChevronDown
                              className={`transition-all duration-300 ${
                                dropdownState[field.name] ? "rotate-180" : ""
                              }`}
                            />
                          </div>

                          {/* Dropdown Options */}
                          {dropdownState[field.name] && (
                            <ul className="absolute max-h-[400px] overflow-y-auto w-full bg-white text-black border border-gray-300 rounded-md shadow-lg mt-1 z-10 overflow-hidden">
                              <li
                                className="p-3 hover:bg-gray-200 cursor-pointer"
                                onClick={() => {
                                  handleInputChange({
                                    target: { name: field.name, value: "" },
                                  });
                                  setDropdownState((prev) => ({
                                    ...prev,
                                    [field.name]: false,
                                  }));
                                }}
                              >
                                انتخاب {field.name}
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
                                      [field.name]: false,
                                    }));
                                  }}
                                >
                                  {option.attribute_value}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : field.attribute_type === "checkbox" ? (
                        <input
                          type="checkbox"
                          id={field.name}
                          name={field.name}
                          checked={!!formData[field.name]}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.name]: e.target.checked,
                            }))
                          }
                          className="w-6 h-8 border rounded text-green "
                        />
                      ) : field.attribute_type === "date" ? (
                        <input
                          type="date"
                          id={field.name}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded text-black"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
                {/* Buttons */}
                <div className="flex items-center justify-center gap-x-5 ">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`  ${
                      submitting
                        ? "cursor-not-allowed opacity-70 text-green"
                        : "secondry-btn"
                    }`}
                  >
                    {" "}
                    {submitting ? "در حال ارسال" : " ثبت"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setIsEditing(false);
                      setEditingOrderId(null);
                      setForm1({
                        customer_name: "",
                        order_name: "",
                        category: "",
                      });
                      setFormData({});
                      setSelectedCategoryId("");
                    }}
                    className=" bg-red-600 hover:bg-red-700 text-sm text-white py-2 px-5 rounded-lg hover:!scale-105 duration-300"
                  >
                    لغو
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="w-[350px] sm:w-[450px] md:w-[700px] mt-10 lg:w-[80%] mx-auto overflow-x-scroll lg:overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          {/* <div className="flex items-center gap-x-3">
            <label htmlFor="filterDate" className="block text-sm font-semibold">
              فیلتر بر اساس تاریخ:
            </label>
            <input
              type="date"
              id="filterDate"
              value={filterDate}
              onChange={handleFilterDateChange}
              className="shadow appearance-none border rounded-md w-56 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />

            <button
              onClick={() => setFilterDate("")}
              className="focus:outline-none secondry-btn"
            >
              پاک کردن
            </button>
          </div> */}

          {/* Customer Search */}
          <div className="flex items-center gap-x-3">
            <label
              htmlFor="customerSearch"
              className="block text-sm font-semibold"
            >
              جستجوی مشتری:
            </label>
            <input
              type="text"
              id="customerSearch"
              value={searchTerm}
              onChange={handleSearchChange}
              className="shadow appearance-none border rounded-md w-56 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="جستجوی نام مشتری..."
            />

            <button
              onClick={() => setSearchTerm("")}
              className="focus:outline-none secondry-btn"
            >
              پاک کردن
            </button>
          </div>

          {/* Sort Button */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded hover:bg-gray-100 focus:outline-none"
          >
            مرتب‌سازی بر اساس تاریخ
            {sortOrder === "asc" ? (
              <FaSortAlphaUp className="w-4 h-4" />
            ) : (
              <FaSortAlphaDown className="w-4 h-4" />
            )}
          </button>
        </div>

        <table className="w-full rounded-lg border overflow-auto border-gray-300 shadow-md">
          <thead>
            <tr className="bg-green text-gray-100  text-center">
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
            {dataToPaginateToday.map((order) => (
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
                  {categories.find((category) => category.id === order.category)
                    ?.name || "دسته‌بندی نامشخص"}
                </td>
                <td className="border-gray-300 px-6 py-2 text-gray-700">
                  {formatDate(order.created_at)}
                </td>
                <td className="flex items-center justify-center gap-x-5 border-gray-300 px-6 py-2 text-gray-700">
                  <button
                    onClick={() => {
                      handleEdit(order);
                      setIsFormOpen(true);
                    }}
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
            ))}
          </tbody>
        </table>

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalOrders={totalOrders}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default AddOrder;
