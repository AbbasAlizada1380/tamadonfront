import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { MdArrowForwardIos, MdArrowBackIos } from "react-icons/md";
import axios from "axios";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ImageSlider = () => {
  const [sliders, setSliders] = useState([]);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/common/upload-image/`);
        if (Array.isArray(response.data)) {
          setSliders(response.data);
        } else {
          console.error("Expected an array of sliders but got:", response.data);
          setSliders([]);
        }
      } catch (error) {
        console.error("An error occurred while loading the data:", error);
        setSliders([]);
      }
    };

    fetchSliders();
  }, []);

  return (
    <div className="w-full h-[200px] md:h-[300px] lg:h-[500px] relative group">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000 }}
        effect={"fade"}
        spaceBetween={100}
        slidesPerView={1}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        grabCursor={true}
        className="overflow-visible shadow-lg cursor-pointer relative"
        onInit={(swiper) => {
          // Assign buttons manually after component has mounted
          if (swiper.params.navigation) {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
          }
        }}
      >
        {sliders.length > 0 ? (
          sliders.map((slide, index) => (
            <SwiperSlide key={index}>
              <img
                src={`${BASE_URL}${slide.images}`}
                alt={`Slide ${index + 1}`}
                className="w-full h-[200px] md:h-[300px] lg:h-[500px] object-cover cursor-pointer"
              />
            </SwiperSlide>
          ))
        ) : (
          <div className="w-full h-[300px] lg:h-[500px] flex items-center justify-center text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
              <span>در حال بارگذاری...</span>
            </div>
          </div>
        )}
      </Swiper>

      {/* Navigation buttons */}
      <div
        ref={nextRef}
        onMouseDown={(e) => e.preventDefault()} // Prevents focus issues
        className="button-next-slide group-hover:flex hidden w-[40px] h-[40px] items-center justify-center rounded-full absolute top-1/2 right-5 -translate-y-1/2 z-20 md:bg-white cursor-pointer"
      >
        <MdArrowForwardIos />
      </div>
      <div
        ref={prevRef}
        onMouseDown={(e) => e.preventDefault()} // Prevents focus issues
        className="button-prev-slide group-hover:flex hidden w-[40px] h-[40px] items-center justify-center rounded-full absolute top-1/2 left-5 -translate-y-1/2 z-20 md:bg-white cursor-pointer"
      >
        <MdArrowBackIos />
      </div>
    </div>
  );
};

export default ImageSlider;
