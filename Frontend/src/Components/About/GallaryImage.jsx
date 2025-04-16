import React, { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import axios from "axios";
import Box from "@mui/material/Box";
import Masonry from "@mui/lab/Masonry";

const GalleryImage = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [images, setImages] = useState([]);

  // Fetch images from the backend
  const fetchImages = async () => {
    try {
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      if (!BASE_URL) {
        throw new Error("BASE_URL is not defined in the .env file");
      }

      const response = await axios.get(`${BASE_URL}/common/about/`);
      setImages(response.data); // Update state with fetched data
    } catch (error) {
      console.error("Failed to fetch images:", error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Open modal with selected image
  const openModal = (index) => {
    setSelectedImageIndex(index);
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
  };

  // Navigate between images in the modal
  const changeImage = (direction) => {
    let newIndex = selectedImageIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    setSelectedImageIndex(newIndex);
  };

  return (
    <div className="container mx-auto mt-10">
      {/* Header Section */}
      <div className="flex items-center gap-3 px-10 py-5 relative z-10">
        <p className="text-2xl text-gray-500 dark:text-gray-100 font-bold">
          گالری تصاویر
        </p>
        <hr className="flex-grow border-t border-dashed border-gray-500" />
        <p className="text-white bg-green dark:bg-secondary dark:text-primary px-2 py-1 rounded-full text-sm">
          Our works
        </p>
      </div>

      {/* Masonry Layout for Images */}
      {/* Masonry Layout for Images */}
      <Box sx={{ width: "100%", minHeight: 600 }}>
        <Masonry columns={{ xs: 2, sm: 3, lg: 5 }} spacing={2}>
          {images.map((image, index) => (
            <div
              key={index}
              className="cursor-pointer transform transition-transform duration-300 hover:scale-105 rounded-md"
              onClick={() => openModal(index)}
            >
              <img
                src={image.image}
                alt={`Gallery Image ${index + 1}`}
                className="w-full max-h-[350px] object-cover rounded-md"
              />
            </div>
          ))}
        </Masonry>
      </Box>

      {/* Modal for Selected Image */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-800 dark:bg-black-100 dark:bg-opacity-80 bg-opacity-75 flex justify-center items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white dark:bg-primary rounded-md w-full max-w-4xl h-[80vh]">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-5 p-2 bg-red-500 text-white rounded-full opacity-75 hover:opacity-100 transition-opacity"
              aria-label="Close"
            >
              <IoClose className="h-6 w-6" />
            </button>

            {/* Selected Image */}
            <img
              src={images[selectedImageIndex].image}
              alt={`Selected Image ${selectedImageIndex + 1}`}
              className="w-full h-full object-contain rounded-md"
            />

            {/* Previous Button */}
            <button
              onClick={() => changeImage(-1)}
              className="absolute left-5 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800 text-white rounded-full opacity-75 hover:opacity-100 transition-opacity"
              aria-label="Previous Image"
            >
              <FaChevronLeft className="h-6 w-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={() => changeImage(1)}
              className="absolute right-5 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800 text-white rounded-full opacity-75 hover:opacity-100 transition-opacity"
              aria-label="Next Image"
            >
              <FaChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryImage;
