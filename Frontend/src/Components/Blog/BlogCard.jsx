import React from "react";
import { FaUser } from "react-icons/fa";
import { RxArrowLeft, RxArrowRight } from "react-icons/rx";
import jalaali from "jalaali-js";

const BlogCard = ({ item, onClick }) => {
  // Hijri Shamsi Date Formatter
  const hijriShamsiMonthsDari = [
    "حمل",
    "ثور",
    "جوزا",
    "سرطان",
    "اسد",
    "سنبله",
    "میزان",
    "عقرب",
    "قوس",
    "جدی",
    "دلو",
    "حوت",
  ];

  const formatHijriShamsi = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    const { jy, jm, jd } = jalaali.toJalaali(year, month, day);
    return `${jd} ${hijriShamsiMonthsDari[jm - 1]} ${jy}`;
  };

  return (
    <div className="bg-white flex flex-col dark:bg-primary dark:border-primary justify-between rounded-t-xl border h-[450px] w-[300px] md:w-[370px] shadow-md transition-transform transform ">
      {/* Image Section */}
      <div className="h-[200px] overflow-hidden rounded-t-xl">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-contain"
        />
      </div>

      {/* User & Date Section */}
      <div className="text-gray-600 flex mt-2 gap-4 px-4 items-center justify-between dark:text-gray-300 text-sm h-[35px] border-b pb-2">
        <div className="flex gap-x-2 items-center">
          <div className="border rounded-full bg-gray-600 h-6 w-6 p-1 flex justify-center items-center">
            <FaUser size={20} className="text-white" />
          </div>
          <p className="text-md font-Ray_text "> مطبعه تمدن</p>
        </div>
        <div>
          <span className="text-sm ">{formatHijriShamsi(item.created_at)}</span>
        </div>
      </div>

      {/* Title & Description Section */}
      <div className="px-4 h-[190px]  mt-2 overflow-hidden ">
        <h3 className="text-md font-semibold  dark:text-gray-100 flex items-center max-h-[90px] min-h-12 text-gray-800  overflow-hidden text-ellipsis">
          {item.title}
        </h3>
        <p className="text-justify  text-sm  dark:text-gray-100 mt-3  h-[110px]  overflow-hidden text-ellipsis text-gray-800">
          {item.description.length > 150
            ? item.description.substring(0, 150) + "..."
            : item.description}
        </p>
      </div>

      {/* Read More Button */}
      <div
        onClick={onClick}
        className="relative group cursor-pointer overflow-hidden h-[50px] "
      >
        <div className="absolute inset-0 w-0 bg-gradient-to-l from-green to-green transition-all duration-500 group-hover:w-full"></div>
        <div className="relative py-3 flex items-center px-4 justify-between border dark:border-tertiary z-10 transition-all duration-500 group-hover:text-white dark:text-gray-100">
          <span className="font-medium">بشتر بخوانیم</span>
          <RxArrowLeft size={24} />
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
