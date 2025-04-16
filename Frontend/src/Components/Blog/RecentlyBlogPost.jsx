import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BlogCard from "./BlogCard";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const RecentlyBlogPost = () => {
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [errorBlogs, setErrorBlogs] = useState(null);

  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    axios
      .get(`${BASE_URL}/reception/blog/blog-posts/`)
      .then((response) => {
        const sortedBlogs = response.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by created_at descending
          .slice(0, 3); // Get the latest 4 posts
        setBlogs(sortedBlogs);
        setLoadingBlogs(false);
      })
      .catch((error) => {
        setErrorBlogs("بارگیری وبلاگ‌ها ناموفق بود. لطفاً دوباره تلاش کنید.");
        setLoadingBlogs(false);
        console.error("خطا در دریافت وبلاگ‌ها", error);
      });
  }, []);
  return (
    <section className="py-10 px-5 lg:px-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-Ray_black font-bold text-gray-800 dark:text-gray-100">
          آخرین اخبار ما
        </h1>
        <Link to="/blog">
          <button className="primary-btn">دیدن بیشتر!</button>
        </Link>
      </div>

      {loadingBlogs ? (
        <div>در حال بارگذاری...</div>
      ) : errorBlogs ? (
        <div>{errorBlogs}</div>
      ) : (
        <div className="md:max-w-6xl w-full mx-auto flex justify-center mt-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard
              key={blog.id}
              item={blog}
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
            />
          ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RecentlyBlogPost;
