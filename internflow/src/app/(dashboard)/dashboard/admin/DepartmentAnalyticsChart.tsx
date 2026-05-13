"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface DeptStat {
  department: string;
  totalStudents: number;
  approvedInternships: number;
  placementRate: number;
}

const COLORS = [
  "#0ea5e9", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6",
];

export function DepartmentAnalyticsChart({ data }: { data: DeptStat[] }) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--text-secondary)" }}>
        No department data available yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
          <XAxis
            dataKey="department"
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            angle={-25}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              fontSize: "0.85rem",
            }}
            formatter={(value, name) => {
              if (name === "placementRate") return [`${value}%`, "Placement Rate"];
              if (name === "approvedInternships") return [value, "Approved Internships"];
              if (name === "totalStudents") return [value, "Total Students"];
              return [value, String(name)];
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.8rem", paddingTop: "8px" }}
            formatter={(value: string) => {
              if (value === "totalStudents") return "Total Students";
              if (value === "approvedInternships") return "Approved Internships";
              if (value === "placementRate") return "Placement Rate (%)";
              return value;
            }}
          />
          <Bar dataKey="totalStudents" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((_entry, index) => (
              <Cell key={`cell-students-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.35} />
            ))}
          </Bar>
          <Bar dataKey="approvedInternships" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((_entry, index) => (
              <Cell key={`cell-approved-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
