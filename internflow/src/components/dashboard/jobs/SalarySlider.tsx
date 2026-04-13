"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function SalarySlider({ 
  min, max, value, onChange 
}: { 
  min: number, 
  max: number, 
  value: number, 
  onChange: (val: number) => void 
}) {
  const [isDragging, setIsDragging] = useState(false);

  // We map the slider value (which goes from 0 to 100) to actual salary range
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ width: "100%", padding: "var(--space-2) 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)", fontSize: "0.875rem", fontWeight: "bold" }}>
        <span>Min. Expected Salary</span>
        <span style={{ color: "var(--color-primary)" }}>₹{value.toLocaleString()} / mo</span>
      </div>
      
      <div style={{ position: "relative", height: "40px", display: "flex", alignItems: "center" }}>
        {/* Track Background */}
        <div style={{ position: "absolute", width: "100%", height: "8px", background: "var(--bg-hover)", borderRadius: "4px" }} />
        
        {/* Track Fill */}
        <motion.div 
          style={{ position: "absolute", height: "8px", background: "var(--gradient-primary)", borderRadius: "4px", width: `${percentage}%` }} 
          layout
        />
        
        {/* Input slider */}
        <input 
          type="range"
          min={min}
          max={max}
          step={1000}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            position: "absolute",
            width: "100%",
            opacity: 0,
            cursor: "pointer",
            height: "100%",
            zIndex: 10
          }}
        />

        {/* Custom Thumb handle */}
        <motion.div 
          animate={isDragging ? { scale: 1.2 } : { scale: 1 }}
          style={{
            position: "absolute",
            left: `calc(${percentage}% - 12px)`,
            width: "24px",
            height: "24px",
            background: "white",
            border: "2px solid var(--color-primary)",
            borderRadius: "50%",
            boxShadow: "var(--shadow-md)",
            pointerEvents: "none"
          }}
        >
          {isDragging && (
            <div style={{
              position: "absolute",
              top: "-36px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--color-text)",
              color: "var(--bg-primary)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              whiteSpace: "nowrap"
            }}>
              ₹{value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}
            </div>
          )}
        </motion.div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
        <span>₹{min >= 1000 ? (min/1000) + "k" : min}</span>
        <span>₹{max >= 1000 ? (max/1000) + "k" : max}+</span>
      </div>
    </div>
  );
}
