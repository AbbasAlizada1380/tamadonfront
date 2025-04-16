import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);
const BASE_URL = import.meta.env.VITE_BASE_URL;

const PieGraph = () => {
  // State for orders
  const [processingList, setProcessingList] = useState([]);
  const [takenList, setTakenList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [doneList, setDoneList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetching functions
  const getProcessingList = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/order/processing/`);
      setProcessingList(response.data);
    } catch (err) {
      console.error("Error fetching processing list:", err);
    }
  };

  const getDoneList = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/order/done/`);
      setDoneList(response.data);
    } catch (err) {
      console.log("Error fetching done orders:", err);
    }
  };

  const getPendingList = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/order/pending/`);
      setPendingList(response.data);
    } catch (err) {
      console.log("Error fetching pending orders:", err);
    }
  };

  const getTakenList = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/group/order/taken/`);
      setTakenList(response.data);
    } catch (err) {
      console.log("Error fetching taken orders:", err);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([getPendingList(), getProcessingList(), getDoneList(), getTakenList()]);
        setError(null);
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update chart data whenever lists update
  const [chartData, setChartData] = useState({
    labels: ["ثبت شده", "منتطر چاپخانه", "در حال کار", "تکمیل"],
    datasets: [
      {
        label: "گزارش فعلی",
        data: [0, 0, 0, 0], // Default values before API call
        backgroundColor: [
          "rgba(54, 12, 25, 6)",  // Blue - Pending
          "rgba(255, 106, 86, 0.6)",  // Yellow - Taken
          "rgba(75, 192, 12, 0.6)",  // Green - Processing
          "rgba(153, 102, 25, 0.6)", // Purple - Done
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    setChartData({
      labels: ["ثبت شده", "منتطر چاپخانه", "در حال کار", "تکمیل"],
      datasets: [
        {
          label: "گزارش فعلی",
          data: [pendingList.length, takenList.length, processingList.length, doneList.length],
          backgroundColor: [
            "rgba(170, 0, 0,0.9)",   // Red  
            "rgba(255, 255, 0, 0.6)",  // Yellow  
            "rgba(0, 70, 350, 1)",   // Blue  
            "rgba(0, 100, 30, 1)",   // Green
          ],
          borderColor: [
            "rgba(170, 0, 0,0.9)",   // Red  
            "rgba(255, 255, 0, 0.6)",  // Yellow  
            "rgba(0, 70, 350, 1)",   // Blue  
            "rgba(0, 100, 30, 1)",   // Green
          ],
          borderWidth: 1,
        },
      ],
    });
  }, [pendingList, takenList, processingList, doneList]); // Update when data changes

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: true, text: "گزارش " },
    },
  };

  return (
    <div className="w-2/3 mx-auto mt-8 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-center">گزارش فعلی به اساس گراف دایره‌یی</h2>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <Pie data={chartData} options={options} />
      )}
    </div>
  );
};

export default PieGraph;
