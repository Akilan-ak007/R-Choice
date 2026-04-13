"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ShieldAlert, CheckCircle, Database, UserCheck, Key, Shield } from "lucide-react";

const generateMockLogs = () => [
  { id: 1, action: "System Auth Login", user: "dev@rathinam.edu", time: "Just now", type: "auth", status: "success", ip: "192.168.1.14" },
  { id: 2, action: "Company Registration Approved", user: "admin@rathinam.edu", time: "2m ago", type: "system", status: "success", target: "TechNova Solutions" },
  { id: 3, action: "Role Elevated: HOD", user: "sys.admin", time: "15m ago", type: "security", status: "warning", target: "saranya.cse" },
  { id: 4, action: "Failed MFA Challenge", user: "unknown", time: "1h ago", type: "auth", status: "danger", ip: "45.22.19.11" },
  { id: 5, action: "Bulk DB Export Triggered", user: "placement.head", time: "3h ago", type: "database", status: "warning", rows: 1240 },
];

export function AuditLogTypewriter() {
  const [logs, setLogs] = useState(generateMockLogs());
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [hoveredLog, setHoveredLog] = useState<number | null>(null);

  // Typewriter stagger effect sequence
  useEffect(() => {
    if (visibleIdx < logs.length) {
      const timer = setTimeout(() => {
        setVisibleIdx(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visibleIdx, logs.length]);

  const getIcon = (type: string, status: string) => {
    if (type === "auth" && status === "danger") return <ShieldAlert size={14} color="var(--color-danger)" />;
    if (type === "auth") return <Key size={14} color="var(--text-secondary)" />;
    if (type === "security") return <Shield size={14} color="var(--color-warning)" />;
    if (type === "database") return <Database size={14} color="var(--color-primary)" />;
    return <CheckCircle size={14} color="var(--color-success)" />;
  };

  return (
    <div className="card" style={{ padding: "0", overflow: "hidden", background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
      <div style={{ background: "var(--bg-primary)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
        <Terminal size={16} />
        <span style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "monospace" }}>Live Audit Stream</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)", animation: "deadlinePulse 2s infinite" }} />
        </div>
      </div>
      
      <div style={{ padding: "var(--space-2) 0", height: "300px", overflowY: "auto" }}>
        <AnimatePresence>
          {logs.slice(0, visibleIdx).map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              style={{ 
                padding: "10px 16px", 
                borderBottom: i === logs.length - 1 ? "none" : "1px solid rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
              onMouseEnter={() => setHoveredLog(log.id)}
              onMouseLeave={() => setHoveredLog(null)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ marginTop: "2px" }}>{getIcon(log.type, log.status)}</div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontFamily: "monospace", color: log.status === "danger" ? "var(--color-danger)" : "inherit" }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      by <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{log.user}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {log.time}
                </div>
              </div>

              {/* Gamified Tooltip Overlay on Hover (#38) */}
              <AnimatePresence>
                {hoveredLog === log.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={{
                      position: "absolute",
                      left: "32px",
                      top: "calc(100% - 4px)",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      boxShadow: "var(--shadow-md)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      zIndex: 50,
                      fontSize: "0.75rem",
                      minWidth: "200px"
                    }}
                  >
                    <div style={{ marginBottom: "4px", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Meta Data</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Type:</span>
                        <span>{log.type.toUpperCase()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>IP Trace:</span>
                        <span style={{ fontFamily: "monospace" }}>{log.ip || "10.0.0.x (Internal)"}</span>
                      </div>
                      {log.target && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Target:</span>
                          <span>{log.target}</span>
                        </div>
                      )}
                      {log.rows && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-secondary)" }}>Data Vol:</span>
                          <span>{log.rows} rows</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
