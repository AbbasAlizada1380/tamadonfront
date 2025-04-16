import React from "react";
import { BsDot, BsPhone } from "react-icons/bs";

import { FaPhoneAlt } from "react-icons/fa";
import image from "../../assets/Hero_Image/image1.jpg";

const WithTamadon = () => {
  return (
    <div className="lg:h-fit container mx-auto px-10  md:mt-5 md:py-5 py-2  ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ">
        <div className="lg:py-8 py-8 md:py-2  order-2 md:order-1">
          <h3 className="font-bold dark:text-gray-100 text-xl">
            با مطبعه تمدن
          </h3>
          <h1 className="font-extrabold dark:text-gray-200 text-3xl mt-4 ">
            {" "}
            تلاقی کیفیت و نو آوری!
          </h1>
          <p className="mt-2 text-lg font-bold dark:text-gray-100">خدمات ما شامل:
          </p>
          <ul className="mt-1  ">
            <li className="flex items-center">
              <span>
                <BsDot className="text-green dark:text-gray-400 " size={32} />
              </span>
              <p className="text-gray-800 dark:text-gray-400">
                خدمات طراحی گرافیکی و مشاوره چاپ
              </p>
            </li>
            <li className="flex items-center">
              <span>
                <BsDot className="text-green dark:text-gray-400 " size={32} />
              </span>
              <p className="text-gray-800 dark:text-gray-400">
                {" "}
                چاپ پوستر و بنر(فرنت لایت، بک‌لایت، ون ویژن، استیکر ، اندور،
                ایکو و غیره...)
              </p>
            </li>
            <li className="flex items-center">
              <span>
                <BsDot className="text-green dark:text-gray-400 " size={32} />
              </span>
              <p className="text-gray-800 dark:text-gray-400">
                چاپ کتاب، مجله، بروشور، کتلاگ، کارت ویزیت، فاکتور، نسخه و دوسیه
              </p>
            </li>
            <li className="flex items-center">
              <span>
                <BsDot className="text-green dark:text-gray-400 " size={32} />
              </span>
              <p className="text-gray-800 dark:text-gray-400">
                {" "}
                چاپ قوطی‌های بسته‌بندی و لیبل
              </p>
            </li>

            <li className="flex items-center">
              <span>
                <BsDot className="text-green dark:text-gray-400 " size={32} />
              </span>
              <p className="text-gray-800 dark:text-gray-400">
                لوحه‌های برجسته، تاپه و بیرق
              </p>
            </li>
           
          </ul>
          <div className="text-base mt-2 ">
            <p className="text-justify dark:text-gray-100">
              ما با تیمی متخصص و متعهد، همواره در تلاشیم تا با درک نیازهای
              مشتریان، بهترین خدمات را ارائه دهیم. از اولین مشاوره تا تحویل
              نهایی، همراه شما خواهیم بود تا نتیجه‌ای که می‌خواهید به دست آورید.
              برای اطلاعات بیشتر یا دریافت قیمت، با ما تماس بگیرید.
            </p>
          </div>
          <button  className="bg-green dark:bg-tertiary py-2 px-10 gap-2 hover:bg-green/90 font-bold rounded-xl  mt-4 text-white flex justify-center items-center">
            <span className="p-2 bg-white rounded-full">
              <FaPhoneAlt className="text-black" />
            </span>
            <span>تماس با ما</span>
            <span>93772029545+</span>
          </button>
        </div>
        <div className="lg:h-[390px] h-[200px] md:h-[300px] mt-10 order-1 md:order-2">
          <img
            src="/image1.jpg"
            alt=""
            className="bg-cover md:rounded-tr-lg h-full w-full rounded-xl md:rounded-br-[150px] object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default WithTamadon;
