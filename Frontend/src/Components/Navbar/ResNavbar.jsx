import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";

const ResNavbar = ({ open, navItems, setOpen }) => {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("/");

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed top-0 right-0 lg:hidden h-screen w-[300px] md:w-[400px] z-40"
          role="dialog"
          aria-hidden={!open}
        >
          <div className="text-xl text-white min-h-[100vh] bg-green dark:bg-primary font-semibold uppercase">
            {/* Logo and Close Button */}
            <div className="flex justify-between bg-white px-5 py-2 items-center mb-4">
              <img src='/Tamadon.png' alt="Tamadon Logo" className="h-[60px] w-auto" />
              <button
                onClick={() => setOpen(false)}
                className="flex items-center h-10 font-bold bg-red-600 rounded-full py-1 px-2 justify-center"
                aria-label="Close Navbar"
              >
                <FaXmark className="text-2xl text-gray-100 hover:text-gray-400 transition-transform duration-300 hover:rotate-180" />
              </button>
            </div>

            {/* Navigation Items */}
            <div>
              <ul className="flex flex-col items-center justify-center px-6 text-white gap-1">
                {navItems.map((nav, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setActiveItem(nav.path);
                      setOpen(false); // Close navbar after selecting an item
                    }}
                    className={`hover:bg-gray-100 dark:hover:text-primary text-center w-full py-2 rounded-md font-bold hover:text-slate-900 ${
                      activeItem === nav.path ? "bg-gray-100 text-green" : ""
                    }`}
                  >
                    <a href={nav.path}>{nav.title}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute bottom-0 right-0 flex items-center justify-center left-0 h-14 bg-white">
              <div className="flex items-center justify-center gap-x-5 relative  z-10">
                {/* Social Media Icons */}
                {[
                  {
                    name: "فیسبوک ما",
                    url: "https://www.facebook.com/",
                    icon: "/Facebook-03-01-01.png",
                  },
                  {
                    name: "واتساپ ما",
                    url: "https://wa.me/93772029545",
                    icon: "/whatsapp-03-01-01.png",
                  },
                  {
                    name: "تلگرام ما",
                    url: "https://t.me/",
                    icon: "/Telegram-01-01-01.png",
                  },
                ].map(({ name, url, icon }, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center text-white group relative"
                  >
                    <a
                      href={url}
                      className="dark:bg-primary shadow-lg md:h-20 md:w-20 flex items-center justify-center rounded-full transform group-hover:scale-110 transition-transform duration-300 ease-in-out"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={icon}
                        alt={name}
                        className="h-10 w-10"
                      />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResNavbar;
