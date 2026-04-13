"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export function ExportDataButton() {
  const [status, setStatus] = useState<"idle" | "preparing" | "generating" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const handleExport = () => {
    if (status !== "idle") return;
    
    setStatus("preparing");
    toast.info("Initializing massive bulk export...");
    
    // Simulate preparation
    setTimeout(() => {
      setStatus("generating");
      
      // Simulate progress
      let p = 0;
      const interval = setInterval(() => {
        p += Math.floor(Math.random() * 15) + 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setStatus("done");
          toast.success("Export generated successfully!");
          
          // Reset after 3 seconds
          setTimeout(() => {
            setStatus("idle");
            setProgress(0);
          }, 3000);
        }
        setProgress(p);
      }, 300);
    }, 1500);
  };

  return (
    <div 
      className="card" 
      onClick={handleExport}
      style={{ 
        cursor: status === "idle" ? "pointer" : "default", 
        transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e: any) => { if (status==="idle") { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; } }}
      onMouseLeave={(e: any) => { if (status==="idle") { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; } }}
    >
      {/* Progress Background */}
      <AnimatePresence>
        {status === "generating" && (
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
            style={{ position: "absolute", top: 0, left: 0, bottom: 0, background: "rgba(34, 197, 94, 0.1)", zIndex: 0 }} 
          />
        )}
      </AnimatePresence>

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            {status === "idle" && "Export Data"}
            {status === "preparing" && "Compressing Database..."}
            {status === "generating" && `Generating Excel (${progress}%)`}
            {status === "done" && "Download Ready"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: status === "done" ? "var(--color-success)" : "var(--text-secondary)" }}>
            {status === "idle" && "Download reports as Excel sheets"}
            {status === "preparing" && "Gathering metadata mapping"}
            {status === "generating" && "Compiling thousands of records"}
            {status === "done" && "Clicking will start download"}
          </p>
        </div>
        
        <div style={{ color: "var(--text-muted)" }}>
          {status === "idle" && <FileSpreadsheet size={24} />}
          {status === "preparing" && <Loader2 size={24} className="spin" color="var(--color-primary)" />}
          {status === "generating" && <Download size={24} color="var(--color-warning)" />}
          {status === "done" && <CheckCircle2 size={24} color="var(--color-success)" />}
        </div>
      </div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
