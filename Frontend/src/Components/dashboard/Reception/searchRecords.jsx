import React, { useState, useEffect } from "react";
import { IoSearch } from "react-icons/io5";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const SearchBar = ({ setSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced Search - Delays API calls to prevent excessive requests
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]); // Clear results when input is empty
      }
    }, 500); // 500ms debounce time

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get(`${BASE_URL}/group/order/?search=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("خطا در جستجو:", error);
      alert("خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
    }
    setIsSearching(false);
  };

  return (
    <div className="mb-4 flex items-center justify-center">
      <div className="flex items-center justify-evenly border overflow-hidden max-w-md w-full">
        <input
          type="text"
          placeholder="کد سفارش را وارد کنید..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[80%] px-4 py-2 text-md text-gray-700 rounded-md placeholder-gray-500 focus:outline-none"
        />
        <button onClick={handleSearch} className="secondry-btn flex items-center justify-center">
          {isSearching ? (
            <span className="animate-spin border-t-2 border-white rounded-full w-4 h-4"></span>
          ) : (
            <IoSearch size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
