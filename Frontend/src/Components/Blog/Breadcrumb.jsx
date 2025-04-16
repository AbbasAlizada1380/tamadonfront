import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { MdHome } from "react-icons/md";

const Breadcrumb = () => {
  const location = useLocation();
  const paths = location.pathname.split("/").filter((path) => path);
  const blogTitle = location.state?.blog?.title;

  return (
    <nav className="text-md flex justify-center md:justify-start mt-5 lg:mt-0  text-gray-500 dark:text-gray-100 py-2 px-5 dark:bg-primary bg-gray-100 rounded-lg mb-4">
      <ul className="inline-flex   font-semibold items-center">
        <li>
          <Link to="/" className="hover:text-gray-800 text-xs flex items-center md:text-md">
            <span className="hidden md:block"> صفحه اصلی </span><MdHome className="block md:hidden  text-xl" />
          </Link>
        </li>
        {paths.map((path, index) => {
          const routeTo = `/${paths.slice(0, index + 1).join("/")}`;
          const isLast = index === paths.length - 1;
          const translatedPath =
            path === "blog" ? "وبلاگ" : decodeURIComponent(path);
          return (
            <li key={index} className="inline-flex items-center text-xs md:text-md ">
              <MdOutlineKeyboardArrowLeft size={24} className="" />
              {isLast ? (
                <span className="text-gray-800 dark:text-gray-300 font-semibold">
                  {blogTitle || translatedPath}
                </span>
              ) : (
                <Link to={routeTo} className="hover:text-gray-800">
                  {translatedPath}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
