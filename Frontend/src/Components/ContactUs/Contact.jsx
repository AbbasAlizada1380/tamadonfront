import React, { useState } from "react";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";


const BASE_URL = import.meta.env.VITE_BASE_URL;

function Contact() {
  const iconStyle = "text-5xl mr-4 bg-gray-700 p-2 text-[#2bb987] rounded-md";
  const infoStyle = "text-md font-semibold text-gray-900";
  const textStyle = "text-gray-600";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [responseMessage, setResponseMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to get CSRF token from cookies
  const getCsrfToken = () => {
    const name = "csrftoken";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError(""); // Clear error when input changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validation
    if (!formData.email.includes("@")) {
      setError("ایمیل نامعتبر است");
      return;
    }

    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      setResponseMessage("CSRF token missing.");
      return;
    }

    setIsLoading(true); // Set loading state

    try {
      const response = await axios.post(
        `${BASE_URL}/profile/contact/`,
        formData,
        {
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );
      setResponseMessage(response.data.message || "پیام شما ارسال شد");
      setFormData({ name: "", email: "", message: "" }); // Clear form
    } catch (error) {
      console.error("Error sending message:", error);
      setResponseMessage("مشکلی در ارسال پیام وجود دارد");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <section className=" mb-10 bg-gray-200 dark:bg-primary px-4 pb-5 md:px-10">
      <div className="flex flex-col md:flex-row items-center  gap-3 px-4 py-5 relative z-10">
        <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-100 font-bold">
          نظریات و پیشنهادات خود را با ما شریک نمایید
        </p>
        <hr className="flex-grow border-t border-dashed border-gray-500 hidden md:block" />
        <p className="text-gray-50 bg-green px-2 py-1 rounded-full text-sm dark:bg-secondary">
          Send us a message
        </p>
      </div>
      <div className="flex flex-col lg:flex-row  items-center justify-center mt-2 md:mt-10 gap-4">
        <div className="w-full lg:w-[60%] order-2 lg:order-1 bg-white dark:bg-black-100 p-6 rounded-lg shadow-lg">
          <div className="p-4 md:p-8 ">
            <h3 className="text-xl md:text-2xl font-Ray_black dark:text-gray-100 font-semibold mb-4 pb-2">
              فورم ارتباط با ما
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6 ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative group">
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="border-2 w-full text-gray-500 px-3 focus:text-[#2bb987] text-lg py-1.5 focus:outline-none bg-transparent rounded-md focus:border-[#2bb987] peer"
                  />
                  <span className="absolute right-0 top-2 px-2 text-md uppercase text-gray-600 peer-focus:text-[#2bb987] pointer-events-none peer-focus:text-sm peer-focus:-translate-y-4 duration-200 bg-white dark:bg-black-100 peer-valid:text-sm peer-valid:-translate-y-5 mr-4">
                    ایمیل شما
                  </span>
                </div>
                <div className="relative group">
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="border-2 w-full text-gray-300 px-3 focus:text-[#2bb987] text-lg py-1.5 focus:outline-none bg-transparent rounded-md focus:border-[#2bb987] peer"
                  />
                  <span className="absolute right-0 top-2 px-2 text-md uppercase peer-focus:text-[#2bb987] pointer-events-none peer-focus:text-sm peer-focus:-translate-y-4 duration-200 bg-white dark:bg-black-100 text-gray-600  peer-valid:text-sm peer-valid:-translate-y-5 mr-4">
                    نام شما
                  </span>
                </div>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-gray-700 dark:text-gray-200 mb-2"
                >
                  پیام شما
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="پیام خود را بنوسید..."
                  rows="6"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg focus:border-[#2bb987] focus:outline-none bg-transparent"
                ></textarea>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex justify-center lg:justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`primary-btn ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "در حال ارسال..." : "ارسال پیام"}
                </button>
              </div>
            </form>
            {responseMessage && (
              <p className="mt-4 text-center text-green-600">
                {responseMessage}
              </p>
            )}
          </div>
        </div>
        <div className="w-full border bg-white lg:w-[25%] order-1 lg:order-2 h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
          <img
            src='/contact-us.png'
            alt="image for contact"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export default Contact;
