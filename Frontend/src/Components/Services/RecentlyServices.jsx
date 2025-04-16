import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ServicesCard from "./ServicesCard";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const RecentlyServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/common/categories/`);
    

        if (Array.isArray(response.data)) {
          const sortedServices = response.data
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10); // Show the latest 10 services
          setServices(sortedServices);
        } else {
          setError("Unexpected response format");
        
        }
      } catch (error) {
        setError("بارگیری خدمات ناموفق بود");
        console.error("خطا در دریافت خدمات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">در حال بارگذاری...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <section className="container mx-auto px-10 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-Ray_black text-gray-900 dark:text-gray-100">
          محصولات ما
        </h1>
        <Link to="/service">
          <button className="primary-btn">دیدن بیشتر!</button>
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-100">
          هیچ محصولی وجود ندارد.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          {services.map((service, index) => (
            <div
              key={service.id}
              onClick={() => navigate(`/services/${service.id}`)}
              className="cursor-pointer"
            >
              <ServicesCard
                service={service}
               // Custom height for some cards
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentlyServices;
