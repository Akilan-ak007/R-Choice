"use client";

import { useState } from "react";
import { KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { changePassword } from "@/app/actions/auth";

export default function ChangePasswordForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    if (result.error) {
      setStatus("error");
      setMessage(result.error);
    } else {
      setStatus("success");
      setMessage("Password successfully updated.");
      e.currentTarget.reset();
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
      }, 3000);
    }
  }

  return (
    <div style={{ paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--border-color)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <KeyRound size={20} color="var(--text-secondary)" style={{ marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 500 }}>Change Password</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Update your account password.</div>
          </div>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Cancel" : "Update"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} style={{ marginTop: "var(--space-4)", padding: "var(--space-4)", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {status === "success" && (
            <div style={{ padding: "10px", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
              <CheckCircle size={16} /> {message}
            </div>
          )}
          {status === "error" && (
            <div style={{ padding: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
              <AlertCircle size={16} /> {message}
            </div>
          )}
          
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Current Password</label>
            <input type="password" name="currentPassword" required className="input" style={{ width: "100%", maxWidth: "300px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>New Password</label>
            <input type="password" name="newPassword" required className="input" style={{ width: "100%", maxWidth: "300px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Confirm New Password</label>
            <input type="password" name="confirmPassword" required className="input" style={{ width: "100%", maxWidth: "300px" }} />
          </div>
          
          <div style={{ marginTop: "var(--space-2)" }}>
            <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
              {status === "loading" ? "Updating..." : "Save Password"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
