import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import CryptoJS from "crypto-js";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { IoTrashSharp } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Pagination from "../../../Utilities/Pagination";

const About = () => {
  const fileInputRef = useRef(null);
  const [abouts, setAbouts] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
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
  // Set up Axios default headers with token from localStorage
  useEffect(() => {
    const token = decryptData(localStorage.getItem("auth_token"));
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Token ${token}`;
    } else {
      console.warn("No token found in localStorage. Ensure you're logged in.");
    }
  }, []);
  const fetchAbouts = async () => {
    try {
      const token = decryptData(localStorage.getItem("auth_token"));
      if (!token) {
        setError("Invalid token.");
        return;
      }
      const response = await axios.get(`${BASE_URL}/common/about/`, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Token ${token}`,
        },
      });
      console.log("Fetched Abouts:", response.data);
      setAbouts(response.data);
    } catch (error) {
      console.error("Error fetching Abouts:", error);
      setError(
        error.response?.data?.message ||
          "An error occurred while loading the data."
      );
    }
  };

  // Fetch existing images
  useEffect(() => {
    fetchAbouts();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : null });

    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // Update preview when selecting a new file
      };
      reader.readAsDataURL(files[0]);
    }
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Decrypt the token and check if it exists
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) {
      console.log("No token found.");
      Swal.fire(
        "خطا",
        "شما وارد سیستم نشده‌اید. لطفاً دوباره وارد شوید.",
        "error"
      );
      setIsSubmitting(false); // Stop submitting process
      return; // Exit the function if no token is found
    }
    const form = new FormData();

    // Ensure an image is selected
    if (formData.image) {
      form.append("image", formData.image);
    } else {
      setError("لطفاً یک تصویر برای آپلود انتخاب کنید.");
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Token ${token}`,
      };

      if (selectedImageId) {
        // Update existing image
        response = await axios.put(
          `${BASE_URL}/common/about/${selectedImageId}/`,
          form,
          { headers }
        );

        if (response.status === 200) {
          Swal.fire("بروز شد!", "تصویر با موفقیت بروز شد.", "success");
          // Update the About in the state with the new image URL
          setAbouts((prevAbouts) =>
            prevAbouts.map((About) =>
              About.id === selectedImageId
                ? { ...About, images: response.data.images }
                : About
            )
          );
          setSelectedImageId(null);
          setPreview(null); // Clear preview after submitting
          if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
        } else {
          Swal.fire("خطا", "بروزرسانی تصویر ناکام ماند.", "error");
        }
      } else {
        // Create new image
        response = await axios.post(`${BASE_URL}/common/about/`, form, {
          headers,
        });

        if (response.status === 201) {
          Swal.fire("افزوده شد!", "تصویر با موفقیت اضافه شد.", "success");
          // Add the new image to the state
          setAbouts((prevAbouts) => [...prevAbouts, response.data]);
          fetchAbouts(); // Fetch abouts again to get the latest data
          setPreview(null); // Clear preview after submitting
          if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
        } else {
          Swal.fire("خطا", "افزودن تصویر ناکام ماند.", "error");
        }
      }
    } catch (error) {
      console.error("Error submitting image:", error);
      if (error.response) {
        setError(
          `An error occurred: ${
            error.response.data.detail || "Failed to submit the image."
          }`
        );
      } else {
        setError("An error occurred while submitting the image.");
      }
    } finally {
      setIsSubmitting(false);
      setFormData({ id: "", image: null });
      fetchAbouts();
    }
  };

  // Handle editing an image
  const handleEdit = (image) => {
    setFormData({ id: image.id, image: null });
    setSelectedImageId(image.id);
    setPreview(`${image.image}`); // Set preview from existing image
  };

  // Handle deleting an image
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
          const token = decryptData(localStorage.getItem("auth_token"));
          const response = await axios.delete(
            `${BASE_URL}/common/about/${id}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          if (response.status === 204) {
            Swal.fire("حذف شد!", "تصویر با موفقیت حذف شد.", "success");
            setAbouts(abouts.filter((About) => About.id !== id));
          } else {
            Swal.fire("خطا", "حذف تصویر ناکام ماند.", "error");
          }
        } catch (error) {
          Swal.fire(
            "خطا",
            `مشکلی پیش آمد: ${
              error.response
                ? error.response.data.detail
                : "حذف تصویر ناکام شد."
            }`,
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
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  //  pagination section
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15;

  // Calculate pagination
  const totalPages = Math.ceil(abouts.length / postsPerPage);
  const paginatedOrders = [...abouts] // Create a copy to avoid mutation
    .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
  return (
    <div className="py-10 bg-gray-200 w-full ">
      <div className="max-w-3xl mx-auto p-2 shadow-lg bg-white rounded-md">
        <h2 className="md:text-xl text-base text-center font-bold mb-4">
          افزودن درباره
        </h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className=" border-t m-1  p-2 flex flex-col justify-center items-center space-y-4"
        >
          {preview && (
            <div className="preview-container">
              <img
                src={preview}
                alt="Preview"
                className="object-cover w-48 h-48"
              />
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            name="image"
            placeholder="آدرس تصویر"
            onChange={handleChange}
            className="border p-1.5 w-full"
          />

          <button
            type="submit"
            className={` ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "secondry-btn"
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
          عکس های موجود در گالری صفحه درباره
        </p>
      </div>
      <div className="w-[400px] md:w-[700px] lg:w-[80%] mx-auto  lg:overflow-hidden">
        <table className="w-full  rounded-lg border border-gray-300 overflow-x-scroll shadow-md">
          <thead>
            <tr className="bg-green text-gray-100 text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                شناسه
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                تصویر
              </th>
              <th className="border border-gray-300 px-6py-2.5 text-sm font-semibold">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {abouts.length > 0 ? (
              paginatedOrders.map((About) => (
                <tr
                  key={About.id}
                  className="text-center border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                >
                  <td className="border-gray-300 px-6 py-2 text-gray-700">
                    {About.id}
                  </td>
                  <td className="border-gray-300 px-6 py-2 text-gray-700">
                    {About.image ? (
                      <img
                        src={`${About.image}`} // Ensure the path is correct for displaying images
                        alt={`About ${About.id}`}
                        width={100}
                        className="w-14 h-10 object-cover rounded-lg border  border-gray-300 shadow-sm"
                      />
                    ) : (
                      <span>No image available</span>
                    )}
                  </td>

                  <td className=" px-6 py-2 flex justify-center gap-x-5">
                    <button
                      onClick={() => handleEdit(About)}
                      className=" text-green px-1 py-1 rounded-md transition-all"
                    >
                      <FaRegEdit size={24} />
                    </button>
                    <button
                      onClick={() => handleDelete(About.id)}
                      className=" text-red-500 px-1 py-1 rounded-md transition-all disabled:opacity-50"
                    >
                      <IoTrashSharp size={24} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border px-4 py-2 text-center">
                  تصویر جهت نمایش ثبت نشده است.
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

export default About;
