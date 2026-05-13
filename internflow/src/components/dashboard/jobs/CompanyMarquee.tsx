"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type MarqueeJob = {
  companyName?: string | null;
  companyId?: string | null;
};

export function CompanyMarquee({ jobs }: { jobs: MarqueeJob[] }) {
  // Extract unique companies from jobs
  const companies = Array.from(
    new Map(
      jobs
        .filter((job) => job.companyName)
        .map((job) => [job.companyName as string, { companyName: job.companyName as string, companyId: job.companyId || null }])
    ).values()
  );
  
  if (companies.length < 3) return null; // Make sure we have enough for a marquee

  // Duplicate for seamless loop
  const marqueeItems = [...companies, ...companies, ...companies];

  return (
    <div style={{ 
      overflow: "hidden", 
      padding: "var(--space-4) 0",
      marginBottom: "var(--space-6)",
      position: "relative",
      background: "linear-gradient(90deg, rgba(var(--bg-primary-rgb),1) 0%, rgba(var(--bg-primary-rgb),0) 10%, rgba(var(--bg-primary-rgb),0) 90%, rgba(var(--bg-primary-rgb),1) 100%)",
      maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
    }}>
      <p style={{ textAlign: "center", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
        Top Companies Hiring Now
      </p>
      
      <span style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
        Top companies hiring: {companies.map((company) => company.companyName).join(", ")}
      </span>
      
      <motion.div 
        aria-hidden="true"
        animate={{ x: ["0%", "-33.33%"] }}
        transition={{ ease: "linear", duration: 15 + companies.length, repeat: Infinity }}
        style={{ display: "flex", gap: "var(--space-8)", width: "max-content", alignItems: "center" }}
      >
        {marqueeItems.map((company, i) => {
          const content = (
            <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            padding: "8px 16px",
            background: "var(--bg-card)",
            borderRadius: "100px",
            border: "1px solid var(--border-color)",
            fontWeight: "bold",
            color: "var(--text-secondary)",
            boxShadow: "var(--shadow-sm)"
          }}>
            <div aria-hidden="true" style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.75rem" }}>
              {company.companyName.charAt(0)}
            </div>
            {company.companyName}
          </div>
          );

          return company.companyId ? (
            <Link key={`${company.companyName}-${i}`} href={`/companies/${company.companyId}`} style={{ textDecoration: "none" }}>
              {content}
            </Link>
          ) : (
            <div key={`${company.companyName}-${i}`}>{content}</div>
          );
        })}
      </motion.div>
    </div>
  );
}
