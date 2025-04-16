import { useState, useRef, useEffect } from "react";
import { MdKeyboardArrowDown, MdFilterList } from "react-icons/md";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const Filtering = ({ onCategoryChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("فیلتر");
  const [categories, setCategories] = useState([]); // State for storing fetched categories
  const dropdownRef = useRef(null);

  // Toggle the dropdown menu
  const toggleDropdown = () => {
    console.log("Dropdown toggled"); // Debugging line
    setIsOpen(!isOpen);
  };

  // Close the dropdown menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        console.log("Clicked outside"); // Debugging line
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch categories from API when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/reception/api/post-categories/`
        );
        console.log("Fetched categories:", response.data); // Debugging line
        const fetchedCategories = response.data;
        setCategories([{ category_name: "همه" }, ...fetchedCategories]); // Add "All" option to the categories
      } catch (error) {
        console.error("Error fetching categories:", error.message);
      }
    };

    fetchCategories();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Handle option selection
  const handleOptionClick = (option) => {
    console.log("Selected option:", option.category_name); // Debugging line
    setSelectedOption(option.category_name);
    setIsOpen(false);
    // If "All" is selected, pass an empty string to show all posts
    onCategoryChange(option.category_name === "همه" ? "" : option.id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={toggleDropdown}
        className="px-3 py-2 flex font-semibold justify-between items-center rounded-md border border-gray-300 bg-white dark:text-gray-100 dark:bg-primary md:w-[220px] w-[80px] focus:outline-none"
      >
        {/* Show filter icon on small screens and selectedOption text on larger screens */}
        <span className="flex items-center gap-2">
          <span className="block font-semibold">
            <MdFilterList className="text-xl" />
          </span>
          <span className="hidden md:block">{selectedOption}</span>
        </span>
        <MdKeyboardArrowDown
          className={`text-xl font-semibold duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute mt-2 md:w-full -right-32 md:right-0 min-w-[200px] rounded-md border border-gray-300 bg-white dark:bg-primary shadow-md z-10">
          <ul className="py-1">
            {categories.map((category) => (
              <li
                key={category}
                onClick={() => handleOptionClick(category)}
                className="px-4 py-2 dark:text-gray-100 hover:bg-gray-100 dark:hover:text-primary dark:border-b  cursor-pointer"
              >
                {category.category_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Filtering;
