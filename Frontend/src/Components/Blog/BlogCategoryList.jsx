import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { BookOpen } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { MdArrowForwardIos, MdArrowBackIos } from "react-icons/md";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const BlogCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/reception/api/post-categories/`
        );
        setCategories(response.data); // Set the fetched categories
      } catch (error) {
        console.error("Error fetching categories:", error.message);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="border dark:border-primary mb-4 rounded-lg bg-gray-200 dark:bg-primary p-4 relative">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={5}
        navigation={{ nextEl: ".custom-next", prevEl: ".custom-prev" }}
        autoplay={{ delay: 3000 }}
        loop
        breakpoints={{
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 5 },
        }}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.id}>
            <div
              className="px-3 py-1 bg-white h-[120px] flex items-center flex-col justify-center min-w-[120px] dark:bg-gray-700 rounded-lg cursor-pointer gap-y-2 shadow-xl dark:hover:bg-gray-600"
              onClick={() => navigate(`/category/${category.id}`)}
            >
              <BookOpen className="text-4xl text-green" size={35} />
              <span className="text-gray-700 dark:text-gray-300">
                {category.category_name}
              </span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Navigation Buttons */}
      <div
        onMouseDown={(e) => e.preventDefault()}
        className="custom-prev cursor-pointer hidden md:flex w-[30px] h-[30px] items-center justify-center rounded-full absolute top-1/2 -translate-y-1/2 -left-4 z-20 bg-green/50 shadow-md"
      >
        <MdArrowBackIos />
      </div>
      <div
        onMouseDown={(e) => e.preventDefault()}
        className="custom-next hidden cursor-pointer md:flex w-[30px] h-[30px] items-center justify-center rounded-full absolute top-1/2 -translate-y-1/2 -right-4 z-20 bg-green/50 shadow-md"
      >
        <MdArrowForwardIos />
      </div>
    </div>
  );
};

export default BlogCategoryList;
