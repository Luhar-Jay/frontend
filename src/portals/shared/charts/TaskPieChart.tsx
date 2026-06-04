import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface PieSlice { name: string; value: number; color: string }

interface Props { data: PieSlice[] }

const TaskPieChart = ({ data }: Props) => (
  <>
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={3}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px #0001" }} />
      </PieChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {data.map((s) => (
        <span key={s.name} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
          {s.name}
          <span className="font-semibold text-gray-700">{s.value}</span>
        </span>
      ))}
    </div>
  </>
);

export default TaskPieChart;
