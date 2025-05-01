import React, { useState, useEffect } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const Attribute = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [attributeTypes, setAttributeTypes] = useState([
    "dropdown",
    "input",
    "date",
    "checkbox",
  ]);
  const [attribute, setAttribute] = useState("");
  const [shownAttributes, setShownAttributes] = useState([]);
  const [type, setType] = useState("");
  const [editingAttributeId, setEditingAttributeId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false); // To toggle the dropdown

  const handleSelect = (category) => {
    setSelectedCategory(category.id);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };
  // Fetch categories from the API
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setIsTypeDropdownOpen(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch attributes based on selected category
  useEffect(() => {
    if (selectedCategory) {
      const fetchAttributes = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/group/attribute-types/`
          );
          console.log(response);

          const attributeTypes = response.data;

          if (Array.isArray(attributeTypes)) {
            const filteredAttributes = attributeTypes.filter(
              (att) => att.category === selectedCategory
            );
            setShownAttributes(filteredAttributes);
            console.log("Filtered Attributes:", filteredAttributes);
          } else {
            console.warn("attribute_types is not an array:", attributeTypes);
            setShownAttributes([]); // optionally reset
          }
        } catch (error) {
          console.error("Error fetching attributes:", error);
        }
      };

      fetchAttributes();
    } else {
      setShownAttributes([]);
    }
  }, [selectedCategory]);

  // Handle form submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the data
    const data = {
      name: attribute,
      attribute_type: type, // Send the ID of the selected attribute type
      category: selectedCategory, // Send the ID of the selected category
    };

    try {
      let response;
      let successMessage = "";

      if (editingAttributeId) {
        // Update the existing attribute
        console.log(data);
        response = await axios.put(
          `${BASE_URL}/group/attribute-types/${editingAttributeId}/`,
          data
        );
        if (response.status === 200) {
          successMessage = "ویژگی با موفقیت ویرایش شد.";
        } else {
          throw new Error("مشکلی در ویرایش ویژگی وجود دارد.");
        }
      } else {
        // Add a new attribute
        response = await axios.post(`${BASE_URL}/group/attribute-types/`, data);

        if (response.status === 201) {
          successMessage = "اطلاعات با موفقیت ثبت شد.";
        } else {
          throw new Error("مشکلی در ارسال اطلاعات وجود دارد.");
        }
      }

      // Show success Swal
      Swal.fire({
        title: "موفقیت‌آمیز!",
        text: successMessage,
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
      });

      // Clear the form
      setSelectedCategory("");
      setAttribute("");
      setType("");
      setEditingAttributeId(null);

      // Refresh the list of attributes
      const fetchAttributes = await axios.get(
        `${BASE_URL}/group/category/attribute/${selectedCategory}`
      );
      setShownAttributes(fetchAttributes.data.attribute_types);
    } catch (error) {
      console.error("Error sending data:", error);

      // Show error Swal
      Swal.fire({
        title: "خطا!",
        text: "ارسال اطلاعات با خطا مواجه شد.",
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  // Handle attribute deletion
  const handleDelete = async (id) => {
    // Show confirmation alert
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

    if (!confirmDelete.isConfirmed) return;

    try {
      await axios.delete(`${BASE_URL}/group/attribute-types/${id}/`);

      // Remove deleted attribute from state
      setShownAttributes((prev) => prev.filter((attr) => attr.id !== id));

      // Show success alert
      Swal.fire({
        title: "حذف شد!",
        text: "ویژگی با موفقیت حذف شد.",
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Error deleting attribute:", error);

      // Show error alert
      Swal.fire({
        title: "خطا!",
        text: "حذف ویژگی با خطا مواجه شد.",
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  // Handle attribute editing
  const handleEdit = (attr) => {
    setEditingAttributeId(attr.id);
    setAttribute(attr.name);
    setType(attr.attribute_type);
    setSelectedCategory(attr.category);
  };
  // category section
  const [searchTerm, setSearchTerm] = useState("");

  // Filter categories based on search input
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className=" p-4 mt-10 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h2 className="text-lg font-bold mb-4">انتخاب کتگوری و ویژگی‌ها</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Category */}

        <div className="relative w-full">
          <label htmlFor="category" className="block font-medium mb-2">
            کتگوری
          </label>
          {/* Dropdown Button */}
          <div
            className="bg-gray-200 w-full px-3 py-2 flex justify-between items-center border border-gray-300 rounded-md shadow-sm cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedCategory
              ? categories.find((cat) => cat.id === selectedCategory)?.name ||
                "-- لطفاً کتگوری را انتخاب کنید --"
              : "لطفاً کتگوری را انتخاب کنید"}
            <FaChevronDown
              className={`transition-all duration-300 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown List */}
          {isDropdownOpen && (
            <div className=" w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 z-10">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجو نمودن کتگوری..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border-b pl-10 pr-5 outline-none bg-gray-300 placeholder-gray-700"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700" />
              </div>

              {/* Categories List */}
              <ul className="max-h-[300px] overflow-y-auto">
                {filteredCategories.map((category) => (
                  <li
                    key={category.id}
                    className="py-2 px-5 hover:bg-gray-200 border-b text-black cursor-pointer"
                    onClick={() => {
                      setIsDropdownOpen(true);
                      handleSelect(category);
                    }}
                  >
                    {category.name}
                  </li>
                ))}
                {filteredCategories.length === 0 && (
                  <li className="p-3 text-gray-500">نتیجه‌ای یافت نشد</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Attribute Input */}
        <div>
          <label
            htmlFor="attribute"
            className="block text-sm font-medium text-gray-700"
          >
            ویژگی
          </label>
          <input
            type="text"
            id="attribute"
            value={attribute}
            onChange={(e) => setAttribute(e.target.value)}
            placeholder="ویژگی را وارد کنید"
            className="mt-1 block w-full p-2 bg-gray-200 border-gray-300 rounded-md shadow-sm focus:ring-green"
            required
          />
        </div>

        {/* Type Dropdown */}
        <div>
          <div className="w-full">
            <label htmlFor="type" className="block font-medium mb-2">
              نوع
            </label>
            <div className="">
              {/* Dropdown Button */}
              <div
                className="mt-1 flex justify-between  w-full p-2 border bg-gray-200 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              >
                {type || "-- لطفاً انتخاب کنید --"}
                <FaChevronDown
                  className={` transition-all duration-300 ${
                    isTypeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Dropdown List */}
              {isTypeDropdownOpen && (
                <ul className=" w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 z-10">
                  {attributeTypes.map((attributeType) => (
                    <li
                      key={attributeType}
                      className="p-2 hover:bg-gray-200 border-b cursor-pointer"
                      onClick={() => handleTypeSelect(attributeType)}
                    >
                      {attributeType}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex w-full items-center justify-center">
          <button type="submit " className="secondry-btn">
            {editingAttributeId ? "ویرایش" : "ارسال"}
          </button>
        </div>
      </form>

      <ul className="mt-4 space-y-2">
        {shownAttributes.length > 0 ? (
          shownAttributes.map((attr) => (
            <li
              key={attr.id}
              className="px-4 py-2 hover:bg-gray-200 border border-gray-300 rounded-md flex justify-between items-center"
            >
              <span>{attr.name}</span>
              {/* Map attribute_type ID to the corresponding name */}
              <span>{attr.attribute_type || "نامشخص"}</span>
              <div className="flex gap-x-5 items-center">
                <button
                  onClick={() => handleEdit(attr)}
                  className="text-green hover:scale-105 transition-all duration-300"
                >
                  <FaRegEdit size={24} />
                </button>
                <button
                  onClick={() => handleDelete(attr.id)}
                  className="text-red-600 hover:scale-105 transition-all duration-300"
                >
                  <IoTrashSharp size={24} />
                </button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-600"></p>
        )}
      </ul>
    </div>
  );
};

export default Attribute;
