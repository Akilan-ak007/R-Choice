"use client";

import { motion } from "framer-motion";

interface LiquidGaugeProps {
  value: number; // 0 to 100
  title?: string;
  size?: number;
  color?: string;
}

export function LiquidGauge({
  value,
  title = "Completion",
  size = 180,
  color = "#6366f1"
}: LiquidGaugeProps) {
  // Translate value (0-100) to height pixel coordinate (SVG is 100x100)
  // Higher value -> lower Y coordinate for the wave
  const waveHeight = 100 - value;

  // Seamless SVG sine wave path
  const wavePath = "M 0 50 Q 25 35 50 50 T 100 50 T 150 50 T 200 50 L 200 200 L 0 200 Z";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>
      <div 
        style={{ 
          position: "relative", 
          width: size, 
          height: size, 
          borderRadius: "50%", 
          overflow: "hidden",
          border: `4px solid ${color}33`,
          backgroundColor: `${color}11`,
          boxShadow: `inset 0px 4px 12px ${color}33, 0 0 20px ${color}22`
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: 0, left: 0 }}
        >
          {/* Back Wave */}
          <motion.path
            d={wavePath}
            fill={color}
            opacity={0.3}
            animate={{
              x: [-100, 0],
              y: [100, waveHeight, waveHeight] // animate from bottom to fill level
            }}
            transition={{
              x: { repeat: Infinity, duration: 4, ease: "linear" },
              y: { duration: 2, ease: "easeOut" }
            }}
          />

          {/* Front Wave (moves faster and offset) */}
          <motion.path
            d={wavePath}
            fill={color}
            opacity={0.7}
            animate={{
              x: [0, -100],
              y: [100, waveHeight, waveHeight] // animate from bottom to fill level
            }}
            transition={{
              x: { repeat: Infinity, duration: 3, ease: "linear" },
              y: { duration: 2.2, ease: "easeOut", delay: 0.1 }
            }}
          />
        </svg>

        {/* Center Text overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: value > 50 ? "#fff" : "var(--foreground)", // dynamically change color based on fill
          textShadow: value > 50 ? "0px 2px 4px rgba(0,0,0,0.5)" : "none",
          transition: "color 1s ease"
        }}>
          <motion.span 
            style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 1 }}
          >
            {Math.round(value)}%
          </motion.span>
        </div>
      </div>
      
      {title && (
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>
          {title}
        </span>
      )}
    </div>
  );
}
