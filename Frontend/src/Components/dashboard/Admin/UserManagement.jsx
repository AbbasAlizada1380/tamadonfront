import React, { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SignUp from "../Registeration/SignUp";
import { IoTrashSharp } from "react-icons/io5";
import CryptoJS from "crypto-js";
import Pagination from "../../../Utilities/Pagination";
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  // Fetch users from the backend
  const fetchUsers = () => {
    setLoading(true);
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
          setLoading(false);
          return;
        }
        return response.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
        setError("");
      })
      .catch((error) => {
        setError("Error fetching users.");
        setLoading(false);
      });
  };

  // Toggle the user form visibility
  const toggleFormVisibility = () => {
    setIsFormVisible((prevVisibility) => !prevVisibility);
  };

  // Handle user form submission (Create or Update)
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
        console.error("Error response:", data);
        throw new Error(data.detail || "Error creating/updating user");
      }

      const data = await response.json();
      console.log("User successfully created/updated", data);

      // Fetch updated list of users
      fetchUsers();
      setIsFormVisible(false);

      // Show success alert with smaller modal
      Swal.fire({
        title: "Success!",
        text: `User ${newUser.id ? "updated" : "created"} successfully.`,
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "w-96", // Adjust the modal width to your desired size
        },
      });
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);

      // Show error alert with smaller modal
      Swal.fire({
        title: "خطا!",
        text: err.message,
        icon: "error",
        confirmButtonText: "تایید",
        customClass: {
          popup: "w-96", // تنظیم عرض مودال در صورت نیاز
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDelete = async (id) => {
    // نمایش پیغام تأیید حذف
    Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این عملیات قابل بازگشت نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف شود!",
      cancelButtonText: "لغو",
      customClass: {
        popup: "w-96", // تغییر عرض مودال در صورت نیاز
      },
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
              setUsers(users.filter((user) => user.id !== id));
              Swal.fire({
                title: "حذف شد!",
                text: "کاربر با موفقیت حذف گردید.",
                icon: "success",
                confirmButtonText: "تایید",
                customClass: {
                  popup: "w-96", // تغییر عرض مودال در صورت نیاز
                },
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
              customClass: {
                popup: "w-96", // تغییر عرض مودال در صورت نیاز
              },
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    });
  };

  // Helper function to get the role name from the ID
  const getRoleName = (roleId) => {
    const role = roles.find((role) => role.id === parseInt(roleId));
    return role ? role.name : "Unknown";
  };
  //  pagination section
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(users.length / postsPerPage);
  const paginatedOrders = [...users] // Create a copy to avoid mutation
    .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
  return (
    <div className="mt py-10 bg-gray-200 w-full p-5  min-h-screen ">
      <div className="flex justify-center items-center ">
        <button
          onClick={toggleFormVisibility}
          className="secondry-btn flex items-center gap-x-3"
        >
          <FaUserPlus className="" />
          {newUser.id || "افزودن کاربر جدید"}
        </button>
      </div>

      {/* Conditionally Render the Form */}
      {isFormVisible && <SignUp />}

      {/* Users List */}
      <div className="border mt-10">
        <h2 className="md:text-xl text-base font-Ray_black text-center font-bold mb-4">
          {" "}
          لیست کاربران موجود
        </h2>

        {loading ? (
          <div className="text-center text-lg text-gray-600 font-bold">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-lg font-bold">
            {error}
          </div>
        ) : (
          <div className="w-[400px] md:w-[700px] lg:w-[80%] mx-auto  lg:overflow-hidden">
            <table className="w-full  rounded-lg border border-gray-300 overflow-x-scroll shadow-md">
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
                {paginatedOrders.map((user) => (
                  <tr
                    key={user.id}
                    className="text-center font-bold border-b border-gray-200 bg-white hover:bg-gray-200 transition-all"
                  >
                    <td className="border px-4 py-2">{user.first_name}</td>
                    <td className="border px-4 py-2">{user.last_name}</td>
                    <td className="border px-4 py-2">{user.email}</td>
                    <td className="border px-4 py-2">{user.phone_number}</td>
                    <td className="border px-4 py-2">
                      {getRoleName(user.role)}
                    </td>

                    <td className=" px-6 py-2 flex justify-center gap-x-5">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className=" text-red-500 px-1 py-1 rounded-md transition-all disabled:opacity-50"
                      >
                        <IoTrashSharp size={24} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

export default UserManagement;
