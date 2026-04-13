import styles from "./Skeleton.module.css";
import { GraduationCap, Briefcase, FileCheck2, Zap } from "lucide-react";

type SkeletonVariant = "text" | "textShort" | "heading" | "card" | "circle" | "kpiCard" | "tableRow";

const variantMap: Record<SkeletonVariant, string> = {
  text: styles.skeletonText,
  textShort: styles.skeletonTextShort,
  heading: styles.skeletonHeading,
  card: styles.skeletonCard,
  circle: styles.skeletonCircle,
  kpiCard: styles.skeletonKpiCard,
  tableRow: styles.skeletonTableRow,
};

export function Skeleton({
  variant = "text",
  width,
  height,
  style,
  className,
  children,
}: {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`${variantMap[variant]} ${className || ""}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

export function SkeletonRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.skeletonRow}>{children}</div>;
}

// ── Generic Fallback ──
export function DashboardSkeleton() {
  return (
    <div className={styles.skeletonDashboard}>
      <div className={styles.skeletonKpiGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="kpiCard" />
        ))}
      </div>
      <Skeleton variant="heading" />
      <div className={styles.skeletonTable}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="tableRow" />
        ))}
      </div>
    </div>
  );
}

// ── Route-Specific Skeletons ──

export function AdminDashboardSkeleton() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Skeleton variant="heading" width="300px" height="32px" />
        <Skeleton variant="textShort" width="450px" style={{ marginTop: "8px" }} />
      </div>
      
      <div className={styles.skeletonKpiGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="kpiCard" />
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: "var(--space-6)" }}>
        <div>
          <Skeleton variant="heading" width="150px" height="24px" style={{ marginBottom: "var(--space-4)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" height="85px" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton variant="heading" width="180px" height="24px" style={{ marginBottom: "var(--space-4)" }} />
          <Skeleton variant="card" height="300px" style={{ padding: 0 }} />
        </div>
      </div>
    </div>
  );
}

export function StudentsDirectorySkeleton() {
  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
        <div>
          <Skeleton variant="heading" width="250px" height="32px" />
          <Skeleton variant="textShort" width="350px" style={{ marginTop: "8px" }} />
        </div>
        <Skeleton variant="card" width="320px" height="42px" style={{ borderRadius: "8px" }} />
      </div>
      <Skeleton variant="card" height="500px">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="tableRow" height="40px" />
          ))}
        </div>
      </Skeleton>
    </div>
  );
}

export function JobBoardSkeleton() {
  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
        <div>
          <Skeleton variant="heading" width="220px" height="32px" />
          <Skeleton variant="textShort" width="400px" style={{ marginTop: "8px" }} />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Skeleton variant="card" width="120px" height="42px" style={{ borderRadius: "100px" }} />
          <Skeleton variant="card" width="100px" height="42px" style={{ borderRadius: "100px" }} />
        </div>
      </div>

      <Skeleton variant="card" width="100%" height="80px" style={{ marginBottom: "var(--space-6)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "var(--space-6)" }}>
        <Skeleton variant="card" height="400px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" height="150px" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ApplicationsSkeleton() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <Skeleton variant="heading" width="250px" height="32px" />
        <Skeleton variant="card" width="180px" height="42px" style={{ borderRadius: "8px" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" height="200px" />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div>
      <Skeleton variant="heading" width="200px" height="32px" style={{ marginBottom: "var(--space-2)" }} />
      <Skeleton variant="textShort" width="350px" style={{ marginBottom: "var(--space-6)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-6)" }}>
        <div>
          <Skeleton variant="circle" width="150px" height="150px" style={{ margin: "0 auto var(--space-4)" }} />
          <Skeleton variant="text" width="100%" height="24px" style={{ marginBottom: "12px" }} />
          <Skeleton variant="text" width="80%" height="24px" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Skeleton variant="card" height="150px" />
          <Skeleton variant="card" height="250px" />
        </div>
      </div>
    </div>
  );
}

export function VCardSkeleton() {
  return (
    <div style={{ maxWidth: "1000px", margin: "calc(var(--space-8) * 2) auto", padding: "0 var(--space-4)" }}>
      <Skeleton variant="card" height="150px" style={{ marginBottom: "var(--space-6)" }} />
      
      <div className="grid grid-2" style={{ alignItems: "start", gap: "var(--space-6)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <Skeleton variant="card" height="250px" />
          <Skeleton variant="card" height="200px" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <Skeleton variant="card" height="220px" />
          <Skeleton variant="card" height="300px" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Skeleton variant="heading" width="200px" height="32px" />
        <Skeleton variant="textShort" width="300px" style={{ marginTop: "8px" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton variant="card" key={i} height="80px" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Skeleton variant="heading" width="220px" height="32px" />
        <Skeleton variant="textShort" width="350px" style={{ marginTop: "8px" }} />
      </div>
      <Skeleton variant="card" height="400px">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", padding: "var(--space-4)" }}>
          <div className="grid grid-2">
            <div>
              <Skeleton variant="textShort" width="100px" style={{ marginBottom: "8px" }} />
              <Skeleton variant="card" height="40px" style={{ border: "1px solid var(--border-color)" }} />
            </div>
            <div>
              <Skeleton variant="textShort" width="120px" style={{ marginBottom: "8px" }} />
              <Skeleton variant="card" height="40px" style={{ border: "1px solid var(--border-color)" }} />
            </div>
          </div>
          <div>
            <Skeleton variant="textShort" width="150px" style={{ marginBottom: "8px" }} />
            <Skeleton variant="card" height="120px" style={{ border: "1px solid var(--border-color)" }} />
          </div>
          <Skeleton variant="card" width="120px" height="40px" style={{ marginTop: "var(--space-4)" }} />
        </div>
      </Skeleton>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Skeleton variant="heading" width="240px" height="32px" />
      </div>
      <div className="grid grid-4" style={{ marginBottom: "var(--space-6)", gap: "var(--space-4)" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton variant="kpiCard" key={i} />
        ))}
      </div>
      <div className="grid grid-2" style={{ gap: "var(--space-6)" }}>
        <Skeleton variant="card" height="350px" />
        <Skeleton variant="card" height="350px" />
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Skeleton variant="heading" width="180px" height="32px" />
      </div>
      <div style={{ display: "flex", gap: "var(--space-8)" }}>
        <div style={{ width: "250px", flexShrink: 0 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton variant="text" key={i} height="32px" style={{ marginBottom: "var(--space-2)" }} />
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <Skeleton variant="card" height="500px" />
        </div>
      </div>
    </div>
  );
}
