import React from "react";
import Hero from "../Components/Hero/Hero";
import WhyChooseUs from "../Components/WhyChooseUs";
import RecentlyBlogPost from "../Components/Blog/RecentlyBlogPost";
import OurCustomer from "../Components/OurCustomer";
import RecentlyServices from "../Components/Services/RecentlyServices";
import Category from "../Components/Categori/Category";
import ActiveCustomer from "../Components/About/ActiveCustomer";

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <Hero />

      <div className="container mx-auto">
        {/* Services Section */}
        <RecentlyServices />
        {/* Recently Post fromBlog */}
        <RecentlyBlogPost />
        {/* Our Customers */}
        <OurCustomer />

        <WhyChooseUs />
        <ActiveCustomer />
        <Category />
      </div>
    </div>
  );
};

export default Home;
