import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import { FaXmark } from "react-icons/fa6";
import Swal from "sweetalert2";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const UpdateProfile = ({ setIsProfilePopupOpen, userImage }) => {
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
  const initializeForm = () => ({
    email: decryptData(localStorage.getItem("email")) || "",
    phone_number: decryptData(localStorage.getItem("phone_number")) || "",
    password: "",
    confirm_password: "",
    profile_picture: userImage,
    old_password: "",
  });
  const [form, setForm] = useState(initializeForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm_password: false,
    old_password: false,
  });
  const handleShowPassword = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };
  const navigate = useNavigate();

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (form.password !== form.confirm_password) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: "رمز عبور ها با هم مطابقت ندارند.",
        confirmButtonText: "باشه",
      });
      setLoading(false);
      return;
    }

    try {
      const token = decryptData(localStorage.getItem("auth_token"));
      const id = decryptData(localStorage.getItem("id"));

      const response = await axios.put(
        `${BASE_URL}/users/update/${id}/`,
        {
          email: form.email,
          phone_number: form.phone_number,
          password: form.password,
          confirm_password: form.confirm_password,
          old_password: form.old_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "موفقیت!",
          text: "پروفایل با موفقیت به روز شد!",
          timer: 3000, // Auto-close after 3 seconds
          showConfirmButton: false,
        });

        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
        }, 3000); // Redirect after 3 seconds

        setIsProfilePopupOpen(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "خطا!",
          text: "به روز رسانی پروفایل با مشکل مواجه شد.",
          confirmButtonText: "باشه",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: err.response?.data?.message || "خطا در به روز رسانی پروفایل.",
        confirmButtonText: "باشه",
      });
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [id]: value,
    }));
  };
  const handleProfilePicSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("profile_pic", form.profile_picture);

    try {
      const token = decryptData(localStorage.getItem("auth_token"));

      const response = await axios.put(
        `${BASE_URL}/users/profile/${form.email}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "موفقیت!",
          text: "عکس پروفایل با موفقیت به روز شد!",
          timer: 3000,
          showConfirmButton: false,
        });

        setTimeout(() => {
          // You can refresh the profile picture or reload the page if needed.
        }, 3000);
      } else {
        Swal.fire({
          icon: "error",
          title: "خطا!",
          text: "به روز رسانی عکس پروفایل با مشکل مواجه شد.",
          confirmButtonText: "باشه",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطا!",
        text: err.response?.data?.message || "خطا در به روز رسانی عکس پروفایل.",
        confirmButtonText: "باشه",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 top-5 lg:top-0 bg-black bg-opacity-80  rounded-lg flex justify-center items-center z-50">
      <div className=" relative bg-white rounded-md shadow-2xl max-h-[100vh] overflow-y-auto space-y-6 w-[80%] lg:w-[50%] ">
        <div className="w-full absolute top-0 right-0 left-0 z-10 h-12 flex justify-center items-center  bg-green">
          <button
            onClick={() => setIsProfilePopupOpen(false)}
            className="bg-white w-8 h-8 text-md rounded-full hover:text-red-500 flex justify-center items-center"
          >
            <FaXmark size={24} />
          </button>
        </div>

        <h2 className="md:text-xl font-Ray_black pt-10 font-extrabold text-gray-800 text-center mb-6">
          به روز رسانی پروفایل
        </h2>
        {successMessage && (
          <div className="text-green-100 bg-green-600 p-3 rounded text-center">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="text-red-100 bg-red-600 p-3 rounded text-center">
            {error}
          </div>
        )}
        {/* Profile Picture Update Form */}
        <form
          type="multipart/form-data"
          onSubmit={handleProfilePicSubmit}
          className="flex flex-col md:flex-row items-center justify-center px-5 gap-x-5 bg-white py-2 md:py-6 rounded-lg shadow-lg border border-gray-200"
        >
          <div className="flex flex-col items-center">
            {form.profile_picture && (
              <img
                src={
                  form.profile_picture instanceof File
                    ? URL.createObjectURL(form.profile_picture)
                    : form.profile_picture
                }
                alt="Profile Preview"
                className="md:w-[120px] md:h-[120px] h-[50px] w-[50px] object-cover rounded-full mb-4 border-2 border-green shadow-xl cursor-pointer transition-transform hover:scale-105"
                onClick={() => setIsImageModalOpen(true)}
              />
            )}
          </div>
          <div className="md:flex flex-col space-y-3">
            <label
              htmlFor="profile_picture"
              className="block text-gray-900 text-center md:text-start font-semibold"
            >
              عکس پروفایل:
            </label>
            <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row justify-center items-center gap-x-4">
              <input
                type="file"
                id="profile_picture"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setForm((prevForm) => ({
                      ...prevForm,
                      profile_picture: file,
                    }));
                  }
                }}
                accept="image/*"
                className="w-[350px] py-1.5 px-3 mt-1 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-1  file:bg-green file:text-white file:font-medium file:px-5 file:py-0.5 file:rounded-lg file:mx-2 file:border-none file:cursor-pointer hover:file:bg-green/90 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-green/90 disabled:bg-gray-400 transition-all"
              >
                {loading ? "در حال به روز رسانی عکس..." : "به روز رسانی  "}
              </button>
            </div>
          </div>
        </form>

        {/* Profile Update Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4 px-4">
          <div className="md:grid space-y-3 md:space-y-0 grid-cols-2 place-content-center gap-5">
            <div>
              <label
                htmlFor="email"
                className="block text-gray-800 pb-2 font-medium"
              >
                ایمیل:
              </label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full py-1.5 px-5  border rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green"
              />
            </div>
            <div>
              <label
                htmlFor="phone_number"
                className="block text-gray-800 pb-2  font-medium"
              >
                شماره تلفن:
              </label>
              <input
                type="text"
                id="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                required
                autoComplete="tel"
                className="w-full py-1.5 px-5  border rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green"
              />
            </div>
          </div>
          <div className="md:grid space-y-3 md:space-y-0 grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="password"
                className="block text-gray-800 pb-2  font-medium"
              >
                رمز عبور جدید:
              </label>
              <div className="relative">
                <input
                  type={showPassword.password ? "text" : "password"}
                  id="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full py-1.5 px-5 border rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green"
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
            <div>
              <label
                htmlFor="confirm_password"
                className="block text-gray-800 pb-2  font-medium"
              >
                تأیید رمز عبور جدید:
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm_password ? "text" : "password"}
                  id="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full py-1.5 px-5 border rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green"
                />
                <button
                  type="button"
                  onClick={() => handleShowPassword("confirm_password")}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                >
                  {showPassword.confirm_password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>
          <div className="md:flex justify-center items-center">
            <div className="md:flex items-center gap-x-2">
              {" "}
              <label
                htmlFor="old_password"
                className="block text-gray-800  font-medium"
              >
                رمز عبور قبلی:
              </label>
              <div className="relative">
                <input
                  type={showPassword.old_password ? "text" : "password"}
                  id="old_password"
                  value={form.old_password}
                  onChange={handleChange}
                  required
                  autoComplete="old-password"
                  className="md:w-[400px] w-[340px] px-4 py-1.5 border bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green"
                />
                <button
                  type="button"
                  onClick={() => handleShowPassword("old_password")}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                >
                  {showPassword.old_password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <button type="submit" disabled={loading} className="secondry-btn">
              {loading ? "در حال به روز رسانی..." : "به روز رسانی پروفایل"}
            </button>
          </div>
        </form>
        {isImageModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 top-0 flex justify-center items-center z-30">
            <div className="bg-white  rounded-lg shadow-lg relative">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute -top-10 right-1/2 bg-red-500 text-white px-2.5 font-bold py-1  rounded-full focus:outline-none"
              >
                ✕
              </button>
              <img
                src={
                  form.profile_picture instanceof File
                    ? URL.createObjectURL(form.profile_picture)
                    : form.profile_picture
                }
                alt="Profile Preview"
                className="w-full h-[400px] rounded-lg"
              />
            </div>
          </div>
        )}
        {/* Other form fields */}
        <div className="flex items-center justify-center pb-5">
          <button
            type="button"
            onClick={() => setIsProfilePopupOpen(false)}
            className="py-1.5 px-10 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            لغو
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
