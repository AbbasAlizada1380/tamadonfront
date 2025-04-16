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

const ReceptionMainPage = ({ chartData }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="completed" fill="#8884d8" />
        <Bar dataKey="processing" fill="#82ca9d" />
        <Bar dataKey="taken" fill="#FFBB28" />
        <Bar dataKey="pending" fill="#FF8042" />
        <Bar dataKey="delivered" fill="#AF19FF" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ReceptionMainPage;
