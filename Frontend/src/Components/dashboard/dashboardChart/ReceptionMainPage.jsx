import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import CryptoJS from "crypto-js";
import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const secretKey = "TET4-1"; // Kept original key

// --- Keep original decryptData ---
const decryptData = (hashedData) => {
  if (!hashedData) {
    // console.error("No data to decrypt"); // Keep original comment behavior
    return null;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
const ReceptionMainPage = () => {
  const [chartData, setChartData] = useState();

  useEffect(() => {
    const fetchPendingData = async () => {
      try {
        const token = decryptData(localStorage.getItem("auth_token"));

        const response = await axios.get(
          `${BASE_URL}/group/group/orders/status_supper`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const formattedData = [
          {
            name: "wainting for price",
            waiting_for_price: response.data.count || 0,
          },
        ];

        setChartData(formattedData);
        console.log(response.data.count);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      }
    };

    fetchPendingData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="waiting_for_price" fill="#DD5066" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ReceptionMainPage;
