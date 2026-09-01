import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Report } from "@/types";

interface Props {
  reports: Report[];
}

export default function AnalyticsDashboard({ reports }: Props) {

  const totalReports = reports.length;

  const priorityData = [
    { name: "High Priority", value: reports.filter(r => r.priority === "HIGH").length },
    { name: "Medium Priority", value: reports.filter(r => r.priority === "MEDIUM").length },
    { name: "Low Priority", value: reports.filter(r => r.priority === "LOW").length },
  ];

  const categoryMap: Record<string, number> = {};
  reports.forEach(r => {
    categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
  });

  const categoryData = Object.keys(categoryMap).map(key => ({
    name: key,
    value: categoryMap[key],
  }));

  const statusData = [
    { name: "Pending", value: reports.filter(r => r.status === "Pending").length },
    { name: "Completed", value: reports.filter(r => r.status === "Completed").length },
    { name: "Cancelled", value: reports.filter(r => r.status === "Cancelled").length },
  ];

  const COLORS = ["#ef4444", "#f59e0b", "#22c55e"];

  return (
    <div className="space-y-8">

      <div className="text-xl font-semibold">
        Total Reports: {totalReports}
      </div>

      <div>
        <h3 className="mb-2 font-medium">Priority Distribution (Urgency Level)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={priorityData} dataKey="value" outerRadius={80}>
              {priorityData.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Category Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={categoryData}>
            <defs>
              <linearGradient id="colorCategory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#888" />
            <XAxis dataKey="name" stroke="#555" />
            <YAxis stroke="#555" />
            <Tooltip />
            
            <Bar dataKey="value" fill="url(#colorCategory)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Status Overview</h3>
        <ResponsiveContainer width="100%" height={250}>
        <BarChart data={statusData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#888" />
          <XAxis dataKey="name" stroke="#555" />
          <YAxis stroke="#555" />
          <Tooltip />

          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {statusData.map((entry, index) => {
              let color = "#22c55e";

              if (entry.name === "Pending") color = "#facc15";
              if (entry.name === "Completed") color = "#22c55e";
              if (entry.name === "Cancelled") color = "#ef4444";

              return <Cell key={index} fill={color} />;
            })}
          </Bar>
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
