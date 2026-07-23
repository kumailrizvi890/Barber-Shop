// 9 slots/day, 9:00 AM - 5:00 PM hourly, matching the 3-col x 3-row grid in the design.
export const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM",
  "3:00 PM", "4:00 PM", "5:00 PM",
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function next7Days(): { date: string; label: string; weekday: number }[] {
  const out = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      weekday: d.getDay(),
    });
  }
  return out;
}

export function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
