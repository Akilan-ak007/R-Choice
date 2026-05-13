"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { updateApplicantStatusFromKanban } from "@/app/actions/kanban";
import { ArrowLeft, GripVertical, Mail, User } from "lucide-react";
import Link from "next/link";

type Applicant = {
  applicationId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  appliedAt: string | null;
  department: string | null;
  course: string | null;
};

type KanbanColumn = {
  id: string;
  label: string;
  color: string;
  gradient: string;
};

const COLUMNS: KanbanColumn[] = [
  { id: "applied", label: "Applied", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #4f46e5)" },
  { id: "shortlisted", label: "Shortlisted", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { id: "round_scheduled", label: "Interviewing", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6, #2563eb)" },
  { id: "selected", label: "Selected", color: "#22c55e", gradient: "linear-gradient(135deg, #22c55e, #16a34a)" },
  { id: "rejected", label: "Rejected", color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
];

function DroppableColumn({
  column,
  children,
  count,
}: {
  column: KanbanColumn;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: "1 1 0",
        minWidth: 240,
        maxWidth: 320,
        display: "flex",
        flexDirection: "column",
        borderRadius: "var(--border-radius-lg)",
        background: isOver ? `${column.color}08` : "var(--bg-card)",
        border: isOver
          ? `2px dashed ${column.color}`
          : "1px solid var(--border-color)",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: column.gradient,
              boxShadow: `0 0 8px ${column.color}40`,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
            {column.label}
          </span>
        </div>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: column.color,
            background: `${column.color}14`,
            padding: "2px 10px",
            borderRadius: 999,
          }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 120,
          overflowY: "auto",
          maxHeight: "calc(100vh - 280px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DraggableCard({
  applicant,
  isDragging,
}: {
  applicant: Applicant;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: applicant.applicationId,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    padding: "12px",
    borderRadius: "var(--border-radius-md)",
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    cursor: "grab",
    boxShadow: "var(--shadow-xs)",
    transition: "box-shadow 0.15s ease, opacity 0.15s ease",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <GripVertical
          size={14}
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--gradient-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "0.75rem",
            flexShrink: 0,
          }}
        >
          {applicant.avatarUrl ? (
            <img
              src={applicant.avatarUrl}
              alt=""
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            (applicant.firstName?.[0] || "?").toUpperCase()
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.8125rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {applicant.firstName} {applicant.lastName}
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Mail size={10} />
            {applicant.email}
          </div>
        </div>
      </div>
      {(applicant.department || applicant.course) && (
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {applicant.department && (
            <span
              style={{
                fontSize: "0.6875rem",
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(30, 155, 215, 0.08)",
                color: "#1578A8",
                fontWeight: 600,
              }}
            >
              {applicant.department}
            </span>
          )}
          {applicant.course && (
            <span
              style={{
                fontSize: "0.6875rem",
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(141, 198, 63, 0.1)",
                color: "#5F9A1E",
                fontWeight: 600,
              }}
            >
              {applicant.course}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function OverlayCard({ applicant }: { applicant: Applicant }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "var(--border-radius-md)",
        background: "var(--bg-card)",
        border: "2px solid var(--color-primary)",
        cursor: "grabbing",
        boxShadow: "var(--shadow-lg)",
        width: 280,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--gradient-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "0.75rem",
          }}
        >
          {(applicant.firstName?.[0] || "?").toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
            {applicant.firstName} {applicant.lastName}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {applicant.email}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoardClient({
  jobId,
  jobTitle,
  applicants: initialApplicants,
}: {
  jobId: string;
  jobTitle: string;
  applicants: Applicant[];
}) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const applicationId = String(active.id);
      const newStatus = String(over.id);

      const applicant = applicants.find(
        (a) => a.applicationId === applicationId
      );
      if (!applicant || applicant.status === newStatus) return;

      // Optimistic update
      setApplicants((prev) =>
        prev.map((a) =>
          a.applicationId === applicationId ? { ...a, status: newStatus } : a
        )
      );

      const result = await updateApplicantStatusFromKanban(
        applicationId,
        newStatus
      );

      if (result.error) {
        // Revert on failure
        setApplicants((prev) =>
          prev.map((a) =>
            a.applicationId === applicationId
              ? { ...a, status: applicant.status }
              : a
          )
        );
        alert(`Failed: ${result.error}`);
      }
    },
    [applicants]
  );

  const activeApplicant = activeId
    ? applicants.find((a) => a.applicationId === activeId)
    : null;

  return (
    <div className="animate-fade-in">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              marginBottom: 4,
            }}
          >
            <Link
              href="/applicants"
              className="btn btn-ghost btn-icon"
              style={{ width: 36, height: 36 }}
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 style={{ margin: 0 }}>Applicant Board</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Drag and drop applicants between stages for{" "}
            <strong>{jobTitle}</strong>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <User size={16} color="var(--text-muted)" />
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {applicants.length} applicant{applicants.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            overflowX: "auto",
            paddingBottom: "var(--space-4)",
          }}
        >
          {COLUMNS.map((col) => {
            const colApplicants = applicants.filter(
              (a) => a.status === col.id
            );
            return (
              <DroppableColumn
                key={col.id}
                column={col}
                count={colApplicants.length}
              >
                {colApplicants.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "var(--space-6)",
                      color: "var(--text-muted)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    Drop candidates here
                  </div>
                ) : (
                  colApplicants.map((applicant) => (
                    <DraggableCard
                      key={applicant.applicationId}
                      applicant={applicant}
                      isDragging={activeId === applicant.applicationId}
                    />
                  ))
                )}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeApplicant ? (
            <OverlayCard applicant={activeApplicant} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
