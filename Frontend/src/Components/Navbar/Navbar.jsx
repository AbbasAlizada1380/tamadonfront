import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import logo from "../../../public/Tamadon.png";
import { BiSolidPhoneCall } from "react-icons/bi";

const Navbar = ({ navItems }) => {
  const location = useLocation(); // Get the current route
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`w-full z-30 transition-all hidden  lg:block duration-500 ${
        isScrolled
          ? "fixed top-0 left-0 z-30  shadow-md "
          : "relative py-2 bg-transparent"
      }`}
    >
      <div
        className={` dark:bg-[#100d25]  flex justify-center items-center ${
          isScrolled && "grid grid-cols-4  bg-[#00513a] dark:bg-primary place-content-center"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-4 ${
            isScrolled ? "blog col-span-1 " : "hidden"
          }`}
        >
          {isScrolled && (
            <div className="flex items-center h-full gap-x-4">
              <Link to="/" className="bg-white p-2 h-full">
                <img src={logo} alt="Logo" className="h-12 w-auto" />
              </Link>
              <div className="md:space-y-1 bg-[#00513a] text-white dark:bg-primary ">
                <h1 className="text-lg font-bold  font-Ray dark:text-[#fff]">
                  مطبعه تمدن
                </h1>
                <h2 className="text-sm font-semibold dark:text-[#fff] tracking-wide">
                  Printing Press
                </h2>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <ul
          className={`lg:flex lg:gap-4 space-y-4 lg:space-y-0 flex justify-center items-center w-full ${
            isScrolled && "col-span-2"
          }`}
        >
          {navItems.map((item, index) => (
            <li
              key={index}
              className={`px-1 text-gray-800 hover:text-[#00513a] ${
                isScrolled ? "text-white hover:text-[#ED8D1D] " : ""
              } py-2 group relative cursor-pointer`}
            >
              <Link
                to={item.path}
                className={`dark:text-white transition-colors text-md font-semibold duration-300 
          
          ${
            location.pathname === item.path
              ? isScrolled
                ? "text-[#ED8D1D]  dark:text-[#ED8D1D] font-bold" // Active state color when scrolled
                : "text-[#00513a] hover:text-gray-900 dark:text-[#00513a] font-bold" // Default active state color
              : " "
          }`}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>

        {/* Phone Number and Icon */}
        <div
          className={`flex items-center ml-5 justify-end gap-4 ${
            isScrolled ? "blog col-span-1 text-start" : "hidden"
          }`}
        >
          <p className="font-bold text-lg sm:text-xl text-white">
            93-772-029-545+
          </p>
          <span className="bg-gray-200 p-2 rounded-full">
            <BiSolidPhoneCall className="text-black animate-pulse" size={22} />
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
