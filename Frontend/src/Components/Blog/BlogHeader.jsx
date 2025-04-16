import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BiMenuAltRight } from "react-icons/bi";
import { IoMdArrowDropleft } from "react-icons/io";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { MdArrowForwardIos, MdArrowBackIos } from "react-icons/md";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import BlogPostList from "./BlogPostList";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const BlogHeader = () => {
  const [blogs, setBlogs] = useState([]);
  const [randomBlogs, setRandomBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${BASE_URL}/reception/blog/blog-posts/`)
      .then((response) => {
        const allBlogs = response.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setBlogs(allBlogs);

        // Select 5 random posts for the slider
        const shuffled = [...allBlogs].sort(() => 0.5 - Math.random());
        setRandomBlogs(shuffled.slice(0, 5));

        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to load blogs. Please try again.");
        setLoading(false);
        console.error("Error fetching blogs:", error);
      });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 mb-10 gap-5 md:gap-10 items-start">
      {/* Left Side - All Blog Posts */}
      <div className="col-span-1 order-2 lg:order-1">
        <BlogPostList blogs={blogs} />
      </div>

      {/* Right Side - Swiper with Random 5 Posts */}
      <div className="col-span-2 border dark:bg-primary dark:border-primary order-1 lg:order-2 rounded-lg w-full h-auto">
        <div className="relative overflow-visible">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            autoplay={{ delay: 3000 }}
            loop={true}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{
              nextEl: ".button-next-slide",
              prevEl: ".button-prev-slide",
            }}
            grabCursor={true}
            className="shadow-lg cursor-pointer"
          >
            {randomBlogs.map((blog) => (
              <SwiperSlide
                key={blog.id}
                onClick={() =>
                  navigate(
                    `/blog/${encodeURIComponent(
                      blog.title.replace(/\s+/g, "-").toLowerCase()
                    )}`,
                    {
                      state: { blog: blog },
                    }
                  )
                }
              >
                <div className="w-full text-center">
                  <div className="px-4 py-4 md:px-5 md:py-5">
                    <img
                      src={blog.image}
                      alt=""
                      className="w-full h-[200px] md:h-[350px] rounded-md object-contain"
                    />
                  </div>
                  <div className="text-gray-600 dark:text-gray-100p flex justify-center items-center bg-gray-100 dark:bg-primary border dark:border-primary h-16 md:h-20">
                    <p className="text-sm md:text-lg">{blog.title}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons */}
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="button-prev-slide cursor-pointer hidden md:flex w-[30px] h-[30px] items-center justify-center rounded-full absolute top-1/2 -translate-y-1/2 -left-4 z-20 bg-green/50 shadow-md"
          >
            <MdArrowBackIos />
          </div>
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="button-next-slide hidden cursor-pointer md:flex w-[30px] h-[30px] items-center justify-center rounded-full absolute top-1/2 -translate-y-1/2 -right-4 z-20 bg-green/50 shadow-md"
          >
            <MdArrowForwardIos />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogHeader;
