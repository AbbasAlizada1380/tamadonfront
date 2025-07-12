import React, { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SignUp from "../Registeration/SignUp";
import { IoTrashSharp } from "react-icons/io5";
import CryptoJS from "crypto-js";

// We will not use an external Pagination component to ensure everything is in this one file.

const BASE_URL = import.meta.env.VITE_BASE_URL;

const UserManagement = () => {
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

  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]); // This will hold ALL users from the API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    password: "",
    passwordConfirm: "",
  });
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Pagination State for client-side logic
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Define roles array
  const roles = [
    { id: 1, name: "Designer" },
    { id: 2, name: "Reception" },
    { id: 0, name: "Admin" },
    { id: 3, name: "Head of designers" },
    { id: 4, name: "Printer" },
    { id: 5, name: "Delivery Agent" },
    { id: 6, name: "Digital" },
    { id: 7, name: "Bill" },
    { id: 8, name: "Chaspak" },
    { id: 9, name: "Shop role" },
    { id: 10, name: "Laser" },
  ];

  // This useEffect fetches ALL users ONCE when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetches all users from the backend
  const fetchUsers = () => {
    setLoading(true);
    setError("");
    const token = decryptData(localStorage.getItem("auth_token"));

    if (!token) {
      setError("Authentication required. Please log in.");
      navigate("/login");
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/users/api/users/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status === 401) {
          setError("Authentication expired. Please log in again.");
          navigate("/login");
          return null;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch users from the server.");
        }
        return response.json();
      })
      .then((data) => {
        // This logic robustly handles both paginated and simple array responses
        if (data && data.results && Array.isArray(data.results)) {
          setAllUsers(data.results); // Handles { results: [...] }
        } else if (Array.isArray(data)) {
          setAllUsers(data); // Handles [...]
        } else {
          console.error("Received unexpected data format from API:", data);
          setAllUsers([]); // Default to empty array on unexpected format
        }
      })
      .catch((error) => {
        setError(error.message);
        console.error("Fetch Error:", error);
        setAllUsers([]); // Clear users on error
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const toggleFormVisibility = () => {
    setIsFormVisible((prevVisibility) => !prevVisibility);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newUser.password !== newUser.passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const method = newUser.id ? "PUT" : "POST";
    const url = newUser.id
      ? `${BASE_URL}/users/update/${newUser.id}/`
      : `${BASE_URL}/users/create/`;
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decryptData(
            localStorage.getItem("auth_token")
          )}`,
        },
        body: JSON.stringify({
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          email: newUser.email,
          phone_number: newUser.phoneNumber,
          role: newUser.role,
          password: newUser.password,
          password_confirm: newUser.passwordConfirm,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error creating/updating user");
      }
      fetchUsers(); // Re-fetch the complete user list
      setIsFormVisible(false);
      Swal.fire({
        title: "Success!",
        text: `User ${newUser.id ? "updated" : "created"} successfully.`,
        icon: "success",
        confirmButtonText: "OK",
        customClass: { popup: "w-96" },
      });
    } catch (err) {
      setError(err.message);
      Swal.fire({
        title: "خطا!",
        text: err.message,
        icon: "error",
        confirmButtonText: "تایید",
        customClass: { popup: "w-96" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عملیات قابل بازگشت نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
      customClass: { popup: "w-96" },
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        fetch(`${BASE_URL}/users/delete/${id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${decryptData(
              localStorage.getItem("auth_token")
            )}`,
          },
        })
          .then((response) => {
            if (response.ok) {
              fetchUsers(); // Re-fetch the complete user list
              Swal.fire({
                title: "حذف شد!",
                text: "کاربر با موفقیت حذف گردید.",
                icon: "success",
                confirmButtonText: "تایید",
                customClass: { popup: "w-96" },
              });
            } else {
              throw new Error("خطا در حذف کاربر");
            }
          })
          .catch((err) => {
            Swal.fire({
              title: "خطا!",
              text: err.message,
              icon: "error",
              confirmButtonText: "تایید",
              customClass: { popup: "w-96" },
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    });
  };

  const getRoleName = (roleId) => {
    const role = roles.find((role) => role.id === parseInt(roleId));
    return role ? role.name : "Unknown";
  };

  // --- CLIENT-SIDE PAGINATION LOGIC ---
  const totalPages = Math.ceil(allUsers.length / postsPerPage);
  const usersToDisplay = allUsers.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-lg text-gray-600 font-bold py-10">
          Loading...
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center text-red-500 text-lg font-bold py-10">
          {error}
        </div>
      );
    }
    if (usersToDisplay.length === 0) {
      return (
        <div className="text-center text-gray-500 font-bold py-10">
          No users found.
        </div>
      );
    }
    return (
      <div className="w-[400px] md:w-[700px] lg:w-[80%] mx-auto overflow-x-auto">
        <table className="w-full min-w-[600px] rounded-lg border border-gray-300 shadow-md">
          <thead>
            <tr className="bg-green rounded-md text-white text-center">
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نام
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                تخلص
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                ایمیل
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                نمبر تماس
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                وظیفه
              </th>
              <th className="border border-gray-300 px-6 py-2.5 text-sm font-semibold">
                اقدامات
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {usersToDisplay.map((user) => (
              <tr
                key={user.id}
                className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
              >
                <td className="border px-4 py-2">{user.first_name}</td>
                <td className="border px-4 py-2">{user.last_name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.phone_number}</td>
                <td className="border px-4 py-2">{getRoleName(user.role)}</td>
                <td className="px-6 py-2 flex justify-center gap-x-5">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-500 px-1 py-1 rounded-md transition-all"
                  >
                    <IoTrashSharp size={24} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mt py-10 bg-gray-200 w-full p-5 min-h-screen">
      <div className="flex justify-center items-center">
        <button
          onClick={toggleFormVisibility}
          className="secondry-btn flex items-center gap-x-3"
        >
          <FaUserPlus />
          {isFormVisible ? "Close Form" : "افزودن کاربر جدید"}
        </button>
      </div>
      {isFormVisible && <SignUp />}
      <div className="border mt-10">
        <h2 className="md:text-xl text-base font-Ray_black text-center font-bold mb-4">
          لیست کاربران موجود
        </h2>
        {renderContent()}
      </div>
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            « قبلی
          </button>
          <span className="font-bold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            بعدی »
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
