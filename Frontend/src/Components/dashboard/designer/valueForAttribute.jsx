import axios from "axios";
import React, { useState, useEffect } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";

const ValueForAttributes = () => {
  const [categories, setCategories] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [filteredAttributes, setFilteredAttributes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [isAttributeDropdownOpen, setIsAttributeDropdownOpen] = useState(false);
  const [values, setValues] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [filteredValues, setFilteredValues] = useState([]);
  const [editingValue, setEditingValue] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchAllAttributes();
    fetchValues();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = allAttributes.filter(
        (attribute) => attribute.category === parseInt(selectedCategory)
      );
      setFilteredAttributes(filtered);
    } else {
      setFilteredAttributes([]);
    }
  }, [selectedCategory, allAttributes]);

  useEffect(() => {
    // Filter values based on selected attribute and type
    if (selectedAttribute) {
      const filtered = values.filter(
        (value) => value.attribute === parseInt(selectedAttribute)
      );
      setFilteredValues(filtered);
    } else {
      setFilteredValues([]);
    }
  }, [selectedAttribute, values]);

  const handleAddValue = async () => {
    if (!newValue) {
      setMessage("لطفاً تمامی مقادیر را وارد کنید.");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/group/attribute-values/`, {
        attribute_value: newValue,
        attribute: selectedAttribute,
      });

      setValues([...values, response.data]);
      setNewValue("");
      setMessage("مقدار با موفقیت اضافه شد.");
    } catch (error) {
      setMessage("خطا در افزودن مقدار جدید.");
      console.error("Error adding value:", error);
    }
  };
  const handleDeleteValue = async (valueId) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این مقدار پس از حذف قابل بازیابی نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${BASE_URL}/group/attribute-values/${valueId}/`);
        setValues(values.filter((value) => value.id !== valueId));

        Swal.fire({
          title: "حذف شد!",
          text: "مقدار با موفقیت حذف شد.",
          icon: "success",
          confirmButtonText: "باشه",
        });
      } catch (error) {
        Swal.fire({
          title: "خطا!",
          text: "خطا در حذف مقدار.",
          icon: "error",
          confirmButtonText: "متوجه شدم",
        });
        console.error("Error deleting value:", error);
      }
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAllAttributes();
    fetchValues();
  }, []);

  useEffect(() => {
    setFilteredAttributes(
      selectedCategory
        ? allAttributes.filter(
            (attr) => attr.category === parseInt(selectedCategory)
          )
        : []
    );
  }, [selectedCategory, allAttributes]);

  useEffect(() => {
    setFilteredValues(
      selectedAttribute
        ? values.filter(
            (value) => value.attribute === parseInt(selectedAttribute)
          )
        : []
    );
  }, [selectedAttribute, values]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/group/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttributes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/group/attribute-types/`);
      setAllAttributes(response.data);
    } catch (error) {
      setMessage("خطا در دریافت مشخصه‌ها.");
      console.error("Error fetching attributes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setIsCategoryDropdownOpen(false);
    setSelectedAttribute("");
  };

  const handleAttributeSelect = (attributeId) => {
    setSelectedAttribute(attributeId);
    setIsAttributeDropdownOpen(false);
  };
  const handleEditTypeChange = (id, newType) => {
    setFilteredValues((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, editType: newType } : item
      )
    );
  };

  useEffect(() => {
    fetchValues();
  }, []);

  useEffect(() => {
    if (selectedAttribute) {
      setFilteredValues(
        values.filter(
          (value) => value.attribute === parseInt(selectedAttribute)
        )
      );
    } else {
      setFilteredValues([]);
    }
  }, [selectedAttribute, values]);

  const fetchValues = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/attribute-values/`);
      setValues(response.data);
    } catch (error) {
      console.error("Error fetching values:", error);
    }
  };

  const handleEditValue = (value) => {
    setEditingValue({ ...value, newValue: value.attribute_value });
  };

  const handleEditInputChange = (newValue) => {
    setEditingValue((prev) => ({ ...prev, newValue }));
  };

  const handleSaveEdit = async () => {
    if (!editingValue) return;
    try {
      const response = await axios.put(
        `${BASE_URL}/group/attribute-values/${editingValue.id}/`,
        {
          attribute_value: editingValue.newValue,
          attribute: editingValue.attribute,
        }
      );

      setValues((prev) =>
        prev.map((item) =>
          item.id === editingValue.id ? { ...item, ...response.data } : item
        )
      );
      setEditingValue(null);

      Swal.fire({
        icon: "success",
        title: "موفقیت‌آمیز!",
        text: "مقدار با موفقیت ویرایش شد.",
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "خطا!", text: "خطا در ویرایش مقدار." });
      console.error("Error updating value:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingValue(null);
  };

  //  categories section
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter categories based on search input
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-10 bg-gray-200 w-full min-h-[91vh] px-5">
      <div className="max-w-3xl mx-auto p-2 shadow-lg bg-white rounded-md">
        <h2 className="md:text-xl text-base text-center font-bold mb-4">
          مدیریت مقدار مشخصه‌ها
        </h2>

        {message && <p className="mb-4 text-green text-center">{message}</p>}
        <div className="mb-4 mt-3">
          <label className="block text-lg font-medium mb-2 text-gray-700">
            کتگوری سفارش
          </label>
          <div className="relative">
            {/* Dropdown Button */}
            <div
              className="w-full px-3 py-2 border flex justify-between items-center bg-gray-200 rounded text-black cursor-pointer"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            >
              {selectedCategory
                ? categories.find((cat) => cat.id === selectedCategory)?.name ||
                  "کتگوری را انتخاب کنید"
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
                  <input
                    type="text"
                    placeholder="جستجو نمودن کتگوری..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border-b pl-10 pr-5 outline-none focus:border-green bg-gray-300 placeholder-gray-700"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700" />
                </div>

                {/* Categories List */}
                <ul className="max-h-[400px] overflow-y-auto">
                  {filteredCategories.map((category) => (
                    <li
                      key={category.id}
                      className="py-2 px-5 hover:bg-gray-200 border-b text-black cursor-pointer"
                      onClick={() => {
                        handleCategorySelect(category.id);
                        setIsCategoryDropdownOpen(false); // Close dropdown on selection
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
        </div>

        {selectedCategory && (
          <div className="mb-6">
            <label className="block text-lg font-medium mb-2 text-gray-700">
              انتخاب مشخصه
            </label>
            <div className="">
              {/* Dropdown Button */}
              <div
                className="p-3 border rounded flex justify-between items-center w-full bg-gray-200  focus:ring-2 focus:ring-blue-500 cursor-pointer"
                onClick={() =>
                  setIsAttributeDropdownOpen(!isAttributeDropdownOpen)
                }
              >
                {selectedAttribute
                  ? filteredAttributes.find(
                      (attr) => attr.id === selectedAttribute
                    )?.name || "مشخصه را انتخاب کنید"
                  : "مشخصه را انتخاب کنید"}
                <FaChevronDown
                  className={` transition-all duration-300 ${
                    isAttributeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Dropdown List */}
              {isAttributeDropdownOpen && (
                <ul className=" w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1">
                  {filteredAttributes.map((attribute) => (
                    <li
                      key={attribute.id}
                      className="px-3 py-2 hover:bg-gray-200 border-b cursor-pointer"
                      onClick={() => handleAttributeSelect(attribute.id)}
                    >
                      {attribute.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {selectedAttribute && (
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-lg font-medium mb-2 text-gray-700">
                مقدار مشخصه
              </label>
              <input
                type="text"
                className="p-3  rounded w-full bg-gray-200 focus:ring-2 focus:ring-green"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="مقدار را وارد کنید"
              />
            </div>

            <div className="flex justify-center items-center">
              <button
                onClick={handleAddValue}
                disabled={!newValue}
                className={`secondry-btn ${
                  newValue ? "secondry-btn" : ""
                } `}
              >
                افزودن مقدار
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Filtered Values List */}
      <div className="w-[400px] md:w-[700px] mt-10 lg:w-[60%] mx-auto rounded-md  lg:overflow-hidden">
        {filteredValues.length > 0 && (
          <ul className="space-y-1">
            {filteredValues.map((value) => (
              <li
                key={value.id}
                className="p-4 bg-gray-100 rounded shadow flex justify-between items-center"
              >
                {editingValue && editingValue.id === value.id ? (
                  <div className="flex-1 flex items-center gap-4">
                    <input
                      type="text"
                      value={editingValue.newValue}
                      onChange={(e) => handleEditInputChange(e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                    <button
                      className="px-2 py-1 bg-green text-white rounded"
                      onClick={handleSaveEdit}
                    >
                      ذخیره
                    </button>
                    <button
                      className="px-2 py-1 bg-gray-500 text-white rounded"
                      onClick={handleCancelEdit}
                    >
                      لغو
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{value.attribute_value}</span>
                    <button
                      className="text-green hover:scale-105 transition-all duration-300"
                      onClick={() => handleEditValue(value)}
                    >
                      <FaRegEdit size={24} />
                    </button>
                    <button
                      className="text-red-600 hover:scale-105 transition-all duration-300"
                      onClick={() => handleDeleteValue(value.id)}
                    >
                      <IoTrashSharp size={24} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ValueForAttributes;
