"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: "60vh",
      padding: "var(--space-6)",
      textAlign: "center"
    }}>
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "var(--space-4)"
      }}>
        <AlertCircle size={32} color="#ef4444" />
      </div>
      <h2 style={{ marginBottom: "var(--space-2)", fontSize: "1.5rem" }}>Something went wrong!</h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: "450px", marginBottom: "var(--space-6)" }}>
        We encountered an error while loading this page. This could be due to a temporary network issue or a missing resource.
      </p>
      
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button
          className="btn btn-primary"
          onClick={() => reset()}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <RefreshCcw size={16} /> Try again
        </button>
        <button
          className="btn btn-outline"
          onClick={() => window.location.href = '/'}
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
