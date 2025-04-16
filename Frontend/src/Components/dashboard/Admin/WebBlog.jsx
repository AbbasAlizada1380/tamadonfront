import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Pagination from "../../../Utilities/Pagination";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const WebBlog = () => {
  const fileInputRef = useRef(null);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    category: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find((cat) => cat.id === formData.category) || null
  );
  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/reception/blog/categories/`
      );
      if (response.status === 200 && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.error("ساختار نادرست پاسخ برای دسته‌بندی‌ها:", response);
      }
    } catch (error) {
      console.error("خطا در دریافت دسته‌بندی‌ها:", error);
      setError(
        "بارگیری دسته‌بندی‌ها ناموفق بود. لطفاً صفحه را بازنگری کنید یا بعداً دوباره امتحان کنید."
      );
    }
  };

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/reception/blog/blog-posts/`
      );
      if (response.status === 200 && Array.isArray(response.data)) {
        setBlogs(response.data);
      } else {
        console.error("ساختار نادرست پاسخ برای نوشته‌های بلاگ:", response);
      }
    } catch (error) {
      console.error("خطا در دریافت نوشته‌های بلاگ:", error);
      setError(
        "بارگیری نوشته‌های بلاگ ناموفق بود. لطفاً صفحه را بازنگری کنید یا بعداً دوباره امتحان کنید."
      );
    }
  };
  useEffect(() => {
    fetchCategories();
    fetchBlogs();
  }, []);

  // Handle form field changes

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "image") {
      const file = e.target.files[0];
      if (file) {
        setFormData({ ...formData, image: file });
        setImagePreview(URL.createObjectURL(file)); // Create preview URL
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Handle category creation if "add" is selected
    if (formData.category === "add") {
      if (!newCategory) {
        setError("لطفاً برای دسته‌بندی جدید یک نام وارد کنید.");

        setIsSubmitting(false);
        return;
      }

      try {
        const response = await axios.post(
          `${BASE_URL}/reception/blog/categories/`,
          { category_name: newCategory }
        );
        if (response.status === 201) {
          setCategories((prevCategories) => [...prevCategories, response.data]);
          formData.category = response.data.id;
          setNewCategory("");
          setError("");
        }
      } catch (error) {
        console.error("Error adding category:", error);
        setError(
          "اضافه کردن دسته‌بندی جدید ناموفق بود. لطفاً بعداً دوباره تلاش کنید."
        );
        setIsSubmitting(false);
        return;
      }
    }

    // Prepare FormData for blog post submission
    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("category", formData.category);
    if (formData.image) {
      payload.append("image", formData.image);
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/reception/blog/blog-posts/`,
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 201) {
        setBlogs((prevBlogs) => [...prevBlogs, response.data]);
        setFormData({ title: "", description: "", image: null, category: "" });
        setError("");
        setIsDropdownOpen(false);
        setSelectedCategory(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
        Swal.fire("موفق!", "مقاله وبلاگ با موفقیت اضافه شد.", "success");
      }
    } catch (error) {
      console.error("Error creating blog post:", error.response?.data);
      setError("ثبت مقاله وبلاگ ناموفق بود. لطفاً بعداً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteCategory = async (categoryId) => {
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عملیات قابل بازگشت نیست.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${BASE_URL}/reception/blog/categories/${categoryId}/`
          );
          if (response.status === 204) {
            setBlogs((prevBlogs) =>
              prevBlogs.filter((blog) => blog.id !== categoryId)
            );
            Swal.fire("حذف شد!", "دسته با موفقیت حذف گردید.", "success");
          }
          fetchCategories();
          setSelectedCategory(null);
        } catch (error) {
          console.error("Error deleting weblog category:", error);
          Swal.fire(
            "خطا!",
            "حذف دسته ناکام بود. لطفاً بعداً دوباره تلاش کنید.",
            "error"
          );
        }
      }
    });
  };
  // Handle delete blog post
  const handleDelete = async (blogId) => {
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عملیات قابل بازگشت نیست.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${BASE_URL}/reception/blog/blog-posts/${blogId}/`
          );
          if (response.status === 204) {
            setBlogs((prevBlogs) =>
              prevBlogs.filter((blog) => blog.id !== blogId)
            );
            Swal.fire("حذف شد!", "پست وبلاگ با موفقیت حذف گردید.", "success");
          }
        } catch (error) {
          console.error("Error deleting blog post:", error);
          Swal.fire(
            "خطا!",
            "حذف پست بلاگ ناکام بود. لطفاً بعداً دوباره تلاش کنید.",
            "error"
          );
        }
      }
    });
  };

  // Handle update blog post (edit form)
  const handleEdit = (blog) => {
    setFormData({
      title: blog.title,
      description: blog.description,
      category: blog.category,
      image: blog.image, // Set image to null so that the user can re-upload if necessary
    });
    const selectedCategory = categories.find((cat) => cat.id === blog.category);
    setSelectedCategory(
      selectedCategory || { id: "", category_name: "انتخاب دسته‌بندی" }
    );
    if (blog.image) {
      setImagePreview(`${blog.image}`);
    } else {
      setImagePreview(null);
    }
  };
  const handleSelect = (category) => {
    if (category.id === "add") {
      setFormData({ ...formData, category: "add" });
    } else {
      setSelectedCategory(category);
      handleChange({ target: { name: "category", value: category.id } });
    }
    setIsDropdownOpen(false);
  };

  const addNewCategory = async () => {
    if (!newCategory.trim()) {
      Swal.fire("خطا", "لطفاً نام دسته‌بندی جدید را وارد کنید.", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/reception/blog/categories/`,
        { category_name: newCategory.trim() }
      );

      if (response.status === 201) {
        setCategories((prevCategories) => [...prevCategories, response.data]);
        Swal.fire("موفقیت", "دسته‌بندی جدید با موفقیت اضافه شد.", "success");
        setFormData({ ...formData, category: response.data.id });
        setNewCategory("");
      } else {
        Swal.fire("خطا", "مشکلی پیش آمد. لطفاً دوباره امتحان کنید.", "error");
      }
    } catch (error) {
      console.error("خطا در افزودن دسته‌بندی:", error);
      Swal.fire("خطا", "افزودن دسته‌بندی با مشکل مواجه شد.", "error");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/reception/blog/categories/`
        );
        if (response.status === 200 && Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          console.error("ساختار نادرست پاسخ برای دسته‌بندی‌ها:", response);
        }
      } catch (error) {
        console.error("خطا در دریافت دسته‌بندی‌ها:", error);
        setError("بارگذاری دسته‌بندی‌ها ناموفق بود. لطفاً صفحه را تازه کنید.");
      }
    };

    const fetchBlogs = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/reception/blog/blog-posts/`
        );
        if (response.status === 200 && Array.isArray(response.data)) {
          setBlogs(response.data);
        } else {
          console.error("ساختار نادرست پاسخ برای پست‌های وبلاگ:", response);
        }
      } catch (error) {
        console.error("خطا در دریافت پست‌های وبلاگ:", error);
        setError("بارگذاری پست‌های وبلاگ ناموفق بود. لطفاً دوباره تلاش کنید.");
      }
    };

    fetchCategories();
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  //  pagination section
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15;

  // Calculate pagination
  const totalPages = Math.ceil(blogs.length / postsPerPage);
  const paginatedOrders = [...blogs] // Create a copy to avoid mutation
    .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <div className="py-10 bg-gray-200 w-full ">
      <div className="max-w-3xl mx-auto p-2 shadow-lg bg-white rounded-md">
        <h2 className="md:text-xl text-base text-center font-bold mb-4">
          افزودن وبلاگ جدید
        </h2>
        <form
          onSubmit={handleSubmit}
          className="border-t m-1  p-2 flex flex-col justify-center items-center space-y-4"
        >
          {/* Title input */}
          <div className="relative w-full">
            <input
              type="text"
              name="title"
              id="title"
              placeholder=" عنوان "
              value={formData.title}
              onChange={handleChange}
              className="peer w-full border-b border-gray-600 bg-transparent py-2 px-1 text-base focus:outline-none focus:border-green"
            ></input>

            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-green transition-all peer-focus:w-full"></span>
          </div>

          {/* Description input */}

          <textarea
            placeholder="توضیحات"
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="border p-2 w-full focus:outline-green"
          ></textarea>
          <input
            ref={fileInputRef}
            id="image"
            type="file"
            name="image"
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {imagePreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">پیش‌ نمایش تصویر:</p>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover border rounded-lg"
              />
            </div>
          )}
          {/* Category selection */}
          <label htmlFor="category" className="block font-semibold">
            دسته‌بندی
          </label>
          <div className="relative w-[350px] lg:w-[400px]">
            {/* Dropdown Button */}
            <div
              className="border p-2 w-full text-center hover:bg-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedCategory
                ? selectedCategory.category_name
                : "انتخاب دسته‌بندی"}
            </div>

            {/* Dropdown List */}
            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-10">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="p-2 flex items-center justify-between"
                  >
                    <span
                      className="cursor-pointer"
                      onClick={() => handleSelect(category)}
                    >
                      {category.category_name}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="bg-red-500 text-white px-2 rounded transition-all disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </li>
                ))}
                <li
                  className="p-2 hover:bg-gray-200 cursor-pointer text-green"
                  onClick={() =>
                    handleSelect({
                      id: "add",
                      category_name: "+ افزودن دسته‌بندی جدید",
                    })
                  }
                >
                  + افزودن دسته‌بندی جدید
                </li>
              </ul>
            )}
          </div>

          {/* New category input */}
          {formData.category === "add" && (
            <div className="space-y-2 lg:flex items-center gap-x-5 w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  id="newCategory"
                  placeholder=" نام دسته‌بندی جدید"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="peer w-full border border-gray-300 bg-transparent rounded-md py-2 px-1 text-base focus:outline-none focus:border-green"
                />
              </div>

              <div className="flex gap-x-4">
                <button
                  type="button"
                  onClick={addNewCategory}
                  className="secondry-btn"
                >
                  افزودن
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, category: "" }))
                  }
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={`secondry-btn ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "در حال ارسال..." : "افزودن"}
          </button>
        </form>
      </div>
      {/* Displaying blogs */}
      <h3 className="text-xl font-bold mt-6 text-center font-Ray_black">
        اخبار موجود
      </h3>
      <center>
        <div className="w-[300px] md:w-[700px] lg:w-[90%] mx-auto overflow-x-scroll lg:overflow-hidden ">
          <table className="w-full  rounded-lg border border-gray-300 shadow-md">
            <thead>
              <tr className="bg-green text-gray-100 text-center">
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  عنوان
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  دسته‌بندی
                </th>
                <th className="border border-gray-300 px-6 py-2.5text-sm font-semibold">
                  تصویر
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  توضیحات
                </th>
                <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody>
              {blogs.length > 0 ? (
                paginatedOrders.map((blog) => (
                  <tr
                    key={blog.id}
                    className="text-center border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                  >
                    <td className="border text-start px-4 py-2">
                      {blog.title}
                    </td>
                    <td className="border px-4 py-2">
                      {categories.length > 0 && blog.category
                        ? categories.find(
                            (category) => category.id === blog.category
                          )?.category_name || "نامشخص"
                        : "نامشخص"}
                    </td>
                    <td className="border px-4 py-2">
                      {blog.image ? (
                        <img
                          src={blog.image} // Adjust path as necessary
                          alt={blog.title}
                          className="w-14 h-10 object-cover"
                        />
                      ) : (
                        "بدون تصویر"
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {" "}
                      {blog.description.length > 20
                        ? `${blog.description.substring(0, 20)}...`
                        : blog.description}
                    </td>
                    <td className=" px-6 py-2 flex justify-center gap-x-5">
                      <button
                        onClick={() => handleEdit(blog)}
                        className=" text-green px-1 py-1 rounded-md transition-all"
                      >
                        <FaRegEdit size={24} />
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className=" text-red-500 px-1 py-1 rounded-md transition-all disabled:opacity-50"
                      >
                        <IoTrashSharp size={24} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="border px-4 py-2 text-center">
                    هیچ وبلاگی برای نمایش وجود ندارد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Component */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </center>
    </div>
  );
};

export default WebBlog;
