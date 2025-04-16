import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { IoMdArrowDropleft } from "react-icons/io";
import { BiMenuAltRight } from "react-icons/bi";
const BlogCategoryListDetailsPage = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/reception/api/post-categories/`
        );
        setCategories(response.data); // Set the fetched categories
      } catch (error) {
        console.error("Error fetching categories:", error.message);
      }
    };
    fetchCategories();
  }, []);
  return (
    <div className="border rounded-lg bg-gray-100 dark:bg-tertiary w-full h-auto">
      <ul className="p-4 md:p-5">
        <li className="flex items-center gap-x-4 p-2 border-b">
           <span className="dark:text-gray-100">
                      <BiMenuAltRight size={30} />
                    </span>
          <span className="text-md font-semibold dark:text-gray-100">
            دسته بندی مقالات
          </span>
        </li>
        {categories.map((blog, index) => (
          <li
            key={index}
            className="flex items-center relative hover:bg-white gap-x-1 p-2 dark:hover:text-gray-900 dark:text-gray-100 cursor-pointer group"
            onClick={() => navigate(`/category/${blog.id}`)}
          >
            <span className="group-hover:-translate-x-2 transition-transform duration-300 ease-in-out">
                  <IoMdArrowDropleft size={24} />
                </span>
            <span className="text-base group-hover:-translate-x-2 transition-transform duration-300 ease-in-out">
              {blog.category_name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlogCategoryListDetailsPage;
