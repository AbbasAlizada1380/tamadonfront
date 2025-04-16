import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Pagination from "../../../Utilities/Pagination";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const SubcategoryForm = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5); // Initial visible items
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown visibility
  const handleDropdownToggle = () => {
    setIsDropdownOpen((prevState) => !prevState); // Toggle dropdown visibility
  };

  const showMore = () => {
    setVisibleCount((prev) => prev + 5); // Show 10 more items
  };

  const showLess = () => {
    setVisibleCount(5); // Reset to 10 items
  };

  useEffect(() => {
    const fetchData = () => {
      axios.get(`${BASE_URL}/common/categories`).then((res) => {
        setCategories(res.data);
      });
      fetchSubcategories();
    };

    fetchData(); // Initial fetch

    const interval = setInterval(fetchData, 3000); // Fetch every 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const fetchSubcategories = () => {
    axios.get(`${BASE_URL}/common/subcategory/`).then((res) => {
      setSubcategories(res.data);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    if (image) formData.append("image", image);

    try {
      if (editId) {
        await axios.put(`${BASE_URL}/common/subcategory/${editId}/`, formData);
        Swal.fire(
          "بروزرسانی شد!",
          "زیر دسته با موفقیت بروزرسانی گردید.",
          "success"
        );
      } else {
        await axios.post(`${BASE_URL}/common/subcategory/`, formData);
        Swal.fire("ثبت شد!", "زیر دسته جدید با موفقیت ثبت گردید.", "success");
      }

      setName("");
      setCategory("");
      setImage(null);
      setEditId(null);
      fetchSubcategories();
    } catch (error) {
      Swal.fire("خطا!", "مشکلی در ذخیره اطلاعات پیش آمد.", "error");
    }
  };

  const handleEdit = (subcategory) => {
    setName(subcategory.name);
    setCategory(subcategory.category);
    setEditId(subcategory.id);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این زیر دسته برای همیشه حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود",
      cancelButtonText: "لغو",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_URL}/common/subcategory/${id}/`);
        fetchSubcategories();
        Swal.fire("حذف شد!", "زیر دسته با موفقیت حذف گردید.", "success");
      } catch (error) {
        Swal.fire("خطا!", "مشکلی در حذف زیر دسته به وجود آمد.", "error");
      }
    }
  };
    //  pagination section
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 10;
  
    // Calculate pagination
    const totalPages = Math.ceil(subcategories.length / postsPerPage);
    const paginatedOrders = [...subcategories] // Create a copy to avoid mutation
      .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <div className="bg-gray-200 w-full py-8">
      <div className="max-w-3xl mx-auto p-6 shadow-lg bg-white rounded-md">
        <h2 className="text-xl text-center font-bold mb-4">
          افزودن زیرمجموعه جدید
        </h2>
        <form
          onSubmit={handleSubmit}
          className="border-t m-1  p-2 flex flex-col justify-center items-center space-y-4"
        >
          <div className="w-full">
            <input
              type="text"
              placeholder="نام زیرمجموعه"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="peer w-full border-b border-gray-600 bg-transparent py-1.5 px-1 text-base focus:outline-none focus:border-blue-600"
            />
          </div>

          <label htmlFor="category" className="block font-semibold">
            دسته‌بندی
          </label>
          <div className="relative w-[350px] lg:w-full">
            {/* Dropdown Button */}
            <button
              className="border p-2 w-full text-center hover:bg-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {category
                ? categories.find((cat) => cat.id === category)?.name
                : "انتخاب دسته‌بندی"}
            </button>

            {/* Dropdown List */}
            {isDropdownOpen && (
              <ul className="absolute w-full grid grid-cols-2 md:grid-cols-3 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-10 overflow-hidden">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="p-3 flex justify-between items-center hover:bg-gray-100 cursor-pointer rounded-md transition-all"
                    onClick={() => {
                      setCategory(cat.id);
                      handleDropdownToggle();
                    }}
                  >
                    {cat.name}
                  </li>
                ))}
                <li
                  className="p-3 text-green hover:bg-gray-100 cursor-pointer rounded-md transition-all"
                  onClick={() => setCategory("add")}
                >
                  + افزودن دسته‌بندی جدید
                </li>
              </ul>
            )}
          </div>

          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-green text-white rounded-md w-full hover:bg-green-600 transition"
          >
            {editId ? "ویرایش" : "افزودن"}
          </button>
        </form>
      </div>

      <div className="p-5 mt-3">
        <p className="text-xl font-bold text-center">لیست زیرمجموعه‌ها</p>
      </div>
      <div className="max-w-3xl mx-auto overflow-x-auto">
        <table className="w-full rounded-lg border border-gray-300 shadow-md">
          <thead>
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2 text-sm font-semibold">
                نام
              </th>
              <th className="border border-gray-300 px-6 py-2 text-sm font-semibold">
                دسته‌بندی
              </th>
              <th className="border border-gray-300 px-6 py-2 text-sm font-semibold">
                شناسه
              </th>
              <th className="border border-gray-300 px-6 py-2 text-sm font-semibold">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {subcategories.length > 0 ? (
             paginatedOrders.map((sub) => (
                <tr
                  key={sub.id}
                  className="text-center border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                >
                  <td className="border-gray-300 text-center  px-6 py-2 text-gray-700">
                    {sub.name}
                  </td>
                  <td className=" border-gray-300 text-center px-6 py-2">
                    {categories.find((category) => category.id === sub.category)
                      ?.name || "Not found"}
                  </td>
                  <td className=" border-gray-300 text-center px-6 py-2">
                    {sub.image && (
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-14 h-10 object-cover rounded-lg border  border-gray-300 shadow-sm"
                      />
                    )}
                  </td>
                  <td className="px-6 py-2 flex justify-center gap-x-5">
                    <button
                      onClick={() => handleEdit(sub)}
                      className="text-green px-1 py-1 rounded-md transition-all "
                    >
                      <FaRegEdit size={24} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-red-500 px-1 py-1 rounded-md transition-all hover:text-red-600"
                    >
                      <IoTrashSharp size={24} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="border px-6 py-3 text-center text-gray-500"
                >
                  زیرمجموعه‌ای ثبت نشده است.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        
         {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default SubcategoryForm;
