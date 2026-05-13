"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Video, FileText, Briefcase, Clock } from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate?: string | null;
  meetLink?: string | null;
  isAllDay: boolean;
};

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  internship_start: { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981", border: "#10b981" },
  internship_end: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "#ef4444" },
  report_due: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "#3b82f6" },
  meeting: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", border: "#f59e0b" },
  interview_round: { bg: "rgba(139, 92, 246, 0.1)", text: "#8b5cf6", border: "#8b5cf6" },
  selection_round: { bg: "rgba(168, 85, 247, 0.12)", text: "#7c3aed", border: "#7c3aed" },
  od_raised: { bg: "rgba(14, 165, 233, 0.12)", text: "#0284c7", border: "#0284c7" },
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  internship_start: <Briefcase size={14} />,
  internship_end: <Briefcase size={14} />,
  report_due: <FileText size={14} />,
  meeting: <Video size={14} />,
  interview_round: <Video size={14} />,
  selection_round: <Video size={14} />,
  od_raised: <Briefcase size={14} />,
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dateKey = new Date(event.startDate).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    }
    return map;
  }, [events]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const todayKey = today.toISOString().split("T")[0];
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events
      .filter(e => {
        const d = new Date(e.startDate);
        return d >= now && d <= weekLater;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--space-6)", alignItems: "start" }}>
      {/* Calendar Grid */}
      <div className="card" style={{ padding: "var(--space-5)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
          <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: "8px" }}><ChevronLeft size={20} /></button>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: "8px" }}><ChevronRight size={20} /></button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", padding: "8px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: "72px" }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateKey)}
                style={{
                  minHeight: "72px",
                  padding: "6px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: isSelected ? "2px solid var(--primary-color)" : isToday ? "2px solid var(--rathinam-blue)" : "1px solid var(--border-color)",
                  background: isSelected ? "rgba(99, 102, 241, 0.05)" : isToday ? "rgba(59, 130, 246, 0.04)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: "0.8125rem", fontWeight: isToday ? 700 : 500, color: isToday ? "var(--rathinam-blue)" : "var(--text-primary)", marginBottom: "4px" }}>
                  {day}
                </div>
                {dayEvents.slice(0, 2).map(ev => {
                  const color = EVENT_COLORS[ev.eventType] || EVENT_COLORS.meeting;
                  return (
                    <div key={ev.id} style={{
                      fontSize: "0.625rem",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      background: color.bg,
                      color: color.text,
                      marginBottom: "2px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      fontWeight: 600,
                    }}>
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)" }}>+{dayEvents.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* Selected date events */}
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-3) 0", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarDays size={18} />
            {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : "Select a date"}
          </h3>
          {selectedDate && selectedEvents.length === 0 && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>No events on this day.</p>
          )}
          {selectedEvents.map(ev => {
            const color = EVENT_COLORS[ev.eventType] || EVENT_COLORS.meeting;
            return (
              <div key={ev.id} style={{
                padding: "12px",
                borderRadius: "8px",
                borderLeft: `3px solid ${color.border}`,
                background: color.bg,
                marginBottom: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  {EVENT_ICONS[ev.eventType] || <Clock size={14} />}
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: color.text }}>{ev.title}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>{ev.description}</p>
                {ev.meetLink && (
                  <a href={ev.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: "8px", fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex", gap: "6px" }}>
                    <Video size={14} /> Join Meeting
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming events */}
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-3) 0", fontSize: "1rem" }}>📅 Upcoming (7 days)</h3>
          {upcomingEvents.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>No upcoming events this week.</p>
          ) : (
            upcomingEvents.slice(0, 5).map(ev => {
              const color = EVENT_COLORS[ev.eventType] || EVENT_COLORS.meeting;
              return (
                <div key={ev.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color.border, marginTop: "6px", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.8125rem" }}>{ev.title}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {new Date(ev.startDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
