import React, { useState } from "react";
import { FaUser } from "react-icons/fa";

const BlogCardInSide = ({ item, onClick }) => {
  return (
    <div className="bg-white dark:bg-primary w-[280px] p-5 rounded-xl  transform transition-transform duration-300 hover:scale-95 hover:shadow-lg  overflow-hidden">
      {/* Image Section */}
      <div className="overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-48 object-cover rounded-lg "
        />
      </div>

      {/* Content Section */}
      <div className="p-2 flex flex-col gap-3">
        <h1 className="text-lg font-bold text-center text-gray-800 dark:text-white">
          {item.title}
        </h1>
        {/* <p className="text-gray-600 dark:text-gray-300 text-sm text-justify line-clamp-3">
          {item.description}
        </p> */}
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {item.date}
        </span>
      </div>
      <div className="flex justify-center">
        <button
          onClick={onClick}
          className="primary-btn
          "
        >
          بشتر بخوانید
        </button>
      </div>

      {/* Footer Section */}
      {/* <div className="flex items-center gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="border rounded-full bg-gray-600 h-10 w-10 flex justify-center items-center">
          <FaUser size={20} className="text-gray-50" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            Tamadon
          </p>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            3 ماه قبل
          </span>
        </div>
      </div> */}
    </div>
  );
};

export default BlogCardInSide;
