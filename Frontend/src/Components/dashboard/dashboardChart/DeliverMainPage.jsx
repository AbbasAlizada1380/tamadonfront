import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  {
    name: "حمل",
    completed: 40,
    processing: 70,
    taken: 100,
    pending: 100,
    delivered: 70,
  },
  {
    name: "ثور",
    completed: 50,
    processing: 40,
    taken: 30,
    pending: 20,
    delivered: 60,
  },
  {
    name: "جوزا",
    completed: 60,
    processing: 50,
    taken: 40,
    pending: 30,
    delivered: 70,
  },
  {
    name: "سرطان",
    completed: 70,
    processing: 60,
    taken: 50,
    pending: 40,
    delivered: 30,
  },
  {
    name: "اسد",
    completed: 80,
    processing: 70,
    taken: 60,
    pending: 50,
    delivered: 90,
  },
  {
    name: "سنبله",
    completed: 90,
    processing: 110,
    taken: 70,
    pending: 60,
    delivered: 10,
  },
];

const DeliverMainPage = () => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="completed"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="processing"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="taken"
          stroke="#FFBB28"
          fill="#FFBB28"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="pending"
          stroke="#FF8042"
          fill="#FF8042"
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="delivered"
          stroke="#AF19FF"
          fill="#AF19FF"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default DeliverMainPage;
