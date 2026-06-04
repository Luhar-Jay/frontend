import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DataPoint { day: string; value: number }
interface Props { data: DataPoint[] }

const AttendanceLineChart = ({ data }: Props) => (
  <ResponsiveContainer width="100%" height={240}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
      <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px #0001" }} />
      <Line
        type="monotone"
        dataKey="value"
        stroke="#6366F1"
        strokeWidth={2.5}
        dot={{ r: 4, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

export default AttendanceLineChart;
