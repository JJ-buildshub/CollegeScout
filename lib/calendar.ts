import { getSummerProgram } from "./summer";

export interface CalendarDeadline {
  uid: string;
  date: string;
  title: string;
  url: string;
}

/** Every dated deadline of the saved summer programs still ahead of `today`. A blank deadline adds nothing. */
export function summerCalendarDeadlines(ids: string[], today: Date): CalendarDeadline[] {
  const ahead = (date: string) => new Date(`${date}T23:59:59`) >= today;
  return ids.flatMap((id) => {
    const program = getSummerProgram(id);
    if (!program) return [];
    const events: CalendarDeadline[] = [];
    if (program.deadline) {
      events.push({ uid: `${id}-apply`, date: program.deadline, title: `Apply: ${program.name}`, url: program.officialUrl });
    }
    program.toSubmit?.items.forEach((item, i) => {
      if (item.due) events.push({ uid: `${id}-step-${i}`, date: item.due, title: `${item.label}: ${program.name}`, url: program.officialUrl });
    });
    return events.filter((event) => ahead(event.date));
  });
}

const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");

/** The format allows 75 characters a line; a longer one continues on the next line after a space. */
function fold(line: string): string {
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 73) parts.push(line.slice(i, i + 73));
  return parts.join("\r\n ");
}

const compact = (date: string) => date.replace(/-/g, "");

/** The next day, worked out in UTC so the server or browser time zone can't shift an all-day event. */
function nextDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * An iCalendar file of all-day events, each with a reminder a week before. Each uid stays the same
 * between downloads, so importing again updates an event in calendars that match on uid.
 */
export function buildCalendarFile(deadlines: CalendarDeadline[], now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CollegeScout//My Plan//EN",
    "CALSCALE:GREGORIAN",
    ...deadlines.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.uid}@collegescout.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(event.date)}`,
      `DTEND;VALUE=DATE:${nextDay(event.date)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(`Dates can change. Check the official page: ${event.url}`)}`,
      `URL:${event.url}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(event.title)}`,
      "TRIGGER:-P7D",
      "END:VALARM",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
