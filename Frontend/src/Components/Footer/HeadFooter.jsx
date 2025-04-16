import React from "react";
import { BiSolidPhoneCall } from "react-icons/bi";
import { AiOutlineMessage } from "react-icons/ai";

const HeadFooter = () => {
  return (
    <div className="h-auto bg-[#ED8D1D] dark:bg-primary px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center lg:mx-20 text-center md:text-left">
        {/* Left Section */}
        <div className="flex flex-col md:flex-row items-center md:justify-start gap-4">
          <div className="px-4 py-2 rounded-xl w-full md:w-auto dark:bg-tertiary dark:text-gray-100 bg-gray-200 text-black">
            <p className="font-extrabold text-lg sm:text-xl">با ما به تماس شوید !</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100">
              93-772-029-545+
            </p>
            <span className="bg-gray-200 p-2 rounded-full">
              <BiSolidPhoneCall className="text-black animate-pulse" size={22} />
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100">
              93-728-215-5482+
            </p>

            <span className="bg-gray-200 p-2 rounded-full">
              <BiSolidPhoneCall
                className="text-black animate-pulse"
                size={22}
              />
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-4">
          <p className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-100">
            tamadon.af@gmail.com
          </p>
          <span className="bg-gray-200 p-2 rounded-full">
            <AiOutlineMessage className="text-black animate-pulse" size={22} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeadFooter;
