import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import axios from "axios";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const SignUp = () => {
  const secretKey = "TET4-1"; // Use a strong secret key
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
  const handleShowPassword = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };
  const navigate = useNavigate();
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [message, setMessage] = useState();
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    role: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    { id: 1, name: "Designer" },
    { id: 2, name: "Reception" },
    // { id: 0, name: "Admin" },
    { id: 3, name: "Head of designers" },
    { id: 4, name: "Printer" },
    { id: 5, name: "Delivery" },
    { id: 6, name: "Digital" },
    { id: 7, name: "Bill" },
    { id: 8, name: "Chaspak" },
    { id: 9, name: "Shop role" },
    { id: 10, name: "Laser" },
  ];
  const [selectedRole, setSelectedRole] = useState(user.role || "");
  const [showPassword, setShowPassword] = useState({
    password: false,
    passwordConfirm: false,
  });
  const handleSelect = (role) => {
    setSelectedRole(role);
    setIsSelectOpen(false);
    handleChange({ target: { name: "role", value: role.id } });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Destructure user inputs
    const {
      firstName,
      lastName,
      username,
      email,
      phoneNumber,
      role,
      password,
      passwordConfirm,
    } = user;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !phoneNumber ||
      !role ||
      !password ||
      !passwordConfirm
    ) {
      Swal.fire({
        icon: "warning",
        title: "خطا!",
        text: "لطفاً تمام فیلدها را پر کنید.",
        confirmButtonText: "باشه",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: "لطفاً یک ایمیل معتبر وارد کنید.",
        confirmButtonText: "باشه",
      });
      return;
    }

    // Phone number validation (10-14 digits)
    const phoneRegex = /^\d{10,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: "شماره تلفن معتبر نیست. لطفاً یک شماره تلفن صحیح وارد کنید.",
        confirmButtonText: "باشه",
      });
      return;
    }

    // Password match validation
    if (password !== passwordConfirm) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: "رمز عبور ها با هم مطابقت ندارند.",
        confirmButtonText: "باشه",
      });
      return;
    }

    // Password strength validation
    if (password.length < 8) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
        confirmButtonText: "باشه",
      });
      return;
    }

    setLoading(true);
    setError("");

    // Get authentication token
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: "توکن احراز هویت یافت نشد، لطفاً دوباره وارد شوید.",
        confirmButtonText: "باشه",
      });
      setLoading(false);
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`, // Add the Authorization header
        "Content-Type": "application/json", // Ensure the content type is set
      };

      const response = await axios.post(
        `${BASE_URL}/users/create/`,
        {
          first_name: user.firstName,
          last_name: user.lastName,
          username: user.username,
          email: user.email,
          phone_number: user.phoneNumber,
          role: user.role,
          password: user.password,
          password_confirm: user.passwordConfirm,
        },
        { headers }
      );

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "موفقیت!",
          text: "کاربر گرامی، حساب شما با موفقیت ایجاد شد! لطفاً ایمیل خود را بررسی کنید تا حساب‌تان را فعال کنید. ✅📩",
          confirmButtonText: "باشه",
        });

        setUser({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          phoneNumber: "",
          role: "",
          password: "",
          passwordConfirm: "",
        });
        setSelectedRole("");
      } else {
        throw new Error(response.data.message || "خطا در ثبت کاربر");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: err.response?.data?.message || "مشکلی در ثبت کاربر رخ داده است.",
        confirmButtonText: "باشه",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);
  return (
    <div className="flex justify-center  items-center  mt-10">
      <div className="w-full max-w-lg lg:max-w-3xl bg-white  p-3 rounded-lg shadow-lg border  border-gray-300">
        <div className="flex items-center justify-center gap-x-2 text-center mb-6">
          <p className="text-xl font-semibold text-center">کاربر جدید</p>
          <FaUser size={22} />
        </div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {message && (
          <div className="text-green-500 text-center mb-4">{message}</div>
        )}

        <form onSubmit={handleSubmit} className=" space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block font-medium mb-1 mr-1"
              >
                نام
              </label>
              <input
                placeholder="نام"
                type="text"
                name="firstName"
                id="firstName"
                value={user.firstName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2  focus:ring-green"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block font-medium mb-1 mr-1">
                تخلص
              </label>
              <input
                placeholder="تخلص"
                type="text"
                name="lastName"
                id="lastName"
                value={user.lastName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block font-medium mb-1 mr-1">
                نام کاربری
              </label>
              <input
                placeholder="نام کاربری"
                type="text"
                name="username"
                id="username"
                value={user.username}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block font-medium mb-1 mr-1">
                ایمیل
              </label>
              <input
                placeholder="ایمیل"
                type="email"
                name="email"
                id="email"
                value={user.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block font-medium mb-1 mr-1"
              >
                نمبر تلفن
              </label>
              <input
                placeholder="نمبر تلفن"
                type="text"
                name="phoneNumber"
                id="phoneNumber"
                value={user.phoneNumber}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green"
              />
            </div>

            {/* Role */}
            <div className=" text-black w-full">
              <label htmlFor="role" className="block font-medium mb-1 mr-1">
                وظیفه
              </label>
              <div className="relative bg-white text-gray-800">
                {/* Selected Role */}
                <div
                  className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green"
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                >
                  {selectedRole ? selectedRole.name : "انتخاب Role"}
                </div>

                {/* Dropdown List */}
                {isSelectOpen && (
                  <ul className="absolute w-full bg-white border border-gray-300  shadow-lg mt-1 z-10">
                    {roles.map((role) => (
                      <li
                        key={role.id}
                        className="p-3 text-black hover:bg-gray-100 border-b cursor-pointer"
                        onClick={() => handleSelect(role)}
                      >
                        {role.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="relive">
              <label htmlFor="password" className="block font-medium mb-1 mr-1">
                رمز عبور
              </label>{" "}
              <div className="relative">
                {" "}
                <input
                  placeholder="رمز"
                  type={showPassword.password ? "text" : "password"}
                  name="password"
                  id="password"
                  value={user.password}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleShowPassword("password")}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                >
                  {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            {/* Confirm Password */}
            <div>
              <div className="">
                <label
                  htmlFor="passwordConfirm"
                  className="block font-medium mb-1 mr-1"
                >
                  تأیید رمز عبور
                </label>{" "}
                <div className="relative">
                  {" "}
                  <input
                    placeholder="تأیید رمز"
                    type={showPassword.passwordConfirm ? "text" : "password"}
                    name="passwordConfirm"
                    id="passwordConfirm"
                    value={user.passwordConfirm}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 bg-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleShowPassword("passwordConfirm")}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                  >
                    {showPassword.passwordConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-2 ">
            <button
              type="submit"
              className="w-full md:w-auto secondry-btn"
              disabled={loading}
            >
              {loading ? "در حال ثبت کردن... " : "ثبت کردن"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
