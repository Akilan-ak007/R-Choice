"use client";

import { Inbox, Search, FileX, Users, Briefcase } from "lucide-react";

type EmptyStateVariant = "default" | "search" | "noData" | "noUsers" | "noJobs";

const VARIANTS: Record<EmptyStateVariant, {
  icon: React.ReactNode;
  title: string;
  description: string;
}> = {
  default: {
    icon: <Inbox size={48} />,
    title: "Nothing here yet",
    description: "Content will appear here once data is available.",
  },
  search: {
    icon: <Search size={48} />,
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
  },
  noData: {
    icon: <FileX size={48} />,
    title: "No data available",
    description: "There are no records to display at this time.",
  },
  noUsers: {
    icon: <Users size={48} />,
    title: "No users found",
    description: "There are no users matching your current filters.",
  },
  noJobs: {
    icon: <Briefcase size={48} />,
    title: "No openings right now",
    description: "Check back later for new internship opportunities!",
  },
};

export function EmptyState({
  variant = "default",
  title,
  description,
  action,
}: {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const config = VARIANTS[variant];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-16) var(--space-6)",
      textAlign: "center",
      gap: "var(--space-4)",
    }}>
      <div style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        background: "var(--skeleton-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        marginBottom: "var(--space-2)",
        animation: "float 3s ease-in-out infinite",
      }}>
        {config.icon}
      </div>

      <h3 style={{
        fontFamily: "var(--font-heading)",
        fontSize: "1.25rem",
        fontWeight: 600,
        color: "var(--text-primary)",
        margin: 0,
      }}>
        {title || config.title}
      </h3>

      <p style={{
        fontSize: "0.875rem",
        color: "var(--text-muted)",
        maxWidth: 360,
        lineHeight: 1.6,
        margin: 0,
      }}>
        {description || config.description}
      </p>

      {action && (
        <div style={{ marginTop: "var(--space-3)" }}>
          {action}
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
