import React, { useState, useEffect } from "react";
import { FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SignUp from "../Registeration/SignUp";
import { IoTrashSharp } from "react-icons/io5";
import CryptoJS from "crypto-js";
import Pagination from "../../../Utilities/Pagination"; // This is YOUR Pagination component
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

  // --- THIS FUNCTION IS THE ONLY PART THAT HAS BEEN MODIFIED ---
  const fetchUsers = () => {
    setLoading(true);
    const token = decryptData(localStorage.getItem("auth_token"));

    if (!token) {
      setError("Authentication required. Please log in.");
      navigate("/login");
      setLoading(false);
      return;
    }

    const fetchAllUsers = async () => {
      let allUsers = [];
      // Start with the first page
      let nextUrl = `${BASE_URL}/users/api/users/`; 

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          throw new Error("Authentication expired. Please log in again.");
        }
        if (!response.ok) {
          throw new Error("Failed to fetch users.");
        }

        const data = await response.json();
        // Add the users from the current page to our list
        allUsers = allUsers.concat(data.results); 
        // Get the URL for the next page, or null if it's the last page
        nextUrl = data.next; 
      }
      return allUsers;
    };

    fetchAllUsers()
      .then((allUsersData) => {
        // Now we have the complete list, so we can set the state
        setUsers(allUsersData);
        setError("");
      })
      .catch((error) => {
        setError(error.message);
        if (error.message.includes("Authentication expired")) {
          navigate("/login");
        }
      })
      .finally(() => {
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
        throw new Error(data.detail || "Error creating/updating user");
      }

      await response.json();
      
      // Re-fetch all users to get the updated list
      fetchUsers();
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

  // Handle user deletion
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
              // This works because we are updating the full list in state
              setUsers(users.filter((user) => user.id !== id));
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

  // Helper function to get the role name from the ID
  const getRoleName = (roleId) => {
    const role = roles.find((role) => role.id === parseInt(roleId));
    return role ? role.name : "Unknown";
  };
  
  // Your original pagination logic - this now works correctly
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const paginatedOrders = users.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

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

      {isFormVisible && <SignUp />}

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

      <Pagination
        currentPage={currentPage}
        totalOrders={users.length} 
        pageSize={postsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default UserManagement;