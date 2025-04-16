import React, { useState } from "react";

const BackdropImage = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-30"
      onClick={onClose} // Close the backdrop when clicked outside
    >
      <div className="relative lg:w-[700px] border w-[500px] h-[200px] mx-10 p-5">
        <img
          src={images[currentIndex]} // Display the current image
          alt="Enlarged view"
          className="w-full h-[300px] rounded-lg"
        />
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800 text-white rounded-full opacity-75 hover:opacity-100 transition-opacity"
          onClick={prevImage} // Go to the previous image
        >
          &lt;
        </button>
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800 text-white rounded-full opacity-75 hover:opacity-100 transition-opacity"
          onClick={nextImage} // Go to the next image
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default BackdropImage;
