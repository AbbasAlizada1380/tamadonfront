import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GrGallery } from "react-icons/gr";
import { MdPermDeviceInformation } from "react-icons/md";
import { RxArrowLeft, RxArrowRight } from "react-icons/rx";
import { PiUsersFour } from "react-icons/pi";
import Tamadon from "../../../public/tamadon.png";
import { MdHome } from "react-icons/md";
import {
  FaSun,
  FaMoon,
  FaPlusCircle,
  FaBars,
  FaUsers,
  FaClipboardList,
  FaChartBar,
  FaSignOutAlt,
  FaChevronDown,
  FaServicestack,
  FaBlog,
  FaSlidersH,
  FaPhotoVideo,
  FaThList,
  FaTags,
  FaListOl,
  FaCommentAlt,
  FaBuromobelexperte,
} from "react-icons/fa";
import jwtDecode from "jwt-decode";
import { MdDashboard, MdMenu } from "react-icons/md";
import ReportDashboard from "./designer/Ddashboard";
import AddOrder from "./designer/AddOrder";
import TokenOrders from "./Reception/TokenOrders";
import Services from "./Admin/Services";
import WebBlog from "./Admin/WebBlog";
import Slider from "./Admin/Slider";
import OrderList from "./Reception/ordersList";
import Customer from "./Admin/customers.jsx";
import UserManagement from "./Admin/UserManagement";
import Category from "./designer/categoryManager";
import Attribute from "./designer/attribute";
import ValueForAttributes from "./designer/valueForAttribute.jsx";
import UpdateProfile from "./updateProfile";
import ReceivedList from "./Printer/ReceivedList.jsx";
import ProcessingList from "./Printer/ProccessingList.jsx";
import DoneList from "./Printer/finishedList.jsx";
import axios, { Axios } from "axios";
import CryptoJS from "crypto-js";
import MessagingComponent from "./Messagin.jsx";
import { CgProfile } from "react-icons/cg";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { motion } from "framer-motion";
import About from "./Admin/About.jsx";
import Gallery from "./Admin/gallery.jsx";
import { TfiGallery } from "react-icons/tfi";
import ChartGraph from "./ChartGraph.jsx";
import DesignerChart from "./designer/designersChart.jsx";
import { BiArrowBack, BiArrowFromRight, BiArrowToRight } from "react-icons/bi";
import WellcomePage from "./wellcomePage.jsx";
import Deliver from "./Reception/deliverOrder.jsx";
import PastOrders from "./designer/pastOrders.jsx";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import ModeToggle from "./ModeToggling.jsx";
import Token from "./TokenOrdeing/Token.jsx";
import OrderListSuperDesigner from "./designer/orderlistSuperDesigner.jsx";
import BillTotal from "./Reception/BillTotal.jsx";
import PTokenOrders from "./Reception/PTokenOrders.jsx";
const Dashboard = () => {
  // Modal visibility state
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

  const [role, setRole] = useState(decryptData(localStorage.getItem("role")));
  const [darkMode, setDarkMode] = useState(false);
  const [activeComponent, setActiveComponent] = useState("defaultPage");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [userImage, setUserImage] = useState(null);
  const [isSideOpen, setIsSideOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isWebsiteManagementOpen, setIsWebsiteManagementOpen] = useState(false);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] =
    useState(false);
  const [user, setUser] = useState({});
  const [unreadMsg, setUnreadMsg] = useState([]);
  const [userId, setUserId] = useState(decryptData(localStorage.getItem("id")));
  const navigate = useNavigate();
  function checkSessionExpiration() {
    const loginTimestamp = localStorage.getItem("login_timestamp");

    if (loginTimestamp) {
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - parseInt(loginTimestamp, 10);

      // 12 hours = 43200000 milliseconds
      if (elapsedTime >= 43200000) {
        handleLogout();
        console.log("loged out");
      }
    }
  }

  function handleLogout() {
    localStorage.clear(); // Clears all stored items
    window.location.href = "/login"; // Redirect to login page
  }

  // Call this function in useEffect to check session expiration
  useEffect(() => {
    checkSessionExpiration();
  }, [
    loading,
    activeComponent,
    isProfilePopupOpen,
    isMessagingOpen,
    isWebsiteManagementOpen,
  ]);

  // Fetch user profile information
  const fetchUserProfile = async () => {
    const token = decryptData(localStorage.getItem("auth_token"));

    if (!token) {
      console.error("Token is expired or not available.");
      handleLogout();
      return; // Early exit if the token is expired or invalid
    } else {
      const decoded = jwtDecode(token);
      setUser(decoded);
    }
    const email = decryptData(localStorage.getItem("email"));
    try {
      const response = await axios.get(`${BASE_URL}/users/profile/${email}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const data = await response.data;
        setUserImage(data.profile_pic);
      } else {
        console.log(response);
        console.error("Failed to fetch user profile. Status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUserProfile();
  }, [isProfilePopupOpen]);

  const fetchUnreadMsg = async () => {
    try {
      const authToken = decryptData(localStorage.getItem("auth_token"));
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(
        `${BASE_URL}/users/unread/?receiver_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setUnreadMsg(response.data.unread_messages);
      return response.data.unread_messages;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setUnreadMsg([]);
      }
      console.error("Failed to fetch unread users:", error);
      return [];
    }
  };

  // useEffect(() => {
  //   let previousCount = 0;

  //   const interval = setInterval(async () => {
  //     const messages = await fetchUnreadMsg();
  //     const currentCount = Array.isArray(messages) ? messages.length : 0;

  //     if (currentCount > previousCount) {
  //       const audio = new Audio("/notification.mp3");
  //       audio.play();
  //     }

  //     previousCount = currentCount;
  //   }, 3000);

  //   return () => clearInterval(interval);
  // }, [userId]); // Ensuring it runs when userId changes

  // Define user role permissions
  const access = {
    1: [
      "defaultPage",
      "Add Order",
      "defaultPage",
      "pastOrders",
      "designerChart",
      "Logout",
    ],
    3: [
      "defaultPage",
      "category management",
      "pastOrders",
      "Add Order",
      "designerChart",
      // "token",
      "Logout",
      "ReceivedList",
      "OrderListSuperDesigner",
    ],
    0: ["defaultPage", "User Management", "data", "designerChart", "Logout"],
    2: ["defaultPage", "OrderList", "TokenOrders", "PTokenOrders", "Logout"],
    4: ["defaultPage", "ReceivedList", "Logout"],
    5: ["defaultPage", "deliver", "ReceivedList", "Logout"],
    6: ["defaultPage", "ReceivedList", "Logout"],
    7: ["defaultPage", "ReceivedList", "Logout"],
    8: ["defaultPage", "ReceivedList", "Logout"],
    9: ["defaultPage", "ReceivedList", "Logout"],
    10: ["defaultPage", "ReceivedList", "Logout"],
  };
  const websiteManagementItems = [
    {
      component: "Services",
      label: "محصولات",
      icon: <FaServicestack />,
      element: <Services />,
    },
    {
      component: "WebBlog",
      label: "وبلاگ",
      icon: <FaBlog />,
      element: <WebBlog />,
    },
    {
      component: "Slider",
      label: "اسلایدر",
      icon: <FaSlidersH />,
      element: <Slider />,
    },
    {
      component: "About",
      label: "درباره",
      icon: <MdPermDeviceInformation />,
      element: <About />,
    },
    {
      component: "Gallery",
      label: "گالری",
      icon: <GrGallery />,
      element: <Gallery />,
    },
    {
      component: "Customer",
      label: "مشتریان",
      icon: <PiUsersFour />,
      element: <Customer />,
    },
  ];
  const categoryManagementItems = [
    {
      component: "category",
      label: "کتگوری",
      icon: <FaThList />, // Represents categorized items
      element: <Category />,
    },
    {
      component: "attribute",
      label: "مشخصه",
      icon: <FaTags />,
      element: <Attribute />,
    },
    {
      component: "valueForAttributes",
      label: "مقدار مشخصه‌ها",
      icon: <FaListOl />,
      element: <ValueForAttributes />,
    },
  ];

  const menuItems = {
    defaultPage: {
      component: "defaultPage",
      icon: <MdHome />,
      label: " صفحه اصلی",
    },
    OrderList: {
      component: "OrderList",
      icon: <FaClipboardList />,
      label: "  لیست سفارشات جدید",
    },
    TokenOrders: {
      component: "TokenOrders",
      icon: <FaClipboardList />,
      label: "سفارشات گرفته شده",
    },
    PTokenOrders: {
      component: "PTokenOrders",
      icon: <FaClipboardList />,
      label: "سفارشات  قبلی",
    },

    "Add Order": {
      component: "AddOrder",
      icon: <FaPlusCircle />,
      label: "سفارشات",
    },
    pastOrders: {
      component: "pastOrders",
      icon: <FaPlusCircle />,
      label: "سفارشات قبلی",
    },

    token: {
      component: "token",
      icon: <FaPlusCircle />,
      label: "توکن",
    },
    deliver: {
      component: "deliver",
      icon: <FaClipboardList />,
      label: "تحویل سفارشات",
    },

    OrderListSuperDesigner: {
      component: "OrderListSuperDesigner",
      icon: <FaClipboardList />,
      label: " سفارشات مجموعی",
    },
    designerChart: {
      component: "designerChart",
      icon: <FaChartBar />,
      label: "گزارش دیزاینرها",
    },
    ReceivedList: {
      component: "ReceivedList",
      icon: <FaClipboardList />,
      label: " سفارشات دریافتی",
    },
    ProcessingList: {
      component: "ProcessingList",
      icon: <FaClipboardList />,
      label: " سفارشات تحت کار",
    },
    DoneList: {
      component: "DoneList",
      icon: <FaClipboardList />,
      label: " سفارشات  کامل شده",
    },
    Dashboard: {
      component: "DashboardHome",
      icon: <MdDashboard />,
      label: "داشبورد",
    },
    "User Management": {
      component: "UserManagement",
      icon: <FaUsers />,
      label: "مدیریت کاربران",
    },
    data: {
      component: "data",
      icon: <FaChartBar />,
      label: " معلومات",
    },
    Reports: { component: "Reports", icon: <FaChartBar />, label: "گزارشات" },
    Logout: { icon: <FaSignOutAlt />, label: "خروج" },

    Services: {
      component: "Services",
      icon: <FaServicestack />,
      label: "خدمات",
    },
    WebBlog: {
      component: "WebBlog",
      icon: <FaBlog />,
      label: "وبلاگ",
    },
    Slider: {
      component: "Slider",
      icon: <FaSlidersH />,
      label: "اسلایدر",
    },
    About: {
      component: "About",
      icon: <About />,
      label: "درباره",
    },
    Gallery: {
      component: "Gallery",
      icon: <TfiGallery />,
      label: "گالری",
    },
  };

  // Filter menu items based on user role
  const filteredMenuItems = Object.keys(menuItems).filter((item) =>
    (access[role] || []).includes(item)
  );

  // Function to toggle the sidebar
  const handleSidebarToggle = () => {
    setIsSidebarExpanded((prevState) => !prevState);
  };
  const handleWebsiteManagementToggle = () => {
    setIsWebsiteManagementOpen(!isWebsiteManagementOpen);
  };
  const handleCategoryManagementToggle = () => {
    setIsCategoryManagementOpen(!isCategoryManagementOpen);
  };
  // Render the appropriate component based on the active menu
  const renderComponent = () => {
    if (activeComponent === "category") return <Category />;
    if (activeComponent === "Customer") return <Customer />;
    if (activeComponent === "Logout") return () => handleLogout();
    if (activeComponent === "valueForAttributes") return <ValueForAttributes />;
    if (activeComponent === "attribute") return <Attribute />;
    if (activeComponent === "Services") return <Services />;
    if (activeComponent === "WebBlog") return <WebBlog />;
    if (activeComponent === "About") return <About />;
    if (activeComponent === "Gallery") return <Gallery />;
    if (activeComponent === "Slider") return <Slider />;
    switch (activeComponent) {
      case "DoneList":
        return <DoneList />;
      case "deliver":
        return <Deliver />;
      case "OrderList":
        return <OrderList />;
      case "OrderListSuperDesigner":
        return <OrderListSuperDesigner />;
      case "pastOrders":
        return <PastOrders />;
      case "ProcessingList":
        return <ProcessingList />;
      case "TokenOrders":
        return <TokenOrders />;
      case "PTokenOrders":
        return <PTokenOrders />;
      case "data":
        return <ChartGraph />;
      case "Logout":
        return () => handleLogout();
      case "ReceivedList":
        return <ReceivedList />;
      case "DashboardHome":
        return <ReportDashboard />;
      case "AddOrder":
        return <AddOrder />;
      case "UserManagement":
        return <UserManagement />;
      case "designerChart":
        return <DesignerChart />;
      case "Reports":
        return <Reports />;
      case "token":
        return <Token />;
      default:
        return <WellcomePage />;
    }
  };

  // Show loading message while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader mr-3"></div>
        <span className="text-xl font-semibold">در حال بارگذاری...</span>
  
        <style jsx>{`
          .loader {
            width: 40px;
            height: 40px;
            border: 4px solid #16a34a; /* Tailwind green-600 */
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
  
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }
  

  return (
    <div className={`bg-gray-100 text-gray-800 h-screen w-full flex flex-col`}>
      {/* Navbar */}
      <nav className="flex fixed right-0 left-0 bg-green top-0 justify-between lg:justify-between gap-x-5 items-center p-4  z-10">
        <div>
          <button
            className="lg:hidden"
            onClick={() => setIsSideOpen(!isSideOpen)}
          >
            <MdMenu size={28} />
          </button>
          <div className="lg:flex items-center hidden  gap-x-5">
            <Link to="/" className="">
              <img
                src={Tamadon}
                alt="Logo"
                className={` ${
                  isSidebarExpanded ? "h-10 w-10" : "h-10 w-10"
                } object-contain`}
              />
            </Link>

            <div className={` ${isSidebarExpanded ? "block" : "hidden"} `}>
              <p className="text-white font-bold text-2xl ">چاپخانه تمدن</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-x-4">
          <p className=" font-serif text-2xl text-white font-bold">
            {decryptData(localStorage.getItem("username"))}
          </p>
          {/* <ModeToggle /> */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
          >
            {userImage !== 0 ? (
              <img
                src={userImage || <CgProfile />}
                alt="User"
                className="w-10 h-10 rounded-full border-2"
              />
            ) : (
              <CgProfile size={28} />
            )}
          </div>
        </div>
      </nav>
      {/* side bar section */}

      {/* Main Content */}
      <div className="flex flex-1 pt-[74px] overflow-hidden ">
        <aside
          className={`bg-white text-gray-900 py-3 ${
            isSideOpen ? "w-[60%] md:w-[35%]  z-20" : "hidden"
          } lg:flex flex-col fixed w-[250px]  px-5 md:relative 
    top-0 h-screen right-0 bottom-0 
    transition-all ease-in-out duration-200`}
        >
          <div className={`w-full space-y-1  overflow-hidden `}>
            <button
              onClick={() => {
                setIsSideOpen(!isSideOpen);
              }}
              className="lg:hidden  text-2xl focus:outline-none"
            >
              <FaBars />
            </button>
            {role[0] == 0 && (
              <li className="flex flex-col space-y-1 ">
                <div
                  className={`flex items-center justify-between font-bold pr-2 py-2  hover:bg-green hover:text-white rounded cursor-pointer`}
                  onClick={() => {
                    setIsWebsiteManagementOpen((prev) => !prev);
                  }}
                >
                  <div className="flex items-center font-bold gap-x-4">
                    <span
                      className={`
                  ${isSidebarExpanded ? "text-xl" : " text-2xl"}
                  `}
                    >
                      <FaUsers />
                    </span>

                    <span
                      className={`  ml-5 text-md font-bold flex items-center  ${
                        isSidebarExpanded ? "block" : " hidden"
                      } `}
                    >
                      مدیریت وبسایت
                    </span>
                  </div>

                  <span
                    className={`text-sm flex pl-3 ${
                      isSidebarExpanded ? "block" : " hidden"
                    } `}
                  >
                    <FaChevronDown
                      className={`transition-transform duration-300 ${
                        isWebsiteManagementOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </div>
                {isWebsiteManagementOpen &&
                  websiteManagementItems.map((item) => (
                    <div
                      key={item.component}
                      className={`flex items-center gap-x-3 space-y-1 py-2 font-bold  px-5  hover:bg-green hover:text-white rounded cursor-pointer ${
                        activeComponent === item.component
                          ? "bg-green text-white"
                          : ""
                      }`}
                      onClick={() => {
                        setActiveComponent(item.component);
                        setIsSideOpen(false);
                      }}
                    >
                      <span className="text-xl">{item.icon}</span>

                      {isSidebarExpanded && (
                        <span className="ml-4 text-md ">{item.label}</span>
                      )}
                    </div>
                  ))}
              </li>
            )}
            {role[0] == 3 && (
              <li className="flex flex-col space-y-1">
                <div
                  className="flex p-2 items-center gap-x-3 hover:text-white hover:bg-green rounded cursor-pointer"
                  onClick={() => {
                    setIsCategoryManagementOpen((prev) => !prev);
                  }}
                >
                  <span className="text-lg ">
                    <FaChevronDown
                      className={`transition-transform duration-300 ${
                        isCategoryManagementOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                  {isSidebarExpanded && (
                    <span className=" text-md flex font-bold  items-center">
                      مدیریت کتگوری
                    </span>
                  )}
                </div>
                {isCategoryManagementOpen &&
                  categoryManagementItems.map((item) => (
                    <div
                      key={item.component}
                      className={`flex gap-x-3 items-center p-2  hover:bg-green hover:text-white rounded cursor-pointer ${
                        activeComponent === item.component
                          ? "bg-green text-white"
                          : ""
                      }`}
                      onClick={() => {
                        setActiveComponent(item.component);
                        setIsSideOpen(false);
                      }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {isSidebarExpanded && (
                        <span className="text-md  font-bold">{item.label}</span>
                      )}
                    </div>
                  ))}
              </li>
            )}
            <ul className="space-y-1  ">
              {filteredMenuItems.map((item) => (
                <li
                  key={item}
                  className={` flex items-center font-bold justify-start px-2  gap-x-4 py-2  hover:bg-green hover:text-white rounded cursor-pointer ${
                    activeComponent === menuItems[item].component
                      ? "bg-green text-white"
                      : ""
                  }`}
                  onClick={() => {
                    setIsSideOpen(false);
                    if (item === "Logout") {
                      handleLogout();
                      return null;
                    } else {
                      setActiveComponent(menuItems[item].component);
                    }
                  }}
                >
                  <span
                    className={`
                  ${isSidebarExpanded ? "text-xl" : " text-2xl"}
                  `}
                  >
                    {menuItems[item].icon}
                  </span>
                  {isSidebarExpanded && (
                    <span className=" text-md ">{menuItems[item].label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-6 lg:p-0 bg-gray-200">
          {renderComponent()}
        </main>
      </div>

      <div
        className="fixed bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-all duration-300 z-50"
        onClick={() => setIsMessagingOpen(true)}
      >
        <IoChatbubbleEllipses className="text-3xl" />
        <span className="hidden md:flex items-center gap-2">
          پیام‌رسانی
          {unreadMsg.length > 0 && (
            <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {unreadMsg.length}
            </span>
          )}
        </span>
      </div>

      {/* Conditionally render the UpdateProfile modal */}
      {isProfilePopupOpen && (
        <UpdateProfile
          setIsProfilePopupOpen={setIsProfilePopupOpen}
          userImage={userImage}
        />
      )}
      {isMessagingOpen && (
        <MessagingComponent setIsMessagingOpen={setIsMessagingOpen} />
      )}
    </div>
  );
};

export default Dashboard;
