"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export interface DonutDataItem {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataItem[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
}

export function DonutChart({
  data,
  size = 200,
  strokeWidth = 24,
  gap = 2,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const viewBoxSize = 100;
  const center = viewBoxSize / 2;
  // Scale the stroke width from pixel space into viewBox space
  const svgStrokeWidth = (strokeWidth / size) * viewBoxSize;
  const radius = (viewBoxSize - svgStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = data.reduce((acc, item) => acc + item.value, 0) || 1;

  // Calculate segment arc lengths
  const gapLength = (gap / 360) * circumference;
  let cumulativeOffset = 0;

  const segments = data.map((item, index) => {
    const fraction = item.value / total;
    const arcLength = fraction * circumference;
    const adjustedArc = Math.max(0, arcLength - gapLength);
    const dashArray = `${adjustedArc} ${circumference - adjustedArc}`;
    // SVG dashoffset: rotate the segment into place
    const dashOffset = -cumulativeOffset;

    cumulativeOffset += arcLength;

    return {
      ...item,
      dashArray,
      dashOffset,
      arcLength: adjustedArc,
      index,
    };
  });

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-color, #e5e7eb)"
          strokeWidth={svgStrokeWidth}
          opacity={0.3}
        />

        {segments.map((segment) => {
          if (segment.value === 0) return null;
          const isHovered = hoveredIndex === segment.index;

          return (
            <motion.circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={isHovered ? svgStrokeWidth + 1.5 : svgStrokeWidth}
              strokeDasharray={segment.dashArray}
              strokeLinecap="butt"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: segment.dashOffset }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
                delay: segment.index * 0.12,
              }}
              onMouseEnter={() => setHoveredIndex(segment.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                cursor: "pointer",
                filter: isHovered ? `drop-shadow(0 0 6px ${segment.color}88)` : "none",
              }}
            />
          );
        })}
      </svg>

      {/* Center Statistic */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {hoveredIndex !== null ? (
            <>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: data[hoveredIndex].color, lineHeight: 1 }}>
                {data[hoveredIndex].value}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {data[hoveredIndex].label}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Total
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
