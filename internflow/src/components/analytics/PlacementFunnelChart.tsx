"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

type FunnelStage = {
  stage: string;
  count: number;
  color: string;
};

const STAGE_COLORS = [
  "#6366f1", // Applied - Indigo
  "#f59e0b", // Shortlisted - Amber
  "#3b82f6", // Interviewing - Blue
  "#22c55e", // Offered/Selected - Green
];

export function PlacementFunnelChart({ data }: { data: FunnelStage[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card" style={{ padding: "var(--space-5)" }}>
      <h2 style={{ marginBottom: 4, fontSize: "1.05rem" }}>
        Placement Funnel
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.8125rem",
          marginBottom: "var(--space-4)",
        }}
      >
        Unique student progression through the hiring pipeline
      </p>

      {data.every((d) => d.count === 0) ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-8)",
            color: "var(--text-muted)",
          }}
        >
          No placement data available yet.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide domain={[0, maxCount * 1.15]} />
              <YAxis
                type="category"
                dataKey="stage"
                width={110}
                tick={{
                  fill: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={((value: unknown) => {
                  const numValue = Number(value);
                  const pct =
                    maxCount > 0
                      ? ((numValue / maxCount) * 100).toFixed(1)
                      : "0";
                  return [`${numValue} students (${pct}% of total)`];
                }) as never}
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow-md)",
                  fontSize: "0.875rem",
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 8, 8, 0]}
                barSize={36}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.stage} fill={entry.color || STAGE_COLORS[index % STAGE_COLORS.length]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{
                    fill: "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Conversion rates */}
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              marginTop: "var(--space-4)",
              justifyContent: "center",
            }}
          >
            {data.slice(0, -1).map((stage, i) => {
              const next = data[i + 1];
              const rate =
                stage.count > 0
                  ? ((next.count / stage.count) * 100).toFixed(1)
                  : "0";
              return (
                <div
                  key={stage.stage}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 12,
                    background: `${next.color}12`,
                    border: `1px solid ${next.color}30`,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: next.color,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {stage.stage} → {next.stage}:{" "}
                  <strong>{rate}%</strong>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
