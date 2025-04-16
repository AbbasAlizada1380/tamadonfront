import React from "react";

import { FaInstagram, FaLinkedin, FaTwitter, FaFacebook } from "react-icons/fa";
import { IoMdArrowDropleft } from "react-icons/io";
import { Link } from "react-router-dom";
import HeadFooter from "./HeadFooter";

function Footer() {
  const navItems = [
    { id: 1, title: "صفحه اصلی", path: "/" },
    { id: 2, title: "محصولات", path: "/service" },
    { id: 3, title: "وبلاگ", path: "/blog" },
    { id: 4, title: "درباره ما", path: "/about" },
    { id: 5, title: "تماس با ما", path: "/contactus" },
  ];

  return (
    <footer
      id="about"
      className="bg-[#00513a] dark:bg-tertiary text-gray-200 pb-5"
    >
      <HeadFooter />
      <div className="container mx-auto px-4">
        {/* Social Media Links */}
        <div className="relative w-full mt-12">
          <hr className="text-slate-900 dark:text-gray-100 border-2" />
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-5 flex gap-x-6 bg-white dark:bg-tertiary px-4 py-2 rounded-full text-gray-400 border-gray-100 border-l-2 border-r-2">
            {[
              {
                url: "https://www.facebook.com",
                icon: "/Facebook-03-01-01.png",
                label: "facebook",
              },
              {
                url: "https://wa.me/93728215482",
                icon: "/whatsapp-03-01-01.png",
                label: "whatsapp",
              },
              {
                url: "https://t.me/+93772029545",
                icon: "/Telegram-01-01-01.png",
                label: "Telegram",
              },
            ].map(({ icon, url, label }, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="transition duration-300 hover:scale-125 hover:text-slate-900 text-2xl"
              >
                <img src={icon} alt="" className="h-7 w-7" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid container mx-auto grid-cols-1  lg:grid-cols-3 gap-5 lg:gap-10 mt-14">
          <div className="flex bg-white rounded-lg md:bg-transparent items-center col-span-1  justify-center gap-5 md:gap-5 lg:gap-3">
            <div className="bg-white p-5 rounded-md ">
              <img
                src="Tamadon.png"
                alt="logo"
                className="lg:h-[150px] h-[70px] md:h-[100px] w-auto"
              />
            </div>
            <div className="text-center md:text-left lg:space-y-2">
              <h1 className="md:text-5xl text-2xl font-Ray font-bold text-black md:text-[#fff]">
                چاپخانه تمدن
              </h1>
              <h2 className="lg:text-xl md:text-2xl text-md font-semibold text-black md:text-[#fff] tracking-wide">
                Tamadon Printing Press
              </h2>
            </div>
          </div>

          <div className="flex col-span-1 justify-center md:justify-evenly gap-x-32">
            {/* Nav Links */}
            <div className="md:text-right flex flex-col ">
              <h3 className="md:text-xl text-md font-Ray_Black font-bold mb-4">
                لینک های سریع
              </h3>
              <ul className="grid grid-cols-1  gap-y-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      className="hover:text-yellow-400 flex items-center gap-x-1 transition duration-300"
                    >
                      <IoMdArrowDropleft />
                      <p>{item.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center  flex col-span-1 flex-col items-center lg:items-start space-y-1 text-lg">
            <h3 className="md:text-xl text-md font-Ray_black font-bold mb-2 md:mb-4">
              تماس با ما
            </h3>
            <p className="flex items-center  text-sm md:text-base gap-x-3">
              <span className="font-bold"> نشانی ما :</span> کوتة سنگی، سرک
              دهبوری، مارکیت اتفاق{" "}
            </p>
            <p className="flex items-center text-sm md:text-base  gap-x-3">
              <span className="font-bold"> تلفن :</span> 93-772-029-545+
            </p>
            <p className="flex items-center text-sm md:text-base gap-x-3">
              <span className="font-bold"> ایمیل:</span> tamadon.af@gmail.com
            </p>
          </div>
        </div>

        <div className="mt-8 text-center  ">
          <hr className="max-w-[60%] mx-auto border-gray-600" />
          <p className="pt-4 text-gray-400">
            &copy; {new Date().getFullYear()} TET. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
