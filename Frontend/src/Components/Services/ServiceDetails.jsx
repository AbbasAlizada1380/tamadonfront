import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ServicesSubCard from "./ServicesSubCard";
const BASE_URL = import.meta.env.VITE_BASE_URL
import { IoMdArrowBack } from "react-icons/io";;
import { Link } from "react-router-dom";

function ServiceDetails() {
  const { id } = useParams(); // دریافت id دسته‌بندی از URL
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        // درخواست اول: دریافت اطلاعات دسته‌بندی
        const categoryResponse = await axios.get(
          `${BASE_URL}/common/categories/${id}/`
        );
        setCategory(categoryResponse.data);

        // درخواست دوم: دریافت لیست همه زیرمجموعه‌ها
        const subcategoriesResponse = await axios.get(
          `${BASE_URL}/common/subcategory/`
        );

        // فیلتر کردن زیرمجموعه‌ها براساس category.id
        const filteredSubcategories = subcategoriesResponse.data.filter(
          (sub) => sub.category === parseInt(id)
        );

        setSubcategories(filteredSubcategories);
      } catch (err) {
        setError("خطا در بارگیری جزئیات دسته‌بندی");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryDetails();
  }, [id]);

  if (loading)
    return <div className="text-center mt-10">در حال بارگذاری...</div>;
  if (error)
    return <div className="text-center text-red-500 mt-10">{error}</div>;

  return (
    <section className="max-w-7xl  mx-auto container  px-5 lg:px-10 py-10">
      {/* عنوان و توضیحات دسته‌بندی */}
      <div className=" text-center lg:text-start mb-8">
       
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {category.name}
        </h1>
        <p className="text-lg rt text-gray-600 text-justify dark:text-gray-300 mt-2">
          {category.description}
        </p>
      </div>

      {/* نمایش زیرمجموعه‌های این دسته‌بندی */}
      <div className="w-full flex justify-center  items-center"> 
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-10 ">
          {subcategories.length > 0 ? (
            subcategories.map((sub) => (
              <ServicesSubCard key={sub.id} sub={sub} />
            ))
          ) : (
            <p className="text-center col-span-full text-gray-500 dark:text-gray-100">
              هیچ زیرمجموعه‌ای برای این دسته‌بندی یافت نشد.
            </p>
          )}
        </div>
      </div>
     <div className="w-full flex justify-center items-center py-5">
     <Link to='/service' className="flex items-center gap-x-4 primary-btn">
     محصولات<span><IoMdArrowBack /></span></Link>
     </div>
    </section>
  );
}

export default ServiceDetails;
