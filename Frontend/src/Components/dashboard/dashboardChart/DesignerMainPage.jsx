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
const secretKey = "TET4-1";

const decryptData = (hashedData) => {
  if (!hashedData) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

const DesignerMainPage = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const token = decryptData(localStorage.getItem("auth_token"));

        const todayRes = await axios.get(`${BASE_URL}/group/orders/today/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allRes = await axios.get(`${BASE_URL}/group/orders/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const todayCount = todayRes.data.count;
        const pastCount = allRes.data.count;
        const allCount = todayCount+ pastCount;

        const formattedData = [
          { name: "Past", count: pastCount },
          { name: "Today", count: todayCount },
        ];

        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching order data:", error);
      }
    };

    fetchOrderStats();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DesignerMainPage;
