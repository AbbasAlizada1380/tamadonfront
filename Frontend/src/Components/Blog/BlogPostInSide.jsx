import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BlogCardInSide from "./BlogCardInSide";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const BlogPostInSide = () => {
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
        setErrorBlogs("Failed to load blogs");
        setLoadingBlogs(false);
        console.error(error);
      });
  }, []);

  return (
    <div className="px-4  w-full">
      {/* Blog Section Header */}
      <div className="flex justify-between  items-center mb-10 px-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          آخرین اخبار ما
        </h1>
      </div>

      {/* Blog Cards */}
      {loadingBlogs ? (
        <div className="text-center text-gray-600 dark:text-gray-300">
          در حال بارگذاری...
        </div>
      ) : errorBlogs ? (
        <div className="text-center text-red-500">{errorBlogs}</div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {blogs.slice(0, 3).map((blog) => (
            <BlogCardInSide
              key={blog.id}
              item={blog}
              onClick={() =>
                navigate(`/blog/${encodeURIComponent(blog.title.replace(/\s+/g, "-").toLowerCase())}`, {
                  state: { blog: blog },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPostInSide;
