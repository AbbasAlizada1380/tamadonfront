import React, { useState } from "react";

const Pagination = ({ currentPage, totalOrders, pageSize, onPageChange }) => {
  const [inputPage, setInputPage] = useState("");

  const totalPages = totalOrders ? Math.ceil(totalOrders / pageSize) : 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    const targetPage = parseInt(inputPage);
    if (!isNaN(targetPage)) {
      handlePageChange(targetPage);
    }
    setInputPage("");
  };

  const renderPageNumbers = () => {
    const pageButtons = [];
    const sidePages = 1;

    const shouldShowLeftEllipsis = currentPage > sidePages + 2;
    const shouldShowRightEllipsis = currentPage < totalPages - sidePages - 1;

    // First page
    pageButtons.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={`px-3 py-1 rounded-md ${
          currentPage === 1
            ? "bg-green text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        1
      </button>
    );

    if (shouldShowLeftEllipsis) {
      pageButtons.push(<span key="left-ellipsis">...</span>);
    }

    // Middle pages
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? "bg-green text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    if (shouldShowRightEllipsis) {
      pageButtons.push(<span key="right-ellipsis">...</span>);
    }

    // Last page
    if (totalPages > 1) {
      pageButtons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? "bg-green text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pageButtons;
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="flex justify-center items-center gap-2 flex-wrap">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-300 rounded-md hover:bg-green disabled:opacity-50"
        >
          « قبلی
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-300 rounded-md hover:bg-green disabled:opacity-50"
        >
          بعدی »
        </button>
      </div>

      <form
        onSubmit={handleInputSubmit}
        className="flex items-center gap-2 mt-2"
      >
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          placeholder="جستجوی صفحه..."
          className="w-48 px-2 py-1 border border-gray-300 rounded-md"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-green text-white rounded-md"
        >
          جستجو
        </button>
      </form>
    </div>
  );
};

export default Pagination;
