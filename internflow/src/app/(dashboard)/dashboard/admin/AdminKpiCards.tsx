"use client";

import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { TrendingUp, Users, Building2, CheckCircle } from "lucide-react";
import { Sparkline } from "@/components/ui/charts/Sparkline";

const kpiData = [
  { label: "Pending Approvals", value: 8, icon: <CheckCircle size={22} />, color: "var(--color-warning)", gradient: "var(--gradient-warm)" },
  { label: "Active Students", value: 2450, icon: <Users size={22} />, color: "var(--color-info)", gradient: "var(--gradient-accent)" },
  { label: "Companies", value: 24, icon: <Building2 size={22} />, color: "var(--color-primary)", gradient: "var(--gradient-primary)" },
  { label: "Placement Rate", value: 78, icon: <TrendingUp size={22} />, color: "var(--rathinam-green)", gradient: "var(--gradient-success)", suffix: "%" },
];

export function AdminKpiCards() {
  return (
    <div className="grid grid-4" style={{ marginBottom: "var(--space-6)" }}>
      {kpiData.map((kpi, idx) => (
        <div
          key={kpi.label}
          className="card"
          style={{
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
            animationDelay: `${idx * 80}ms`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "";
          }}
        >
          {/* Accent bar */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: kpi.gradient,
            borderRadius: "var(--border-radius-md) var(--border-radius-md) 0 0",
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px" }}>
            <div>
              <p style={{
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                marginBottom: "var(--space-2)",
              }}>
                {kpi.label}
              </p>
              <p style={{
                fontFamily: "var(--font-heading)",
                fontSize: "2rem",
                fontWeight: 700,
                color: kpi.color,
                lineHeight: 1,
              }}>
                <AnimatedCounter
                  value={kpi.value}
                  suffix={kpi.suffix || ""}
                  duration={1400}
                />
              </p>
            </div>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: "var(--border-radius-md)",
              background: `${kpi.color}14`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: kpi.color,
            }}>
              {kpi.icon}
            </div>
          </div>

          <div style={{ marginTop: "auto", position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 0 }}>
             <Sparkline 
               data={Array.from({ length: 12 }).map((_, i) => kpi.value * 0.5 + Math.sin(i * 0.8) * (kpi.value * 0.2) + Math.random() * (kpi.value * 0.1))} 
               color={kpi.color.replace("var(--color-warning)", "#f59e0b").replace("var(--color-info)", "#0ea5e9").replace("var(--color-primary)", "#6366f1").replace("var(--rathinam-green)", "#10b981")} 
               height={30} 
             />
          </div>
        </div>
      ))}
    </div>
  );
}
