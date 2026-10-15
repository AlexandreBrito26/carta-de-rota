import { toInputDay, addDays, DEFAULT_WEEK, type AppState, type Stage, type Topic, type ThemeMode, type WeekHours } from "./plan";

const KEY = "carta-de-rota:v3";
const THEMES: ThemeMode[] = ["system", "light", "dark"];

export function sampleState(today: Date): AppState {
  const d = (n: number) => toInputDay(addDays(today, n));
  return {
    stages: [
      { id: "s-fund", name: "Fundamentos" },
      { id: "s-react", name: "React" },
      { id: "s-proj", name: "Projeto final" },
    ],
    topics: [
      { id: "t1", stageId: "s-fund", name: "HTML semântico e acessibilidade", estimatedHours: 4, doneHours: 4, deadline: d(-3) },
      { id: "t2", stageId: "s-fund", name: "CSS: flexbox e grid", estimatedHours: 6, doneHours: 3, deadline: d(4) },
      { id: "t3", stageId: "s-react", name: "Componentes e props", estimatedHours: 5, doneHours: 0, deadline: d(10) },
      { id: "t4", stageId: "s-react", name: "Hooks avançados", estimatedHours: 8, doneHours: 0, deadline: d(18) },
      { id: "t5", stageId: "s-proj", name: "Protótipo da interface", estimatedHours: 12, doneHours: 0, deadline: d(30) },
    ],
    weekHours: [...DEFAULT_WEEK] as WeekHours,
    theme: "system",
    history: {},
  };
}

export function emptyState(): AppState {
  return {
    stages: [{ id: "s-geral", name: "Geral" }],
    topics: [],
    weekHours: [...DEFAULT_WEEK] as WeekHours,
    theme: "system",
    history: {},
  };
}

function isStage(x: unknown): x is Stage {
  return typeof x === "object" && x !== null && typeof (x as Stage).id === "string" && typeof (x as Stage).name === "string";
}

function isTopic(x: unknown): x is Topic {
  const t = x as Topic;
  return (
    typeof t === "object" && t !== null &&
    typeof t.id === "string" && typeof t.stageId === "string" && typeof t.name === "string" &&
    typeof t.estimatedHours === "number" && typeof t.doneHours === "number" &&
    typeof t.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.deadline)
  );
}

// Valida a estrutura inteira; qualquer coisa fora do formato é recusada
export function parseState(text: string): AppState | null {
  try {
    const data = JSON.parse(text) as Partial<AppState>;
    if (!Array.isArray(data.stages) || !data.stages.every(isStage)) return null;
    if (!Array.isArray(data.topics) || !data.topics.every(isTopic)) return null;
    const stageIds = new Set(data.stages.map((s) => s.id));
    if (!data.topics.every((t) => stageIds.has(t.stageId))) return null;
    if (data.stages.length === 0) return null;
    const week = data.weekHours as unknown;
    const weekHours: WeekHours =
      Array.isArray(week) && week.length === 7 && week.every((h) => typeof h === "number" && h >= 0 && h <= 16)
        ? (week as WeekHours)
        : [...DEFAULT_WEEK] as WeekHours;
    const theme = THEMES.includes(data.theme as ThemeMode) ? (data.theme as ThemeMode) : "system";
    const history: Record<string, number> = {};
    if (data.history && typeof data.history === "object") {
      for (const [k, v] of Object.entries(data.history)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === "number" && v >= 0) history[k] = v;
      }
    }
    return { stages: data.stages, topics: data.topics, weekHours, theme, history };
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = parseState(raw);
      if (parsed) return parsed;
    }
  } catch {
    // armazenamento indisponível: começa do zero
  }
  return emptyState();
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // sem armazenamento: o planejamento continua na sessão
  }
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
