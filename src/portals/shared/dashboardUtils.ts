import type { AttendanceRecord } from "@/types/attendance.types";
import type { Task } from "@/types/task.types";
import { addDays, localYmd, startOfWeekMonday } from "@/apis/api/attendance";

export type PieSlice = { name: string; value: number; color: string };

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: "#94A3B8",
  in_progress: "#6366F1",
  review: "#A855F7",
  completed: "#10B981",
};

export function getUserIdFromRecord(a: AttendanceRecord): string | null {
  const u = a.user;
  if (typeof u === "object" && u !== null && "_id" in u) return String(u._id);
  if (typeof u === "string") return u;
  return null;
}

export function countPresent(records: AttendanceRecord[] = []): number {
  const s = new Set<string>();
  for (const r of records) {
    if (!r.punchInTime) continue;
    const uid = getUserIdFromRecord(r);
    if (uid) s.add(uid);
  }
  return s.size;
}

export function buildWeekAttendanceSeries(records: AttendanceRecord[], weekMonday: Date) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buckets: Record<string, Set<string>> = {};
  const ymds: string[] = [];
  for (let i = 0; i < 7; i++) {
    const ymd = localYmd(addDays(weekMonday, i));
    ymds.push(ymd);
    buckets[ymd] = new Set();
  }
  for (const r of records) {
    if (!r.date || !r.punchInTime) continue;
    const ymd = String(r.date).slice(0, 10);
    if (!buckets[ymd]) continue;
    const uid = getUserIdFromRecord(r);
    if (uid) buckets[ymd].add(uid);
  }
  return labels.map((day, i) => ({ day, value: buckets[ymds[i]].size }));
}

export function buildTodayAttendanceSeries(records: AttendanceRecord[]) {
  const hours = [6, 8, 10, 12, 14, 16, 18];
  const buckets = new Array(hours.length).fill(0);
  for (const r of records) {
    if (!r.punchInTime) continue;
    const hr = new Date(r.punchInTime).getHours();
    let idx = 0;
    for (let i = 0; i < hours.length; i++) { if (hr >= hours[i]) idx = i; }
    buckets[idx] += 1;
  }
  return hours.map((h, i) => ({ day: `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "AM" : "PM"}`, value: buckets[i] }));
}

export function buildMonthAttendanceSeries(records: AttendanceRecord[], monthStart: Date) {
  const weeks = [0, 0, 0, 0];
  const seen: Set<string>[] = [new Set(), new Set(), new Set(), new Set()];
  for (const r of records) {
    if (!r.date || !r.punchInTime) continue;
    const dt = new Date(String(r.date));
    const diffDays = Math.floor((dt.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.min(3, Math.max(0, Math.floor(diffDays / 7)));
    const uid = getUserIdFromRecord(r);
    if (uid && !seen[weekIdx].has(uid + dt.toDateString())) {
      seen[weekIdx].add(uid + dt.toDateString());
      weeks[weekIdx] += 1;
    }
  }
  return weeks.map((v, i) => ({ day: `W${i + 1}`, value: v }));
}

export function buildTaskCompletionSeries(tasks: Task[], weekMonday: Date) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = new Array(7).fill(0);
  for (const t of tasks) {
    if (t.status !== "completed" || !t.updatedAt) continue;
    const d = new Date(t.updatedAt);
    const diffDays = Math.floor((d.getTime() - weekMonday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) counts[diffDays] += 1;
  }
  return labels.map((name, i) => ({ name, value: counts[i] }));
}

export function buildTaskStatusPie(tasks: Task[]): PieSlice[] {
  const counts: Record<string, number> = { pending: 0, in_progress: 0, review: 0, completed: 0 };
  for (const t of tasks) { if (counts[t.status] !== undefined) counts[t.status] += 1; }
  return [
    { name: "Pending", value: counts.pending, color: TASK_STATUS_COLORS.pending },
    { name: "In Progress", value: counts.in_progress, color: TASK_STATUS_COLORS.in_progress },
    { name: "Review", value: counts.review, color: TASK_STATUS_COLORS.review },
    { name: "Completed", value: counts.completed, color: TASK_STATUS_COLORS.completed },
  ];
}

export function formatMs(ms: number): string {
  if (!ms || ms <= 0) return "0h 0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

export function formatDate(d?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString(undefined, opts ?? { month: "short", day: "numeric" }); } catch { return ""; }
}

export function formatTime(d?: string | null) {
  if (!d) return "";
  try { return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

export function formatRelative(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function getWeekMonday(today: Date = new Date()): Date {
  return startOfWeekMonday(today);
}

export { localYmd, addDays };
