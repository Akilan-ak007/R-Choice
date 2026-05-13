"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { bulkExportDatabase } from "@/app/actions/admin";
import { exportToCSV } from "@/lib/export-utils";

export function ExportDataButton() {
  const [status, setStatus] = useState<"idle" | "preparing" | "generating" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (status !== "idle") return;
    
    setStatus("preparing");
    toast.info("Initializing massive bulk export...");
    
    try {
      // Simulate slight preparation delay for UI feedback
      await new Promise(r => setTimeout(r, 600));
      setStatus("generating");
      setProgress(50);
      
      const res = await bulkExportDatabase();
      if (res.error) {
        toast.error(res.error);
        setStatus("idle");
        setProgress(0);
        return;
      }
      setProgress(80);

      // Trigger standard web blob download for users
      if (res.payload?.users && res.payload.users.length > 0) {
        exportToCSV(`Platform_Users_Export_${new Date().toISOString().slice(0,10)}.csv`, res.payload.users);
      }
      
      setProgress(100);
      setStatus("done");
      toast.success("Export generated successfully!");
      
      // Reset after 3 seconds
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 3000);
      } catch {
      toast.error("Failed to generate export file.");
      setStatus("idle");
      setProgress(0);
    }
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
      onMouseEnter={(e) => { if (status==="idle") { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; } }}
      onMouseLeave={(e) => { if (status==="idle") { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; } }}
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
            {status === "generating" && `Generating Export (${progress}%)`}
            {status === "done" && "Download Ready"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: status === "done" ? "var(--color-success)" : "var(--text-secondary)" }}>
            {status === "idle" && "Download platform data as CSV exports"}
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
