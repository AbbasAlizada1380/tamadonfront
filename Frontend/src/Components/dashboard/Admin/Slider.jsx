import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Pagination from "../../../Utilities/Pagination";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Slider = () => {
  const [sliders, setSliders] = useState([]);
  const [formData, setFormData] = useState({ id: "", image: null });
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const secretKey = "TET4-1";
  const decryptData = (hashedData) => {
    if (!hashedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  useEffect(() => {
    const token = decryptData(localStorage.getItem("auth_token"));
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Token ${token}`;
    }
  }, []);

  const fetchSliders = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/common/upload-image/`);
      if (response.status === 200) setSliders(response.data);
      else setError("بارگذاری تصاویر با مشکل مواجه شد.");
    } catch {
      setError("خطا در دریافت تصاویر.");
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("auth_token");
    const form = new FormData();

    if (!formData.image) {
      setError("لطفاً یک تصویر انتخاب کنید.");
      setIsSubmitting(false);
      setPreview();
      return;
    }

    form.append("image", formData.image);

    try {
      let response;
      if (selectedImageId) {
        response = await axios.put(
          `${BASE_URL}/common/upload-image/${selectedImageId}/`,
          form,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Token ${token}`,
            },
          }
        );
        if (response.status === 200) {
          Swal.fire("ویرایش شد!", "تصویر موفقانه ویرایش شد.", "success");

          setSliders((prev) =>
            prev.map((s) =>
              s.id === selectedImageId
                ? { ...s, images: response.data.images }
                : s
            )
          );
          setSelectedImageId(null);
          fetchSliders();
        }
      } else {
        response = await axios.post(`${BASE_URL}/common/upload-image/`, form, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Token ${token}`,
          },
        });
        if (response.status === 201) {
          Swal.fire("افزوده شد!", "تصویر موفقانه اضافه شد.", "success");
          setSliders((prev) => [...prev, response.data]);
          fetchSliders();
        }
      }
    } catch (error) {
      setError(error.response?.data?.detail || "ثبت تصویر ناکام شد.");
    } finally {
      setIsSubmitting(false);
      setFormData({ id: "", image: null });
      document.getElementById("imageInput").value = ""; // Clear input field
      setPreview(null);
    }
  };

  const handleEdit = (image) => {
    setFormData({ id: image.id, image: null });
    setSelectedImageId(image.id);
    setPreview(`${BASE_URL}${image.images}`);
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عملیات قابل بازگشت نیست.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("auth_token");
          const response = await axios.delete(
            `${BASE_URL}/common/upload-image/${id}/`,
            {
              headers: { Authorization: `Token ${token}` },
            }
          );

          if (response.status === 204) {
            setSliders((prevSliders) => prevSliders.filter((s) => s.id !== id));
            Swal.fire("حذف شد!", "تصویر با موفقیت حذف گردید.", "success");
          }
        } catch (error) {
          Swal.fire(
            "خطا!",
            error.response?.data?.detail ||
              "حذف تصویر ناکام شد. لطفاً بعداً دوباره تلاش کنید.",
            "error"
          );
        }
      }
    });
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000); // Hide error after 5 seconds

      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [error]);
  //  pagination section
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(sliders.length / postsPerPage);
  const paginatedOrders = [...sliders] // Create a copy to avoid mutation
    .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <div className="bg-gray-200 w-full py-10 ">
      <h2 className="md:text-xl text-base text-center font-bold mb-4">
        افزودن اسلایدر
      </h2>
      <hr />
      <div className="max-w-3xl mx-auto p-2 shadow-lg bg-white rounded-md">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className=" border-t m-1  p-2 flex flex-col justify-center items-center space-y-4"
        >
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-2 w-40 object-cover border rounded"
            />
          )}
          <label htmlFor="image">انتخاب تصویر</label>
          <input
            id="imageInput"
            type="file"
            name="image"
            onChange={handleChange}
            className="border p-1.5 w-full rounded-md hover:bg-gray-200"
          />

          <button
            type="submit"
            className={` ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : " secondry-btn"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "در حال ارسال..."
              : selectedImageId
              ? "ویرایش"
              : "افزودن"}
          </button>
        </form>
      </div>
      <div className="p-5 mt-3">
        <p className="text-xl font-Ray_black font-bold text-center">
          {" "}
          عکس های موجود در سلایدر صفحه اصلی
        </p>
      </div>
      <div className="w-[400px] md:w-[700px] lg:w-[80%] mx-auto  lg:overflow-hidden">
        <table className="w-full  rounded-lg border border-gray-500 shadow-md">
          <thead>
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                شناسه
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                تصویر
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {sliders.length > 0 ? (
              paginatedOrders.map((slider) => (
                <tr
                  key={slider.id}
                  className="text-center border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                >
                  <td className=" border-gray-300 px-6 py-2 text-gray-700">
                    {slider.id}
                  </td>
                  <td className=" border-gray-300 px-6 py-2  text-gray-700">
                    {slider.images ? (
                      <img
                        src={`${BASE_URL}${slider.images}`}
                        alt={`Slider ${slider.id}`}
                        width={100}
                        className="w-14 h-10 object-cover rounded-lg border  border-gray-300 shadow-sm"
                      />
                    ) : (
                      <span>تصویری موجود نیست</span>
                    )}
                  </td>

                  <td className=" px-6 py-2 flex justify-center gap-x-5">
                    <button
                      onClick={() => handleEdit(slider)}
                      className=" text-green px-1 py-1 rounded-md transition-all"
                    >
                      <FaRegEdit size={24} />
                    </button>
                    <button
                      onClick={() => handleDelete(slider.id)}
                      className=" text-red-500 px-1 py-1 rounded-md transition-all disabled:opacity-50"
                    >
                      <IoTrashSharp size={24} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="border px-4 py-2 text-center">
                  تصویری برای نمایش موجود نیست.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Component */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default Slider;
