"use client";

import { useEffect, useState } from "react";
import { Video, X, Clock } from "lucide-react";

type InterviewAlert = {
  round: string;
  date: string;
  meetLink: string;
  companyName?: string;
  jobTitle?: string;
};

export default function InterviewPopup({ alerts }: { alerts: InterviewAlert[] }) {
  const [visible, setVisible] = useState<InterviewAlert | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      for (const alert of alerts) {
        const alertTime = new Date(alert.date);
        const diffMs = alertTime.getTime() - now.getTime();
        const diffMin = diffMs / (1000 * 60);

        // Show popup if interview is within 15 minutes
        if (diffMin > 0 && diffMin <= 15 && !dismissed.has(alert.date + alert.round)) {
          setVisible(alert);
          setNowMs(now.getTime());
          return;
        }
      }
    };

    checkAlerts();
    const interval = setInterval(() => {
      setNowMs(Date.now());
      checkAlerts();
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [alerts, dismissed]);

  if (!visible) return null;

  const dismiss = () => {
    setDismissed(prev => new Set(prev).add(visible.date + visible.round));
    setVisible(null);
  };

  const minutesUntil = Math.max(0, Math.floor((new Date(visible.date).getTime() - nowMs) / 60000));

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      width: "380px",
      background: "var(--card-bg)",
      borderRadius: "16px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      border: "2px solid var(--primary-color)",
      zIndex: 9999,
      animation: "slideUp 0.4s ease",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
          <Video size={20} />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Interview Starting Soon!</span>
        </div>
        <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "18px" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "1rem" }}>{visible.round}</p>
          {visible.jobTitle && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{visible.jobTitle}</p>}
          {visible.companyName && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>{visible.companyName}</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 600, fontSize: "0.85rem", marginBottom: "14px" }}>
          <Clock size={16} />
          Starts in {minutesUntil} minute{minutesUntil !== 1 ? "s" : ""}
        </div>

        <a
          href={visible.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
        >
          <Video size={18} /> Join Now
        </a>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
