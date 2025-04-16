import React from "react";
import { motion } from "framer-motion";
const ServicesSubCard = ({sub}) => {
  return (
    <motion.div
      className="relative w-[300px] md:w-[300px] lg:w-[400px] border cursor-pointer  h-[200px] md:h-[250px] overflow-hidden group"
      whileHover="hover"
      initial="initial"
      exit="exit"
    >
      {/* Image */}
      <img
        src={sub.image}
        alt={sub.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />

      {/* Overlay Layer */}
      <motion.div
        variants={{
          initial: { opacity: 0 },
          hover: { opacity: 1 },
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black bg-opacity-70"
      ></motion.div>

      {/* Name Section (Animate from bottom to top) */}
      <motion.div
        variants={{
          initial: { y: 100, opacity: 0 },
          hover: { y: 0, opacity: 1 },
          exit: { y: 100, opacity: 0 },
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute bottom-0 left-0 w-full bg-green bg-opacity-70 text-white font-bold p-3 text-center"
      >
        {sub.name}
      </motion.div>
    </motion.div>
  );
};

export default ServicesSubCard;
