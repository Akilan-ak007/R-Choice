"use client";

import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { TrendingUp, Users, Building2, CheckCircle } from "lucide-react";

interface AdminKpiProps {
  pendingApprovals: number;
  activeStudents: number;
  totalCompanies: number;
  placementRate: number;
  slaBreaches: number;
}

export function AdminKpiCards({ pendingApprovals, activeStudents, totalCompanies, placementRate, slaBreaches }: AdminKpiProps) {
  const kpiData = [
    { label: "Pending Approvals", value: pendingApprovals, icon: <CheckCircle size={22} />, color: "var(--color-warning)", gradient: "var(--gradient-warm)" },
    { label: "SLA Breaches", value: slaBreaches, icon: <CheckCircle size={22} />, color: "#dc2626", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
    { label: "Active Students", value: activeStudents, icon: <Users size={22} />, color: "var(--color-info)", gradient: "var(--gradient-accent)" },
    { label: "Companies", value: totalCompanies, icon: <Building2 size={22} />, color: "var(--color-primary)", gradient: "var(--gradient-primary)" },
    { label: "Placement Rate", value: placementRate, icon: <TrendingUp size={22} />, color: "var(--rathinam-green)", gradient: "var(--gradient-success)", suffix: "%" },
  ];

  return (
    <div style={{ marginBottom: "var(--space-6)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
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
        </div>
      ))}
    </div>
  );
}
