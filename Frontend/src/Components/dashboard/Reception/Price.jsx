import { useEffect, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import CryptoJS from "crypto-js";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const Price = ({ editingPriceId, setShowPrice }) => {
  const secretKey = "TET4-1";

  const decryptData = (hashedData) => {
    if (!hashedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  const [modalData, setModalData] = useState({
    id: null,
    receive_price: "",
    price: "",
    reminder_price: "",
    delivery_date: "",
    order_id: editingPriceId,
  });

  const [loading, setLoading] = useState(false);

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleEdite = async () => {
    if (!editingPriceId) return;
    try {
      let token = decryptData(localStorage.getItem("auth_token"));
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/group/order-by-price/?order=${editingPriceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.length > 0) {
        setModalData(response.data[0]);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطا",
        text: "اطلاعات قابل بارگذاری نیست!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleEdite();
  }, [editingPriceId]);

  const handleSubmit = async () => {
    const { price, receive_price } = modalData;
    const priceValue = Number(price);
    const receivePriceValue = Number(receive_price);

    if (!price || !receive_price) {
      return Swal.fire({
        icon: "warning",
        title: "اطلاعات ناقص",
        text: "لطفاً همه فیلدها را پر کنید!",
      });
    }

    if (receivePriceValue > priceValue) {
      return Swal.fire({
        icon: "error",
        title: "خطا!",
        text: "قیمت دریافتی نمی‌تواند بیشتر از قیمت کل باشد!",
      });
    }

    try {
      const token = decryptData(localStorage.getItem("auth_token"));
      const payload = {
        id: modalData.id,
        order_id: editingPriceId,
        price: priceValue,
        receive_price: receivePriceValue,
        reminder_price: String(priceValue - receivePriceValue),
        delivery_date: modalData.delivery_date,
      };

      await axios.put(
        `${BASE_URL}/group/order-by-price/${modalData.id}/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire({
        icon: "success",
        title: "موفقیت آمیز!",
        text: "اطلاعات با موفقیت ثبت شد.",
      });

      setShowPrice(false);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطا در ثبت اطلاعات!",
        text: "مشکلی پیش آمده است. لطفاً دوباره امتحان کنید.",
      });
    }
  };

  const handleDateChange = (date) => {
    const formattedDate = date.format("YYYY-MM-DD").toString();
    setModalData((prevData) => ({
      ...prevData,
      delivery_date: toEnglishDigits(formattedDate),
    }));
  };

  const toEnglishDigits = (str) => {
    if (typeof str !== "string") return str;
    const persianNumbers = "۰۱۲۳۴۵۶۷۸۹";
    return str.replace(/[۰-۹]/g, (d) => persianNumbers.indexOf(d));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col gap-5 items-center justify-center">
      <div className="bg-white p-6 rounded w-[350px] md:w-[600px]">
        <h3 className="text-lg text-center font-bold mb-4">
          اضافه کردن قیمت و تاریخ تحویل
        </h3>

        {loading ? (
          <p className="text-center text-gray-500">در حال بارگذاری...</p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium">قیمت:</label>
              <input
                type="number"
                name="price"
                value={modalData.price || ""}
                onChange={handleModalChange}
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green"
                placeholder="قیمت را وارد کنید"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">قیمت دریافتی:</label>
              <input
                type="number"
                name="receive_price"
                value={modalData.receive_price}
                onChange={handleModalChange}
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green"
                placeholder="قیمت دریافتی را وارد کنید"
              />
            </div>

            <div className="mb-4 w-full flex items-center gap-x-5 justify-center">
              <label className="block mb-1 font-medium">تاریخ تحویل:</label>
              <DatePicker
                value={modalData.delivery_date}
                onChange={handleDateChange}
                calendar={persian}
                locale={persian_fa}
                inputClass="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green"
              />
            </div>

            <div className="flex justify-center pb-6 items-center gap-2">
              <button
                onClick={handleSubmit}
                className="bg-green text-white px-7 font-bold py-2 rounded hover:bg-green/90"
              >
                تایید
              </button>
              <button
                onClick={() => setShowPrice(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                انصراف
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
