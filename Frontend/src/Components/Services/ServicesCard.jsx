import React from "react";
import { useNavigate } from "react-router-dom";

const ServicesCard = ({ service, className, height = "320px"}) => {
  const navigate = useNavigate
  return (
    <div
      
      className={`${className} rounded-lg border shadow-lg cursor-pointer overflow-hidden`}
    >
      <div
        className="relative group overflow-hidden"
        style={{ height: height }}
      >
        {/* Image */}
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>

        </div>
      </div>
    </div>
  );
};

export default ServicesCard;
