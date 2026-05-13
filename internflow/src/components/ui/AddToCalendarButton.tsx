"use client";

import { downloadIcsFile } from "@/lib/ics";
import { Calendar } from "lucide-react";

interface AddToCalendarProps {
  title: string;
  description?: string;
  startsAt: string; // ISO string
  endsAt?: string; // ISO string
  location?: string;
  meetLink?: string;
}

export function AddToCalendarButton({ title, description, startsAt, endsAt, location, meetLink }: AddToCalendarProps) {
  const handleClick = () => {
    downloadIcsFile({
      title,
      description,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : undefined,
      location,
      meetLink,
    });
  };

  return (
    <button
      type="button"
      className="btn btn-outline"
      style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex", gap: "4px" }}
      onClick={handleClick}
      title="Download .ics calendar invite"
    >
      <Calendar size={14} /> Add to Calendar
    </button>
  );
}
