"use client";

import { useState } from "react";
import { Link2, Copy, Check, RefreshCw, Clock } from "lucide-react";

const EXPIRY_OPTIONS = [
  { label: "1 Day", value: 1 },
  { label: "3 Days", value: 3 },
  { label: "7 Days", value: 7 },
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
];

export function GenerateLinkButton() {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    setLink(null);
    setExpiresAt(null);

    try {
      const res = await fetch("/api/mcr/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiryDays }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.link) {
        const fullLink = `${window.location.origin}${data.link}`;
        setLink(fullLink);
        // Calculate expiry date for display
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + (data.expiryDays || expiryDays));
        setExpiresAt(expDate.toLocaleDateString("en-IN", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }));
      }
    } catch {
      setError("Failed to generate link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      {/* Expiry Duration Selector */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: "var(--space-2)",
          }}
        >
          <Clock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
          Link Expiry Duration
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExpiryDays(opt.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: expiryDays === opt.value
                  ? "2px solid var(--rathinam-green)"
                  : "1px solid var(--border-color)",
                background: expiryDays === opt.value
                  ? "rgba(34, 197, 94, 0.1)"
                  : "var(--bg-secondary)",
                color: expiryDays === opt.value
                  ? "var(--rathinam-green)"
                  : "var(--text-secondary)",
                fontWeight: expiryDays === opt.value ? 700 : 500,
                fontSize: "0.8125rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="button"
        onClick={handleGenerate}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
        }}
      >
        {loading ? (
          <RefreshCw size={16} className="spin" />
        ) : (
          <Link2 size={16} />
        )}
        {loading ? "Generating…" : "Generate Company Registration Link"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-3)",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {link && (
        <div
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-4)",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-2)",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Registration Link
            </div>
            {expiresAt && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.75rem",
                  color: "var(--color-warning)",
                  fontWeight: 600,
                }}
              >
                <Clock size={12} />
                Expires: {expiresAt}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <input
              type="text"
              readOnly
              value={link}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-primary)",
                fontSize: "0.8125rem",
                fontFamily: "monospace",
              }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: copied
                  ? "rgba(34, 197, 94, 0.1)"
                  : "var(--bg-secondary)",
                color: copied ? "#22c55e" : "var(--text-primary)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div style={{
            marginTop: "var(--space-3)",
            padding: "8px 12px",
            background: "rgba(234, 179, 8, 0.06)",
            borderRadius: "6px",
            borderLeft: "3px solid var(--color-warning)",
          }}>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Share this link with the company to begin their onboarding
              registration. The link will automatically expire after <strong>{expiryDays} day{expiryDays !== 1 ? "s" : ""}</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
