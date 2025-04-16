import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Function to generate random colors
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, 0.6)`;
};

const DesignerChart = () => {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Users (Submitters)
        const usersResponse = await axios.get(`${BASE_URL}/users/api/users/`);
        const users = usersResponse.data;

        // Fetch Orders
        const ordersResponse = await axios.get(`${BASE_URL}/group/order/`);
        const orders = ordersResponse.data;

        // Process Orders and Map them to Designers
        const designerMap = {};

        orders.forEach((order) => {
          const designerId = order.designer;
          const designer = users.find((user) => user.id === designerId);

          if (designer) {
            const designerName = `${designer.first_name} ${designer.last_name}`;
            if (!designerMap[designerName]) {
              designerMap[designerName] = 0;
            }
            designerMap[designerName] += 1; // Counting number of orders per designer
          }
        });

        // Convert to an array for chart data
        const formattedData = Object.keys(designerMap).map((name) => ({
          name,
          amount: designerMap[name],
          color: getRandomColor(), // Assign a unique color
        }));

        setDesigners(formattedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Chart Data
  const chartData = {
    labels: designers.map((designer) => designer.name),
    datasets: [
      {
        label: "Number of Orders",
        data: designers.map((designer) => designer.amount),
        backgroundColor: designers.map((designer) => designer.color),
        borderColor: designers.map((designer) =>
          designer.color.replace("0.6", "1")
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) return <p>Loading data...</p>;

  return (
    <div
      className="p-2"
      style={{ width: "80%", height: "400px", margin: "auto" }}
    >
      <h2>Designer Orders</h2>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default DesignerChart;
