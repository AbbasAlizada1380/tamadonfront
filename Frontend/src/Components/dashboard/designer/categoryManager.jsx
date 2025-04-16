import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaChevronDown, FaRegEdit } from "react-icons/fa";
import { IoTrashSharp } from "react-icons/io5";
import Pagination from "../../../Utilities/Pagination";
import CryptoJS from "crypto-js";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const CategoryManagement = () => {
  const [categoryName, setCategoryName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [editingCategory, setEditingCategory] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const roles = [
    { id: 0, name: "Admin" },
    { id: 1, name: "Designer" },
    { id: 2, name: "Reception" },
    { id: 3, name: "Head_of_designers" },
    { id: 4, name: "Printer" },
    { id: 5, name: "Delivery" },
    { id: 6, name: "Digital" },
    { id: 7, name: "Bill" },
    { id: 8, name: "Chaspak" },
    { id: 9, name: "Shop_role" },
    { id: 10, name: "Laser" },
    { id: 11, name: "Completed" },
  ];
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
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/categories/`);
      setCategories(response.data);
      setFilteredCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const actionType = editingCategory ? "ویرایش" : "اضافه کردن";

    try {
      let response;
      const authToken = decryptData(localStorage.getItem("auth_token")); // ✅ Retrieve token from localStorage
      const headers = {
        Authorization: `Bearer ${authToken}`, // ✅ Add token to headers
      };

      if (editingCategory) {
        response = await axios.put(
          `${BASE_URL}/group/categories/${editingCategory.id}/`,
          {
            name: categoryName,
            stages: selectedRoles,
          },
          { headers } // ✅ Pass headers
        );

        if (response.status === 200) {
          Swal.fire({
            title: "ویرایش موفق!",
            text: "کتگوری با موفقیت ویرایش شد.",
            icon: "success",
            timer: 3000,
            timerProgressBar: true,
          });
          fetchCategories();
          setEditingCategory(null);
        } else {
          throw new Error("ویرایش کتگوری ناموفق بود.");
        }
      } else {
        response = await axios.post(
          `${BASE_URL}/group/categories/`,
          {
            name: categoryName,
            stages: selectedRoles,
          },
          { headers } // ✅ Pass headers
        );

        if (response.status === 201) {
          Swal.fire({
            title: "اضافه شد!",
            text: "کتگوری با موفقیت اضافه شد.",
            icon: "success",
            timer: 3000,
            timerProgressBar: true,
          });
        } else {
          throw new Error("اضافه کردن کتگوری ناموفق بود.");
        }
      }

      setCategoryName("");
      setSelectedRoles([]);
      fetchCategories();
    } catch (error) {
      Swal.fire({
        title: "خطا",
        text: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        icon: "error",
      });
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عملیات قابل بازگشت نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
    });

    if (confirmDelete.isConfirmed) {
      try {
        const response = await axios.delete(
          `${BASE_URL}/group/categories/${id}/delete/`
        );
        if (response.status === 204) {
          Swal.fire({
            title: "حذف شد!",
            text: "کتگوری با موفقیت حذف شد.",
            icon: "success",
            timer: 3000,
            timerProgressBar: true,
          });
          fetchCategories();
        } else {
          Swal.fire({
            title: "خطا",
            text: "حذف کتگوری ناموفق بود.",
            icon: "error",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "خطا",
          text: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
          icon: "error",
        });
        console.error("Error:", error);
      }
    }
  };

  const handleEdit = (category) => {
    setCategoryName(category.name);
    setSelectedRoles(category.stages || []); // ✅ Load existing roles in update mode
    setEditingCategory(category);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setFilteredCategories(
      term
        ? categories.filter((category) =>
            category.name.toLowerCase().includes(term.toLowerCase())
          )
        : categories
    );
  };

  const handleSort = () => {
    const sortedCategories = [...filteredCategories].sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    setFilteredCategories(sortedCategories);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleRoleChange = (roleId, e) => {
    e.stopPropagation();
    setSelectedRoles((prevRoles) =>
      prevRoles.includes(roleId)
        ? prevRoles.filter((id) => id !== roleId)
        : [...prevRoles, roleId]
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = Array.isArray(filteredCategories)
    ? filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  return (
    <div className="py-10 bg-gray-200 w-full min-h-[91vh] px-5">
      <div className="max-w-3xl mx-auto py-4 px-5 shadow-lg bg-white rounded-md">
        <h2 className="text-xl text-center font-bold mb-4">
          {editingCategory ? "ویرایش کتگوری" : "افزودن کتگوری"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">
              نام کتگوری
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-gray-200 text-black focus:outline-none"
              placeholder="نام کتگوری را وارد کنید"
              required
            />
          </div>
          <label className="block text-lg font-medium text-gray-700 mb-1">
            مراحل
          </label>
          <div className="bg-gray-200 p-3 grid grid-cols-2 rounded-lg">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center gap-x-3 border-b p-2  last:border-b-0"
              >
                <input
                  type="checkbox"
                  value={role.name}
                  checked={selectedRoles.includes(role.name)} // ✅ Pre-check existing roles
                  onChange={(e) => handleRoleChange(role.name, e)}
                  className="form-checkbox h-5 w-5 text-green-500 focus:ring-green-500"
                />
                <span className="text-gray-700">{role.name}</span>
              </div>
            ))}
          </div>

          {/* Selected roles order display */}
          {selectedRoles.length > 0 && (
            <div className="mt-4 bg-white p-4 ">
              <h3 className="text-gray-800 font-semibold mb-3 text-lg">
                ترتیب مراحل انتخاب شده:
              </h3>
              <ul className="list-decimal space-y-2 pl-5">
                {selectedRoles.map((roleId) => {
                  const role = roles.find((r) => r.id === roleId);
                  return (
                    <li
                      key={roleId}
                      className="text-gray-700 bg-gray-100 p-2 rounded-md hover:bg-gray-200 transition-colors duration-200"
                    >
                      {roleId}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-4">
            <button type="submit" className="secondry-btn">
              {editingCategory ? "ویرایش" : "اضافه کردن"}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="tertiary-btn"
              >
                انصراف
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Category List */}
      <div className="w-full max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-md overflow-hidden">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نام کتگوری
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                مراحل
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(paginatedCategories) &&
              paginatedCategories.map((category) => (
                <tr
                  key={category.id}
                  className="text-center border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                >
                  <td className="border-gray-300 px-6 py-2 text-gray-700">
                    {category.name}
                  </td>
                  <td className="border-gray-300 px-6 py-2 text-gray-700">
                    <td className="border-gray-300 px-6 py-2 text-gray-700">
                      {Array.isArray(category.stages) &&
                      category.stages.length > 0
                        ? category.stages
                            .map((stageId) => {
                              return stageId; // Ensure a valid name is returned
                            })
                            .join(", ") // Convert the array to a readable string
                        : "ندارد"}
                    </td>
                  </td>
                  <td className="flex items-center justify-center gap-x-5 border-gray-300 px-6 py-2 text-gray-700">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-green hover:scale-105 transition-all duration-300"
                    >
                      <FaRegEdit size={24} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:scale-105 transition-all duration-300"
                    >
                      <IoTrashSharp size={24} />
                    </button>
                  </td>
                </tr>
              ))}
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
    </div>
  );
};

export default CategoryManagement;
