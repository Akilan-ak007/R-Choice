/**
 * Generate an .ics calendar file content for a selection round event.
 *
 * @param round - Selection round details
 * @returns ICS file content string
 */

interface CalendarEventInput {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
  location?: string;
  meetLink?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateIcsContent(event: CalendarEventInput): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@rchoice`;
  const start = toIcsDate(event.startsAt);
  const end = event.endsAt
    ? toIcsDate(event.endsAt)
    : toIcsDate(new Date(event.startsAt.getTime() + 60 * 60 * 1000)); // Default: 1 hour

  const descParts: string[] = [];
  if (event.description) descParts.push(event.description);
  if (event.meetLink) descParts.push(`Join online: ${event.meetLink}`);
  const desc = descParts.length > 0 ? escapeIcs(descParts.join("\n")) : "";

  const locationStr = event.location
    ? escapeIcs(event.location)
    : event.meetLink
      ? escapeIcs(event.meetLink)
      : "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//R-Choice//Selection Round//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ];

  if (desc) lines.push(`DESCRIPTION:${desc}`);
  if (locationStr) lines.push(`LOCATION:${locationStr}`);
  if (event.meetLink) lines.push(`URL:${event.meetLink}`);

  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Client-side helper: trigger browser download of an .ics file
 */
export function downloadIcsFile(event: CalendarEventInput, filename?: string) {
  const content = generateIcsContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${event.title.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
