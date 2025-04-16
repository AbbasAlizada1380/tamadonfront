import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Home from "../Pages/Home";
import Footer from "../Components/Footer/Footer";
import { IoMdArrowRoundUp } from "react-icons/io";
import SideHeader from "../Components/Navbar/SideHeader";
const navItems = [
  {
    id: 1,
    title: "صفحه اصلی",
    path: "/",
    
  },
  {
    id: 2,
    title: "محصولات",
    path: "/service",
   
  },
  {
    id: 3,
    title: "اخبار",
    path: "/blog",
   
  },
  {
    id: 5,
    title: "درباره ما",
    path: "/about",
    subCategories: null,
  },
  {
    id: 4,
    title: "تماس با ما",
    path: "/contactus",
    subCategories: null,
  },
  
];

const Layout = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Function to handle scroll event
  const handleScroll = () => {
    if (window.scrollY > 200) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  // Add scroll event listener when the component is mounted
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to scroll to the top of the page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  return (
    <div className="relative bg-[#ffffff] dark:bg-[#100d25] transition-colors">
      <div>
        <SideHeader navItems={navItems} />
        <Navbar  navItems={navItems}/>
      </div>
      <div>
        <Outlet />
      </div>
      <div>
        <Footer />
      </div>
      {isScrolled && (
        <div className="fixed bottom-10 left-10">
          <button
            onClick={scrollToTop}
            className="bg-[#ED8D1D] text-black dark:bg-gray-100 dark:text-slate-900 p-2 rounded-full shadow-lg hover:text-white transition duration-300"
          >
            <IoMdArrowRoundUp size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
