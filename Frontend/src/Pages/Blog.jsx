import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BlogCard from "../Components/Blog/BlogCard";
import BlogHeader from "../Components/Blog/BlogHeader";
import Filtering from "../Components/Blog/Filtering";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"; // Updated icons
import BlogCategoryList from "../Components/Blog/BlogCategoryList";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Blog = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(6);

  // Adjust postsPerPage based on screen size
  useEffect(() => {
    const updatePostsPerPage = () => {
      setPostsPerPage(window.innerWidth < 768 ? 6 : 6);
    };

    updatePostsPerPage(); // Set initially
    window.addEventListener("resize", updatePostsPerPage);

    return () => window.removeEventListener("resize", updatePostsPerPage);
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${BASE_URL}/reception/blog/blog-posts/`
        );
        setBlogs(response.data);
      } catch (err) {
        setError("هنگام دریافت بلاگ‌ها خطا رخ داد");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Filter blogs by category
  const filteredBlogs = selectedCategory
    ? blogs.filter((item) => item.category === selectedCategory)
    : blogs;

  // Calculate pagination
  const totalPages = Math.ceil(filteredBlogs.length / postsPerPage);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Pagination button generator
  const getPaginationButtons = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2);
      if (currentPage > 4) pages.push("...");
      for (
        let i = Math.max(3, currentPage - 1);
        i <= Math.min(totalPages - 2, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }
    return pages;
  };

  return (
    <section className="container mx-auto py-10 lg:py-5">
      <div className="px-4">
        <BlogCategoryList blogs={blogs} />
        <BlogHeader />
        <div className="flex justify-between gap-6 p-4">
          <h1 className="md:text-2xl text-xl font-Ray_black font-bold text-gray-900 dark:text-gray-50 mb-5">
            اخبار چاپخانه تمدن
          </h1>
          <Filtering onCategoryChange={setSelectedCategory} />
        </div>
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="grid grid-cols-1 mx-auto place-content-center md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && <p>در حال بارگذاری...</p>}
            {error && <p>{error}</p>}
            {paginatedBlogs.length > 0 ? (
              paginatedBlogs.map((item) => (
                <BlogCard
                  key={item.id}
                  item={item}
                  onClick={() =>
                    navigate(
                      `/blog/${encodeURIComponent(
                        item.title.replace(/\s+/g, "-").toLowerCase()
                      )}`,
                      {
                        state: { blog: item },
                      }
                    )
                  }
                />
              ))
            ) : (
              <p>هیچ پستی برای این دسته موجود نیست.</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              {/* Previous Button */}
              <button
                className={`px-2 py-1 text-xs flex items-center gap-x-1 ml-1.5 rounded-md border ${
                  currentPage === 1
                    ? "cursor-not-allowed text-gray-400 bg-gray-200"
                    : "text-gray-100 bg-green "
                }`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                <FaChevronRight />
                قبلی
              </button>

              {/* Page Numbers */}
              {getPaginationButtons().map((page, index) =>
                page === "..." ? (
                  <span key={index} className="px-2 py-1 text-xs text-gray-600">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    className={`px-2 py-1 text-xs rounded-md border shadow-md ${
                      currentPage === page
                        ? "bg-green text-white border-green"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next Button */}
              <button
                className={`px-2 py-1 text-xs flex items-center gap-x-1 rounded-md border ${
                  currentPage === totalPages
                    ? "cursor-not-allowed text-gray-400 bg-gray-200"
                    : "text-gray-100 bg-green"
                }`}
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                بعدی
                <FaChevronLeft />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Blog;
