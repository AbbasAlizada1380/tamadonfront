import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const colors = ["#8884d8", "#82ca9d", "#FFBB28", "#FF8042", "#AF19FF"];

const chartData = [
  { name: "Completed", value: 40 },
  { name: "Processing", value: 25 },
  { name: "Taken", value: 15 },
  { name: "Pending", value: 10 },
  { name: "Delivered", value: 10 },
];

const SuperDesignerMainPage = () => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SuperDesignerMainPage;
