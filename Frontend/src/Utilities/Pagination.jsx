import React from "react";

const Pagination = ({ currentPage, totalOrders, pageSize, onPageChange }) => {
  // console.log(totalOrders);

  const totalPages = totalOrders ? Math.ceil(totalOrders / pageSize) : 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pageButtons = [];
    const sidePages = 1;

    const shouldShowLeftEllipsis = currentPage > sidePages + 2;
    const shouldShowRightEllipsis = currentPage < totalPages - sidePages - 1;

    // Always show first page
    pageButtons.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={`px-3 py-1 rounded-md ${
          currentPage === 1
            ? "bg-blue-500 text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        1
      </button>
    );

    if (shouldShowLeftEllipsis) {
      pageButtons.push(<span key="left-ellipsis">...</span>);
    }

    // Middle page numbers
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? "bg-blue-500 text-white"
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

    // Always show last page
    if (totalPages > 1) {
      pageButtons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? "bg-blue-500 text-white"
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
    <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50"
      >
        « قبلی
      </button>

      {renderPageNumbers()}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50"
      >
        بعدی »
      </button>
    </div>
  );
};

export default Pagination;
