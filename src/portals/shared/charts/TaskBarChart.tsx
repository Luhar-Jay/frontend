import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface DataPoint { name: string; value: number }
interface Props { data: DataPoint[] }

const TaskBarChart = ({ data }: Props) => (
  <ResponsiveContainer width="100%" height={190}>
    <BarChart data={data} barSize={24}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
      <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px #0001" }} />
      <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default TaskBarChart;
