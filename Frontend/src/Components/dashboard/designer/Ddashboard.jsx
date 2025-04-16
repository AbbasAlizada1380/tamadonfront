import React, { useState } from 'react';

const ReportDashboard = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);

  // Example data for reports
  const reports = [
    { id: 1, date: '2023-10-01', name: 'Report 1', description: 'Monthly sales report' },
    { id: 2, date: '2023-10-15', name: 'Report 2', description: 'Mid-month inventory update' },
    { id: 3, date: '2023-11-05', name: 'Report 3', description: 'Weekly engagement statistics' },
    { id: 4, date: '2023-11-20', name: 'Report 4', description: 'Monthly revenue breakdown' },
  ];

  // Function to filter reports based on start and end dates
  const handleFilterReports = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtered = reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate >= start && reportDate <= end;
    });

    setFilteredReports(filtered);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">گزارشات</h2>

      <div className="mb-4">
        <label className="block mb-2 font-medium">تاریخ شروع</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium">تاریخ پایان</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
      </div>

      <button
        onClick={handleFilterReports}
        className="px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition"
      >
        فیلتر گزارشات
      </button>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">گزارشات فیلتر شده</h3>
        {filteredReports.length > 0 ? (
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b font-medium text-left">تاریخ</th>
                <th className="py-2 px-4 border-b font-medium text-left">نام گزارش</th>
                <th className="py-2 px-4 border-b font-medium text-left">توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{report.date}</td>
                  <td className="py-2 px-4 border-b">{report.name}</td>
                  <td className="py-2 px-4 border-b">{report.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">هیچ گزارشی برای تاریخ های انتخاب شده وجود ندارد.</p>
        )}
      </div>
    </div>
  );
};

export default ReportDashboard;
