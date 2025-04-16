import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";

const ActiveCustomer = () => {
  const stats = {
    activeCustomers: 35200,
    visitors: 840,
    orders: {
      perDay: 425,
    },
  };
  const convertToFarsi = (number) => {
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return number
      .toString()
      .split("")
      .map((digit) => farsiDigits[parseInt(digit)] || digit)
      .join("");
  };
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [orders, setOrders] = useState({
    perDay: 0,
    perMonth: 0,
    perYear: 0,
  });
  const [hasAnimated, setHasAnimated] = useState(false);

  const sectionRef = useRef(null);

  const orderLabels = {
    perDay: "روزانه",
    perMonth: "ماهانه",
    perYear: "سالانه",
  };

  const animateCounter = (target, setter) => {
    let count = 0;
    const interval = setInterval(() => {
      count += Math.ceil(target / 50);
      if (count >= target) {
        clearInterval(interval);
        setter(target);
      } else {
        setter(count);
      }
    }, 20);
  };

  const animateOrders = () => {
    Object.keys(stats.orders).forEach((key) => {
      animateCounter(stats.orders[key], (value) =>
        setOrders((prevOrders) => ({
          ...prevOrders,
          [key]: value,
        }))
      );
    });
  };

  const handleScroll = () => {
    if (!hasAnimated) {
      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (sectionTop < windowHeight - 100) {
        setHasAnimated(true);
        animateCounter(stats.activeCustomers, setActiveCustomers);
        animateCounter(stats.visitors, setVisitors);
        animateOrders();
      }
    }
  };

  useEffect(() => {
    handleScroll(); // Trigger animation on initial load
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasAnimated]);

  return (
    <div ref={sectionRef} className="py-1 px-6 relative  mx-auto mt-10 md:mt-20">
      <div className="grid grid-cols-1 md:grid-cols-3 border-b py-5  border-t justify-center  lg:grid-cols-3 gap-10 lg:gap-4 md:gap-1">
        <div className="relative md:border-l text-center content-center space-y-2">
          <p className="mt-5 font-bold flex items-center text-green justify-center text-green-500">
            <span className="text-3xl">{convertToFarsi(activeCustomers)}</span>
            <span className="ml-2">
              <FaPlus />
            </span>
          </p>
          <h3 className=" text-lg md:text-xl text-gray-800 dark:bg-black-100 dark:text-gray-100 absolute left-1/2 -translate-x-1/2 lg:-top-14 -top-12 bg-white px-5 py-2 font-bold">
            مشتریان
          </h3>
        </div>

        <div className="relative p-4 content-center border-t md:border-none text-center space-y-2">
          <p className=" font-bold flex items-center justify-center text-green mt-5">
            <span className="text-3xl"> {convertToFarsi(visitors)}</span>
            <span className="ml-2">
              <FaPlus />
            </span>
          </p>
          <h3 className="text-lg md:text-xl dark:bg-black-100 dark:text-gray-100 text-gray-800 absolute left-1/2 -translate-x-1/2 lg:-top-14 md:-top-16 -top-8 bg-white px-5 py-2 font-bold">
            بازدید کنندگان
          </h3>
        </div>

        <div className="relative border-t md:border-t-0 md:border-r p-4 flex justify-center text-center space-y-4">
          <div className="flex md:hidden lg:flex justify-around gap-x-8 items-center mt-6 ">
            <div>
              <p className="font-bold flex items-center justify-center text-green">
                <span className="text-3xl">
                  {" "}
                  {convertToFarsi(orders.perDay)}
                </span>
                <span className="ml-2">
                  <FaPlus />
                </span>
              </p>
            
            </div>
          </div>
          <h3 className="text-lg md:text-xl dark:bg-black-100 dark:text-gray-100 text-gray-800 absolute left-1/2 -translate-x-1/2 md:-top-16 -top-10 bg-white px-5 py-2 font-bold">
            سفارشات روزانه
          </h3>
        </div>
      </div>
    </div>
  );
};

export default ActiveCustomer;
