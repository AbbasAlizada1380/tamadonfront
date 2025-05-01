import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment-jalaali";
import CryptoJS from "crypto-js";

const Bill = ({ order }) => {
  const [categories, setCategories] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [prices, setPrices] = useState([]);
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [currentTime, setCurrentTime] = useState(moment().format("HH:mm:ss"));
  const secretKey = "TET4-1";
  const decryptData = (hashedData) => {
    if (!hashedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  };

  const fetchPrices = async (orderId) => {
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/group/order-by-price/`, {
        params: { order: orderId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPrices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDesigners = async () => {
    const token = decryptData(localStorage.getItem("auth_token"));
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/users/api/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDesigners(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getDesignerName = (id) => {
    return designers.find((d) => d.id === id)?.first_name || "نامشخص";
  };

  const formatToShamsi = (date) => {
    if (!date) return "";
    return moment(date).format("jYYYY/jMM/jDD");
  };

  useEffect(() => {
    if (order?.id) fetchPrices(order.id);
  }, [order]);

  useEffect(() => {
    fetchDesigners();
    axios
      .get(`${BASE_URL}/group/categories/`)
      .then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment().format("HH:mm:ss"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className=" bg-white  rounded-lg border-[1px] border-black h-[465px] w-[90%] mt-[150px]  ">
      <div className="h-[100px] border-b-[0.5px] border-black p-4 relative ">
        <div className="absolute -top-8 -left-8">
          <span className="text-xs pl-10"> زمان صدور بیل: {currentTime}</span>
        </div>{" "}
        <div className="absolute top-0 flex justify-between w-full">
          <div className="text-sm">
            <div className="flex items-start gap-x-1.5">
              <span>اسم مشتری:</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-x-1.5">
              <span>نام سفارش:</span>
              <span>{order.order_name}</span>
            </div>
            <div className="flex items-center gap-x-1.5">
              <span>نام دیزاینر:</span>
              <span>
                {order.designer_details.full_name || "Unknown Designer"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-1 relative">
        <div className="bg-black  text-white font-bold text-center rounded-full p-1 absolute top-[-18px] right-0 left-0 mx-auto h-8 w-[160px]">
          <span className="absolute w-full left-1/2  text-white -translate-x-1/2 -top-1 z-20">
            {" "}
            مشخصات سفارش
          </span>
        </div>
        <div className="h-[295px] pt-5">
          {order.attributes &&
            Object.entries(order.attributes).map(([key, value], index) => (
              <div key={index} className="flex justify-start items-end">
                <span className="font-medium">{key}:</span>
                <span>{value || "ندارد"}</span>
              </div>
            ))}
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="border rounded-md border-black p-1 text-xs h-7 relative">
            <div className="flex items-center absolute  -top-1">
              <span className="text-black">کد سفارش:</span>
              <span>{order.secret_key}</span>
            </div>
          </div>

          <div className="border rounded-md border-black p-1 text-xs  h-7 relative">
            <div className="flex items-center absolute -top-1">
              <span className="text-black">تاریخ اخذ:</span>
              <span>
                {formatToShamsi(prices[0]?.created_at).replace(/\//g, "-") ||
                  "unknown"}
              </span>
            </div>
          </div>

          <div className="border rounded-md border-black p-1 text-xs   h-7 relative">
            <div className="flex items-center absolute -top-1">
              <span className="text-black">تاریخ تحویل:</span>
              <span>{prices[0]?.delivery_date || "unknown"}</span>
            </div>
          </div>

          <div className="border rounded-md border-black p-1 text-xs  h-7 relative">
            <div className="flex items-center absolute -top-1">
              <span className="text-black">جمله:</span>
              <span>{prices[0]?.price || "unknown"}</span>
            </div>
          </div>

          <div className="border rounded-md border-black p-1 text-xs  h-7 relative">
            <div className="flex items-center absolute -top-1">
              <span className="text-black">پیش پرداخت:</span>
              <span> {prices[0]?.receive_price || "unknown"}</span>
            </div>
          </div>

          <div className="border rounded-md border-black p-1 text-xs  h-7 relative">
            <div className="flex items-center absolute -top-1">
              <span className="text-black">باقی:</span>
              <span>{prices[0]?.reminder_price || "unknown"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Bill);
