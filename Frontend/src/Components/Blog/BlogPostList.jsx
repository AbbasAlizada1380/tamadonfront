import React, { useState } from "react";
import { BiMenuAltRight } from "react-icons/bi";
import { IoMdArrowDropleft } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const BlogPostList = ({ blogs = [] }) => {
  const navigate = useNavigate();
  const [visibleBlogs, setVisibleBlogs] = useState(8); // Default visible blogs count

  // Function to handle "View More" button click
  const handleViewMore = () => {
    setVisibleBlogs((prev) => prev + 10); // Increase by 10
  };

  // Function to handle "View Less" button click
  const handleViewLess = () => {
    setVisibleBlogs((prev) => Math.max(10, prev - 10)); // Decrease but not below 10
  };

  return (
    <div className="border rounded-lg bg-gray-100 dark:bg-primary w-full h-auto">
      <ul className="p-4 md:p-5">
        <li className="flex items-center gap-x-4 p-2 border-b">
          <span className="dark:text-gray-100">
            <BiMenuAltRight size={30} />
          </span>
          <span className="text-md font-semibold dark:text-gray-100">
            آخرین مقالات
          </span>
        </li>
        {blogs.slice(0, visibleBlogs).map((blog, index) => (
          <li
            key={index}
            className="flex items-center relative hover:bg-white dark:hover:text-gray-100 dark:hover:bg-tertiary gap-x-1 p-2 dark:text-gray-100 cursor-pointer group"
            onClick={() =>
              navigate(
                `/blog/${encodeURIComponent(
                  blog.title.replace(/\s+/g, "-").toLowerCase()
                )}`,
                {
                  state: { blog: blog },
                }
              )
            }
          >
            <span className="group-hover:-translate-x-2 transition-transform duration-300 ease-in-out">
              <IoMdArrowDropleft size={24} />
            </span>
            <span className="text-base group-hover:-translate-x-2 transition-transform duration-300 ease-in-out">
              {blog.title}
            </span>
          </li>
        ))}
      </ul>

      {/* Buttons for "View More" and "View Less" */}
      <div className="flex justify-center p-4 gap-4">
        {blogs.length > visibleBlogs && (
          <button onClick={handleViewMore} className="primary-btn">
            مشاهده بیشتر
          </button>
        )}
        {visibleBlogs > 10 && (
          <button onClick={handleViewLess} className="primary-btn">
            مشاهده کمتر
          </button>
        )}
      </div>
    </div>
  );
};

export default BlogPostList;
