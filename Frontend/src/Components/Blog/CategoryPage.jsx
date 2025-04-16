import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import BlogCard from "./BlogCard";
import { RxArrowLeft } from "react-icons/rx";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const CategoryPage = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(6);

  // Detect screen size and adjust posts per page
  useEffect(() => {
    const updatePostsPerPage = () => {
      setPostsPerPage(window.innerWidth < 768 ? 4 : 6);
    };

    updatePostsPerPage(); // Set initial value
    window.addEventListener("resize", updatePostsPerPage);

    return () => window.removeEventListener("resize", updatePostsPerPage);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsResponse = await axios.get(`${BASE_URL}/reception/blog/blog-posts/`);
        setPosts(postsResponse.data);

        const categoriesResponse = await axios.get(`${BASE_URL}/reception/api/post-categories/`);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      }
    };
    fetchData();
  }, []);

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.category_name : "Unknown Category";
  };

  const filteredPosts = posts.filter((post) => post.category == categoryName);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const renderPaginationButtons = () => {
    const buttons = [];

    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2 py-1 text-xs rounded-md border border-gray-300 font-medium ${
            currentPage === i ? "bg-green text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          } transition-all shadow-md`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col items-center px-5 py-10">
      <div className="mb-6 w-full flex items-center justify-between px-5 h-12 p-1 rounded-md bg-gray-200 dark:bg-primary">
        <div className="flex items-center text-sm dark:text-gray-100 md:text-2xl gap-x-2 font-bold">
          <span>دسته: </span>
          <span>{getCategoryName(Number(categoryName))}</span>
        </div>
        <div className="border bg-white hover:bg-gray-100 py-2 px-4 font-bold rounded-lg">
          <Link to="/blog" className="flex items-center gap-x-1">
            <span className="md:block hidden">صفحه قبلی </span><RxArrowLeft />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentPosts.length > 0 ? (
          currentPosts.map((post) => (
            <BlogCard
              key={post.id}
              item={post}
              onClick={() =>
                navigate(`/blog/${encodeURIComponent(post.title.replace(/\s+/g, "-").toLowerCase())}`, {
                  state: { blog: post },
                })
              }
            />
          ))
        ) : (
          <div className="col-span-full text-center text-xl font-bold text-gray-600">
            هیچ پستی برای این دسته‌بندی یافت نشد.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-start items-center my-10 space-x-2">
          <button
            className={`px-2 py-1 text-xs flex items-center gap-x-1 ml-1.5 rounded-md border ${
              currentPage === 1 ? "cursor-not-allowed text-gray-400 bg-gray-200" : "text-gray-100 bg-green"
            }`}
            disabled={currentPage === 1}
            onClick={handlePreviousPage}
          >
            <FaChevronRight />
            قبلی
          </button>

          {renderPaginationButtons()}

          <button
            className={`px-2 py-1 text-xs flex items-center gap-x-1 rounded-md border ${
              currentPage === totalPages ? "cursor-not-allowed text-gray-400 bg-gray-200" : "text-gray-100 bg-green"
            }`}
            disabled={currentPage === totalPages}
            onClick={handleNextPage}
          >
            بعدی
            <FaChevronLeft />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
