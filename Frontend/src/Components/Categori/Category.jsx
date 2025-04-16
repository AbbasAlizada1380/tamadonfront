import React, { useState, useEffect } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // Initially null
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [maxVisibleImages, setMaxVisibleImages] = useState(4);
  const [maxVisibleButtons, setMaxVisibleButtons] = useState(4);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/common/galleries/`);
      setImages(response.data);
    } catch (error) {
      console.error("عدم توانایی در دریافت تصاویر:", error);
      setImages([]); // Set images to empty array on error
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/common/gallery-categories/`
        );
        const fetchedCategories = response.data;

        // Check if the response is an array
        if (Array.isArray(fetchedCategories)) {
          setCategories(fetchedCategories);

          // Automatically select the first category if available
          if (fetchedCategories.length > 0) {
            setSelectedCategory(fetchedCategories[0].id);
          }
        } else {
          console.error(
            "Expected an array of categories, but got:",
            fetchedCategories
          );
          setCategories([]); // Set to empty array if the response is not an array
        }
      } catch (error) {
        console.error("عدم توانایی در دریافت دسته‌ها:", error);
      }
    };

    fetchImages();
    fetchCategories();
  }, []);

  const totalButtons = categories.length;

  useEffect(() => {
    const updateResponsiveSettings = () => {
      if (window.innerWidth >= 1024) {
        setMaxVisibleImages(8);
        setMaxVisibleButtons(12);
      } else if (window.innerWidth >= 768) {
        setMaxVisibleImages(4);
        setMaxVisibleButtons(7);
      } else {
        setMaxVisibleImages(4);
        setMaxVisibleButtons(3);
      }
    };

    updateResponsiveSettings();
    window.addEventListener("resize", updateResponsiveSettings);
    return () => window.removeEventListener("resize", updateResponsiveSettings);
  }, []);

  const nextSlide = () => {
    if (currentIndex < totalButtons - maxVisibleButtons) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const selectedImages = images.filter(
    (image) => image.category === selectedCategory
  );

  const visibleImages = expanded
    ? selectedImages
    : selectedImages.slice(0, maxVisibleImages);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold font-Ray_black text-gray-800 dark:text-gray-100 text-center mb-3 mt-5">
        گالری محصولات ما
      </h1>

      <div className="flex flex-col items-center gap-y-5 mb-6">
        <div className="w-full flex justify-start gap-x-5 px-10 md:px-12 lg:px-28">
          {totalButtons > maxVisibleButtons && (
            <button
              onClick={nextSlide}
              className={`rounded-full transition p-1.5 ${
                currentIndex < totalButtons - maxVisibleButtons
                  ? "bg-green text-white "
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={currentIndex >= totalButtons - maxVisibleButtons}
              aria-label="Next categories"
            >
              <FaArrowRight />
            </button>
          )}
          {totalButtons > maxVisibleButtons && (
            <button
              onClick={prevSlide}
              className={`rounded-full transition p-1.5 ${
                currentIndex > 0
                  ? "bg-green text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={currentIndex === 0}
              aria-label="Previous categories"
            >
              <FaArrowLeft />
            </button>
          )}
        </div>
        <div className="flex overflow-hidden transition-transform duration-500 gap-4">
          {/* Ensure categories is an array before calling .slice() and .map() */}
          {Array.isArray(categories) &&
            categories
              .slice(currentIndex, currentIndex + maxVisibleButtons)
              .map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setExpanded(false);
                  }}
                  className={`px-4 py-2 rounded-md hover:text-white transition ${
                    selectedCategory === category.id
                      ? "bg-green text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-green"
                  }`}
                >
                  {category.name}
                </button>
              ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {visibleImages.length > 0 ? (
          visibleImages.map((image, index) => (
            <img
              key={index}
              src={image.image}
              alt={`Image ${index + 1}`}
              className="w-full h-48 object-contain border shadow-md rounded-md hover:scale-95 duration-300 transition-transform"
            />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
          تصویری برای این کتگوری موجود نیست.
          </p>
        )}
      </div>

      {selectedImages.length > maxVisibleImages && (
        <div className="text-center mt-4">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="primary-btn"
          >
            {expanded ? "مشاهده کمتر" : "مشاهده بیشتر"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Category;
