"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export function GitHubHeatmap({ username }: { username: string }) {
  // Generate random data to mock a contribution graph
  // In a real scenario, this would be fetched from GitHub GraphQL API
  const weeks = 52;
  const daysPerWeek = 7;
  
  const heatmapData = useMemo(() => {
    const data = [];
    let d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    
    // Create an array of 52 weeks, each with 7 days
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let day = 0; day < daysPerWeek; day++) {
        // Randomly assign a "level" of contribution (0-4)
        // Weight heavily towards 0 and 1
        const r = Math.random();
        let level = 0;
        if (r > 0.6) level = 1;
        if (r > 0.8) level = 2;
        if (r > 0.9) level = 3;
        if (r > 0.96) level = 4;
        
        week.push({
          date: new Date(d),
          level
        });
        d.setDate(d.getDate() + 1);
      }
      data.push(week);
    }
    return data;
  }, []);

  // GitHub contribution colors
  const getColor = (level: number) => {
    switch (level) {
      case 1: return "var(--github-level-1, #9be9a8)";
      case 2: return "var(--github-level-2, #40c463)";
      case 3: return "var(--github-level-3, #30a14e)";
      case 4: return "var(--github-level-4, #216e39)";
      default: return "var(--github-level-0, #ebedf0)";
    }
  };

  return (
    <div className="card" style={{ marginTop: "var(--space-6)", overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h3 style={{ fontSize: "1rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          GitHub Contributions
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>
            @{username}
          </span>
        </h3>
        <span title="This is a mock heatmap displaying simulated contribution data." style={{ color: "var(--text-muted)", cursor: "help" }}>
          <HelpCircle size={14} />
        </span>
      </div>

      <div style={{ display: "flex", gap: "3px", minWidth: "max-content", padding: "4px" }}>
        {heatmapData.map((week, wIdx) => (
          <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {week.map((day, dIdx) => (
              <motion.div
                key={dIdx}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: (wIdx * 7 + dIdx) * 0.002, duration: 0.2 }}
                title={`${day.level} contributions on ${day.date.toLocaleDateString()}`}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  backgroundColor: getColor(day.level),
                  cursor: "pointer",
                  transition: "transform var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.2)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px", marginTop: "var(--space-3)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        Less
        <div style={{ width: 10, height: 10, background: getColor(0), borderRadius: 2 }} />
        <div style={{ width: 10, height: 10, background: getColor(1), borderRadius: 2 }} />
        <div style={{ width: 10, height: 10, background: getColor(2), borderRadius: 2 }} />
        <div style={{ width: 10, height: 10, background: getColor(3), borderRadius: 2 }} />
        <div style={{ width: 10, height: 10, background: getColor(4), borderRadius: 2 }} />
        More
      </div>
    </div>
  );
}
