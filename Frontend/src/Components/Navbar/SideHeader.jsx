import React, { useState, useEffect } from "react";
import { MdMenu } from "react-icons/md";
import { FaXmark } from "react-icons/fa6";
import logo from "../../../public/Tamadon.png";
import { MdWbSunny, MdNightlight } from "react-icons/md";
import { FaSearch } from "react-icons/fa";
import { LuLogIn } from "react-icons/lu";
import ResNavbar from "./ResNavbar";
import { Link } from "react-router-dom";
import CryptoJS from "crypto-js";
import axios from "axios";
import jspdf from "jspdf";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const SideHeader = ({ navItems }) => {
  const [open, setOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [incommingData, setIncommingData] = useState([]);
  const [darkmode, setDarkmode] = useState(() => {
    const savedMode = localStorage.getItem("darkmode");
    return savedMode === "false";
  });

  const [inputValue, setInputValue] = useState("");
  const secretKey = "TET4-1";
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);
  useEffect(() => {
    if (isModelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModelOpen]);
  const toggleDarkMode = () => {
    setDarkmode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkmode", newMode);
      return newMode;
    });
  };

  const searchOrderBySecretKey = async (inputValue, event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const apiUrl = `${BASE_URL}/group/order/?search=${inputValue}`;
    const email = decryptData(localStorage.getItem("email")); // Retrieve email from localStorage
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) {
      console.error("No authentication token found in localStorage.");
    }
    const headers = {
      Authorization: `Bearer ${token}`, // Add the Authorization header
      "Content-Type": "application/json", // Ensure the content type is set
    };

    try {
      // Make the GET request with headers
      const response = await axios.get(apiUrl);

      // Check if data is empty (no order found)
      if (response.data.length === 0) {
        setIncommingData(null); // Set null to indicate no data found
      } else {
        setIncommingData(response.data);
      }

      setIsModelOpen(true);
      setInputValue("");
    } catch (error) {
      // Handle errors
      console.error(
        "Error fetching orders:",
        error.response?.data || error.message
      );
      setIncommingData(null); // Show "not found" state on error
      setIsModelOpen(true);
    }
  };

  useEffect(() => {
    if (darkmode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkmode]);

  return (
    <div className="">
      <div className="bg-[#00513a] px-5 py-3 md:py-5 lg:py-0 lg:px-0 dark:bg-primary h-auto lg:flex pb-5 lg:pb-0 justify-between lg:h-[120px]">
        {/* Mobile Menu Button */}
        <div className="flex justify-between items-center p-0 ">
          <div
            className="lg:hidden flex items-center h-10 font-bold bg-red-600 rounded-full py-1 px-2 justify-center"
            onClick={() => setOpen(!open)}
          >
            {!open ? (
              <MdMenu className="text-2xl text-gray-100 hover:text-gray-400" />
            ) : (
              <FaXmark className="text-2xl text-gray-100 hover:text-gray-400" />
            )}
          </div>
          <div className="lg:flex items-center  md:gap-5">
            <Link
              to="/"
              className="w-[130px] bg-white   flex items-center justify-center"
            >
              <img
                src="/Tamadon.png"
                alt="logo"
                className=" hidden   lg:flex h-[90px] md:h-[120px] p-2 w-auto"
              />
            </Link>
            <div className="md:space-y-1 text-center  lg:text-right">
              <h1 className="md:text-5xl text-lg font-bold font-Ray text-[#fff]">
                مطبعه تمدن
              </h1>
              <h2 className="lg:text-xl hidden lg:block text-md  text-[#fff] ">
                Tamadon Printing Press
              </h2>
            </div>
          </div>
          {/* Dark Mode Section */}
          <div
            className={`relative block  lg:hidden items-center w-[70px]  h-[30px] cursor-pointer rounded-full border 
      ${
        darkmode ? "bg-zinc-700" : "bg-white"
      } shadow-sm transition-all duration-300`}
          >
            <div
              className={`absolute w-[25px] h-[25px] rounded-full top-[2px] transition-all duration-300 shadow-md
        ${
          darkmode
            ? "left-[65px] translate-x-[-100%] bg-zinc-900"
            : "left-[3px] bg-gradient-to-r from-orange-500 to-yellow-400"
        }`}
            ></div>

            <MdWbSunny
              onClick={() => setDarkmode(false)}
              className={`absolute left-[8px] w-4 h-4 top-1.5 transition-all ${
                darkmode ? "opacity-50 " : "opacity-100 text-yellow-500"
              }`}
            />

            <MdNightlight
              onClick={() => setDarkmode(true)}
              className={`absolute right-[8px] w-4 top-1.5 h-4 transition-all ${
                darkmode ? "opacity-100 text-blue-700" : "opacity-50 text-black"
              }`}
            />
          </div>
        </div>

        {/* Bottom Section (Search and Dark Mode) */}
        <div className="mt-2 md:mt-0 md:px-5 flex flex-col  md:flex-row lg:justify-between md:justify-center items-center">
          {/* Search Box */}
          <form
            className="relative flex mt-5 lg:mt-0 items-center w-full md:w-[450px] lg:flex-row"
            onSubmit={(e) => searchOrderBySecretKey(inputValue, e)}
          >
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`py-2 border font-semibold rounded-r-full md:rounded-r-full md:rounded-bl-none px-2 w-[150px] lg:w-auto ${
                inputValue.trim()
                  ? "bg-[#ED8D1D] text-white px-1 lg:px-5  cursor-pointer"
                  : "bg-gray-200 text-gray-500 px-5 cursor-not-allowed"
              }`}
            >
              {inputValue.trim() ? " جستجو" : "  جستجو"}
            </button>
            <input
              type="text"
              placeholder="جستجو بر اساس بارکد سفارش "
              className="lg:w-[300px] w-[350px] pl-10 pr-4 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-l-full md:rounded-l-full md:rounded-tr-none shadow-sm focus:outline-none border-r-gray-500"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="absolute inset-y-0 left-4 md:left-8 lg:left-20 flex items-center">
              <FaSearch className="text-gray-600" />
            </div>
          </form>

          {/* Dark Mode Section laptop */}
          <div
            className={`relative hidden  lg:flex items-center w-[70px]  h-[30px] cursor-pointer rounded-full border 
      ${
        darkmode ? "bg-zinc-700" : "bg-white"
      } shadow-sm transition-all duration-300`}
          >
            {/* Toggle Circle */}
            <div
              className={`absolute w-[25px] h-[25px] rounded-full top-[2px] transition-all duration-300 shadow-md
        ${
          darkmode
            ? "left-[65px] translate-x-[-100%] bg-zinc-900"
            : "left-[3px] bg-gradient-to-r from-orange-500 to-yellow-400"
        }`}
            ></div>

            {/* Sun Icon (Light Mode) */}
            <MdWbSunny
              onClick={() => setDarkmode(false)}
              className={`absolute left-[8px] w-4 h-4 transition-all ${
                darkmode ? "opacity-50" : "opacity-100 text-yellow-500"
              }`}
            />

            {/* Moon Icon (Dark Mode) */}
            <MdNightlight
              onClick={() => setDarkmode(true)}
              className={`absolute right-[8px] w-4 h-4 transition-all ${
                darkmode ? "opacity-100 text-blue-700" : "opacity-50 text-black"
              }`}
            />
          </div>
        </div>
        {isModelOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-50">
            <div className="bg-white p-6 rounded-lg w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] shadow-lg relative">
              <h2 className="text-2xl font-bold text-gray-800 mb-5 text-center border-b pb-3">
                📦 جزئیات سفارش
              </h2>
              {incommingData ? (
                <div className="space-y-4 text-gray-700">
                  <div className="bg-gray-100 p-3 rounded-lg space-x-5">
                    <strong className="text-gray-900">نام سفارش:</strong>{" "}
                    {incommingData[0].order_name}
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <strong className="text-gray-900">نام مشتری:</strong>{" "}
                    {incommingData[0].customer_name}
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <strong className="text-gray-900">وضعیت:</strong>
                    <span
                      className="px-2 py-1 rounded text-white ml-2"
                      style={{
                        backgroundColor:
                          {
                            taken: "#4CAF50",
                            pending: "#FF9800",
                            done: "#2196F3",
                            processing: "#9C27B0",
                          }[incommingData[0].status] || "#9E9E9E",
                      }}
                    >{incommingData[0].status}
                    </span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <strong className="text-gray-900">کد :</strong>{" "}
                    {incommingData[0].secret_key}
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <strong className="text-gray-900">ویژگی ها:</strong>
                    {incommingData[0].attributes &&
                    Object.keys(incommingData[0].attributes).length > 0 ? (
                      <ul className="mt-2 list-disc list-inside text-gray-600">
                        {Object.keys(incommingData[0].attributes).map((key) => (
                          <li key={key}>
                            <strong className="text-gray-800">{key}:</strong>{" "}
                            {incommingData[0].attributes[key]}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-gray-500">
                        ویژگی ها موجود نیستند
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 text-lg">
                  ❌ سفارشی با این کد یافت نشد.
                </p>
              )}
              <div className="flex justify-center items-center mt-5">
                <button
                  className="secondry-btn"
                  onClick={() => setIsModelOpen(false)}
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Responsive Navbar */}
        {open && (
          <div>
            <div
              onClick={() => setOpen(false)}
              className="fixed left-0 right-0 top-0
                     bottom-0 bg-black opacity-80 z-40"
            ></div>
            <ResNavbar navItems={navItems} open={open} setOpen={setOpen} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SideHeader;
