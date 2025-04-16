import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";
import BlogPostInSide from "./BlogPostInSide";
import jalaali from "jalaali-js";
import { FaCalendarAlt, FaUserTie, FaComment } from "react-icons/fa";
import { GoCommentDiscussion } from "react-icons/go";
import BlogPostList from "./BlogPostList";
import axios from "axios";
import RelatedPosts from "./RelatedPosts"; // Import the new component
import BlogCategoryListDetailsPage from "./BlogCategoryListDetailsPage";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const BlogCardDetails = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const blog = location.state?.blog;

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/reception/blog/blog-posts/`)
      .then((response) => {
        const allBlogs = response.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setBlogs(allBlogs);
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to load blogs. Please try again.");
        setLoading(false);
        console.error("Error fetching blogs:", error);
      });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!blog) {
    return (
      <div id="postdetails" className="text-center mt-10">
        <h1 className="text-2xl font-bold">No Blog Data Available</h1>
        <button
          onClick={() => navigate("/blog")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back to Blogs
        </button>
      </div>
    );
  }

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

  function formatHijriShamsi(date) {
    const [year, month, day] = date.split("-").map(Number);
    const { jy, jm, jd } = jalaali.toJalaali(year, month, day);
    const monthName = hijriShamsiMonthsDari[jm - 1];
    return `${jd} ${monthName} ${jy}`;
  }

  return (
    <section className="bg-white dark:bg-black-100 container mx-auto  pb-5 space-y-6">
      <Breadcrumb />

      <div className="flex flex-col md:flex-row gap-5">
        <div className="md:w-[65%] lg:w-[65%] w-full h-fit border lg:px-10 px-5 rounded-md">
          <div className="h-auto border-b-2 rounded-xl p-5">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">
              {blog.title}
            </h1>
            <div className="flex text-gray-500 text-sm gap-5">
              <div className="flex items-center gap-2">
                <FaUserTie />
                <p>Tamadon</p>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                <span className="text-sm">
                  {formatHijriShamsi(blog.created_at)}
                </span>
              </div>
              <div className="flex items-center cursor-pointer gap-2">
                <FaComment />
                <p>نظر دادن</p>
              </div>
            </div>
          </div>

          <div className="relative w-full mt-3 h-[300px] md:h-[300px] lg:h-[500px] rounded-md overflow-hidden mb-6">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-justify leading-relaxed">
            {blog.description}
          </p>

          {/* Add RelatedPosts component */}
        </div>

        <div className=" lg:w-[35%] space-y-5 h-fit">
          <BlogCategoryListDetailsPage />
          <BlogPostList blogs={blogs} />
        </div>
      </div>

      {/* Comment to each post */}
      <div className=" bg-gray-200 dark:bg-primary  w-full lg:px-10 py-10 md:py-20  text-gray-600 border-t ">
        <div className="text-sm  border  shadow-xl rounded-lg bg-white dark:bg-tertiary py-5 md:py-10 max-w-6xl mx-auto px-10  lg:px-20 ">
          <div className="flex flex-col md:flex-row items-center gap-3 pb-3">
            <GoCommentDiscussion size={20} />
            <h1 className="md:text-xl font-bold">ارسال دیدگاه</h1>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              برای : "{blog.title}"
            </p>
          </div>
          <p className="md:text-md sm:text-sm font-bold text-gray-500 pb-5">
            نشانی ایمیل شما منتشر نخواهد شد. بخش‌های موردنیاز علامت‌گذاری
            شده‌اند *
          </p>
          <form action="" className="w-full space-y-3">
            {/* Name and Email in one row */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-1/2">
                <label
                  htmlFor="name"
                  className="block text-lg  text-gray-700 mb-2"
                >
                  نام *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder=""
                  required
                  className="w-full px-4 py-2 border-2 shadow-lg text-gray-700 rounded-lg bg-transparent focus:outline-none"
                />
              </div>
              <div className="w-full md:w-1/2">
                <label
                  htmlFor="email"
                  className="block text-lg  text-gray-700 mb-2"
                >
                  ایمیل *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder=""
                  required
                  className="w-full px-4 py-2 border-2 shadow-lg text-gray-700 rounded-lg bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Message textarea in the next row */}
            <div className="mt-5">
              <label
                htmlFor="message"
                className="block text-lg  mt-5 text-gray-700 mb-2"
              >
                پیام شما *
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="پیام خود را بنوسید..."
                rows="7"
                required
                className="w-full px-4 py-2 border-2  text-gray-700 rounded-lg focus:outline-none shadow-lg bg-transparent"
              ></textarea>
            </div>

            {/* Buttons */}
            <div className="flex justify-between">
              <button type="submit" className="primary-btn">
                ارسال نظر
              </button>
              <button
                onClick={() => navigate("/blog")}
                className="flex items-center text-lg text-green hover:underline"
              >
                ← بازگشت به اخبار
              </button>
            </div>
          </form>
        </div>
      </div>
      <RelatedPosts category={blog.category} currentPostId={blog.id} />
    </section>
  );
};

export default BlogCardDetails;
