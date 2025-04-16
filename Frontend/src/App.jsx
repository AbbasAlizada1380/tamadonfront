import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout/Layout";
import Home from "./Pages/Home";
import Blog from "./Pages/Blog";
import "./App.css";
import About from "./Pages/About";
import Bill from "./Components/Bill_Page/Bill";
import Services from "./Pages/Services";
import Dashboard from "./Components/dashboard/dashboard";
import Loginpage from "./Components/loginpage/loginpage";
import NotFound from "./Pages/NotFound";
import ContactUs from "./Pages/ContactUs";
import BlogCardDetails from "./Components/Blog/BlogCardDetails";
import ForgotPassword from "./Components/loginpage/ForgotPassword";
import CreateNewPassword from "./Components/loginpage/CreateNewPassword";
import CategoryPage from "./Components/Blog/CategoryPage";
import ServiceDetails from "./Components/Services/ServiceDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogCardDetails />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          {/* New route */}
          <Route path="/service" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/about" element={<About />} />
        </Route>

        <Route path="*" element={<NotFound />} />
        <Route path="/bill" element={<Bill />} />
        <Route path="/dashboard" element={<Dashboard role="Designer" />} />
        <Route path="/login" element={<Loginpage />} />
        <Route path="/forgot-password/" element={<ForgotPassword />} />
        <Route path="/create-new-password/" element={<CreateNewPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
