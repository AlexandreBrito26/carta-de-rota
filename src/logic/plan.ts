export type ThemeMode = "system" | "light" | "dark";
export type Filter = "all" | "active" | "late" | "done";
export type Status = "done" | "ontrack" | "late" | "overdue";

export interface Stage {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  stageId: string;
  name: string;
  estimatedHours: number;
  doneHours: number;
  deadline: string; // YYYY-MM-DD
}

// Horas de estudo por dia da semana: índice 0 = domingo, 6 = sábado
export type WeekHours = [number, number, number, number, number, number, number];

export interface AppState {
  stages: Stage[];
  topics: Topic[];
  weekHours: WeekHours;
  theme: ThemeMode;
  history: Record<string, number>; // "YYYY-MM-DD" -> horas registradas naquele dia
}

export type SortKey = "deadline" | "progress" | "remaining";

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
export const DEFAULT_WEEK: WeekHours = [0, 2, 2, 2, 2, 2, 0];
const HORIZON_DAYS = 3650;

export interface ScheduledTopic {
  topic: Topic;
  remaining: number;
  finishDate: Date | null;
  status: Status;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// "YYYY-MM-DD" vira data local, sem o deslocamento de fuso do Date.parse
export function parseDay(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toInputDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysUntil(deadline: string, today: Date): number {
  return Math.round((parseDay(deadline).getTime() - startOfDay(today).getTime()) / DAY_MS);
}

export function topicProgress(topic: Topic): number {
  if (topic.estimatedHours <= 0) return 0;
  return Math.min(100, Math.round((topic.doneHours / topic.estimatedHours) * 100));
}

// Previsão dia a dia: cada dia da semana tem a sua capacidade de horas.
// Os tópicos pendentes são feitos na ordem do prazo, sem pular dias sem horas.
export function schedule(topics: Topic[], weekHours: WeekHours, today: Date): ScheduledTopic[] {
  const base = startOfDay(today);
  const ordered = [...topics].sort(
    (a, b) => a.deadline.localeCompare(b.deadline) || a.name.localeCompare(b.name, "pt-BR"),
  );

  let work = 0; // horas pendentes acumuladas, na ordem do prazo
  let day = 0; // próximo dia ainda não contabilizado
  let capacity = 0; // horas disponíveis até o dia "day" (exclusive)

  return ordered.map((topic) => {
    const remaining = Math.max(0, topic.estimatedHours - topic.doneHours);
    if (remaining === 0) {
      return { topic, remaining, finishDate: null, status: "done" as const };
    }
    work += remaining;
    while (capacity < work && day < HORIZON_DAYS) {
      capacity += weekHours[addDays(base, day).getDay()];
      day += 1;
    }
    const finishDate = capacity >= work ? addDays(base, day - 1) : null;
    const deadline = parseDay(topic.deadline).getTime();
    const status: Status =
      deadline < base.getTime()
        ? "overdue"
        : finishDate === null || finishDate.getTime() > deadline
          ? "late"
          : "ontrack";
    return { topic, remaining, finishDate, status };
  });
}

export interface DayPlan {
  date: Date;
  capacity: number;
  planned: number;
  topics: string[];
}

// Distribuição dos próximos dias: quanto de cada dia já tem trabalho marcado
export function dailyPlan(topics: Topic[], weekHours: WeekHours, today: Date, days: number): DayPlan[] {
  const base = startOfDay(today);
  const queue = [...topics]
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.name.localeCompare(b.name, "pt-BR"))
    .map((t) => ({ name: t.name, remaining: Math.max(0, t.estimatedHours - t.doneHours) }))
    .filter((t) => t.remaining > 0);

  const result: DayPlan[] = [];
  let index = 0;
  for (let offset = 0; offset < days; offset++) {
    const date = addDays(base, offset);
    let capacity = weekHours[date.getDay()];
    const names: string[] = [];
    let planned = 0;
    const available = capacity;
    while (capacity > 0 && index < queue.length) {
      const head = queue[index];
      const take = Math.min(capacity, head.remaining);
      head.remaining -= take;
      capacity -= take;
      planned += take;
      if (!names.includes(head.name)) names.push(head.name);
      if (head.remaining <= 0) index += 1;
    }
    result.push({ date, capacity: available, planned, topics: names });
  }
  return result;
}

export interface Stats {
  totalRemaining: number;
  lastFinish: Date | null;
  lateCount: number;
  overall: number;
}

export function computeStats(plan: ScheduledTopic[]): Stats {
  const pending = plan.filter((p) => p.status !== "done");
  const totalRemaining = pending.reduce((sum, p) => sum + p.remaining, 0);
  const lastFinish = pending.reduce<Date | null>(
    (max, p) => (p.finishDate && (!max || p.finishDate > max) ? p.finishDate : max),
    null,
  );
  const lateCount = pending.filter((p) => p.status === "late" || p.status === "overdue").length;
  const estimated = plan.reduce((sum, p) => sum + p.topic.estimatedHours, 0);
  const done = plan.reduce((sum, p) => sum + Math.min(p.topic.doneHours, p.topic.estimatedHours), 0);
  const overall = estimated > 0 ? Math.round((done / estimated) * 100) : 0;
  return { totalRemaining, lastFinish, lateCount, overall };
}

export function matchesFilter(item: ScheduledTopic, filter: Filter): boolean {
  switch (filter) {
    case "active":
      return item.status !== "done";
    case "late":
      return item.status === "late" || item.status === "overdue";
    case "done":
      return item.status === "done";
    default:
      return true;
  }
}

export const STATUS_LABEL: Record<Status, string> = {
  done: "Concluído",
  ontrack: "No ritmo",
  late: "Vai atrasar",
  overdue: "Prazo vencido",
};

export const STATUS_TONE: Record<Status, "done" | "ok" | "alert"> = {
  done: "done",
  ontrack: "ok",
  late: "alert",
  overdue: "alert",
};


// Sequência de dias seguidos com horas registradas.
// Se hoje ainda não tem registro, a contagem começa de ontem.
export function computeStreak(history: Record<string, number>, today: Date): number {
  let day = startOfDay(today);
  if (!(history[toInputDay(day)] > 0)) day = addDays(day, -1);
  let count = 0;
  while (count < 3650 && history[toInputDay(day)] > 0) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

export function sortItems(items: ScheduledTopic[], key: SortKey): ScheduledTopic[] {
  const copy = [...items];
  if (key === "progress") {
    return copy.sort((a, b) => topicProgress(b.topic) - topicProgress(a.topic));
  }
  if (key === "remaining") {
    return copy.sort((a, b) => b.remaining - a.remaining);
  }
  return copy; // já vem na ordem do prazo
}
