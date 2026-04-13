"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export interface TreemapData {
  label: string;
  value: number;
  color: string;
}

interface TreemapProps {
  data: TreemapData[];
  height?: number;
}

export function Treemap({ data, height = 160 }: TreemapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, item) => acc + item.value, 0) || 1;
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div
      style={{
        width: "100%",
        height,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, display: "flex", gap: "4px", minHeight: 0 }}>
        {/* Left: largest block */}
        {sortedData.length > 0 && (
          <motion.div
            style={{
              flex: sortedData[0].value,
              backgroundColor: sortedData[0].color,
              position: "relative",
              cursor: "pointer",
              borderRadius: "8px 0 0 8px",
              minWidth: 0,
              overflow: "hidden",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: hoveredIndex === 0 ? 0.98 : 1 }}
            transition={{ duration: 0.4 }}
            onMouseEnter={() => setHoveredIndex(0)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div style={{ padding: "var(--space-3)", color: "#fff", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.2 }}>{sortedData[0].label}</div>
              <div style={{ opacity: 0.8, fontSize: "0.875rem", marginTop: "4px" }}>
                {((sortedData[0].value / total) * 100).toFixed(1)}%
              </div>
              <div style={{ opacity: 0.6, fontSize: "0.75rem", marginTop: "2px" }}>
                {sortedData[0].value} students
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#000",
                opacity: hoveredIndex === 0 ? 0.1 : 0,
                transition: "opacity 0.2s",
              }}
            />
          </motion.div>
        )}

        {/* Right: stacked smaller blocks */}
        {sortedData.length > 1 && (
          <div
            style={{
              flex: total - sortedData[0].value,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: 0,
            }}
          >
            {sortedData.slice(1).map((item, i) => {
              const actualIndex = i + 1;
              const isHovered = hoveredIndex === actualIndex;
              const isLast = actualIndex === sortedData.length - 1;

              return (
                <motion.div
                  key={item.label}
                  style={{
                    flex: item.value,
                    backgroundColor: item.color,
                    position: "relative",
                    cursor: "pointer",
                    borderRadius: `0 ${actualIndex === 1 ? "8px" : "0"} ${isLast ? "8px" : "0"} 0`,
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, scale: isHovered ? 0.98 : 1 }}
                  transition={{ duration: 0.4, delay: actualIndex * 0.1 }}
                  onMouseEnter={() => setHoveredIndex(actualIndex)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      height: "100%",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.9375rem", whiteSpace: "nowrap" }}>{item.label}</span>
                    <span style={{ opacity: 0.8, fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                      {((item.value / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "#000",
                      opacity: isHovered ? 0.1 : 0,
                      transition: "opacity 0.2s",
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
