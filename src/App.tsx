import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import InfoDialog, { type InfoTab } from "./components/InfoDialog";
import Logo from "./components/Logo";
import Stat from "./components/Stat";
import ChartBackground from "./components/ChartBackground";
import Confetti, { celebrate } from "./components/Confetti";
import ConfirmButton from "./components/ConfirmButton";
import StageSection from "./components/StageSection";
import ThemeToggle from "./components/ThemeToggle";
import Timeline from "./components/Timeline";
import Toast, { type ToastAction } from "./components/Toast";
import TopicForm, { type TopicInput } from "./components/TopicForm";
import WeekEditor from "./components/WeekEditor";
import WeekGoal from "./components/WeekGoal";
import HistoryChart from "./components/HistoryChart";
import { emptyState, loadState, newId, parseState, sampleState, saveState } from "./logic/storage";
import {
  addDays, computeStats, computeStreak, dailyPlan, formatDay, lastDays, matchesFilter, schedule, sortItems, startOfDay, toInputDay, weekTotal,
  type AppState, type Filter, type SortKey, type ThemeMode, type Topic,
} from "./logic/plan";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Em andamento" },
  { value: "late", label: "Em risco" },
  { value: "done", label: "Concluídos" },
];

const VERSION = "1.7";
const EFFECTS_KEY = "carta-de-rota:efeitos";

// Efeitos ligados por padrão, desligados se o sistema pedir para reduzir movimento
function initialEffects(): boolean {
  try {
    const saved = localStorage.getItem(EFFECTS_KEY);
    if (saved !== null) return saved === "on";
  } catch {
    // sem armazenamento: usa o padrão
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function applyTheme(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("deadline");
  const [toast, setToast] = useState<{ message: string; action?: ToastAction } | null>(null);
  const [newStage, setNewStage] = useState("");
  const [info, setInfo] = useState<InfoTab | null>(null);
  const [effects, setEffects] = useState<boolean>(initialEffects);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  // Persistência e tema
  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    applyTheme(state.theme);
    if (state.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [state.theme]);

  // Aviso temporário (mais longo quando tem ação de desfazer)
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.action ? 6000 : 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Instalação como app (quando o navegador oferece)
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Atalho: "n" leva o foco para o novo tópico
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      document.getElementById("novo-topico")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const plan = useMemo(() => schedule(state.topics, state.weekHours, today), [state.topics, state.weekHours, today]);
  const stats = useMemo(() => computeStats(plan), [plan]);
  const days = useMemo(() => dailyPlan(state.topics, state.weekHours, today, 14), [state.topics, state.weekHours, today]);
  const isEmpty = state.topics.length === 0;

  // Efeitos: liga ou desliga animações e o fundo em canvas
  useEffect(() => {
    document.documentElement.dataset.effects = effects ? "on" : "off";
    try {
      localStorage.setItem(EFFECTS_KEY, effects ? "on" : "off");
    } catch {
      // sem armazenamento: vale só nesta sessão
    }
  }, [effects]);

  // Troca de tema com transição circular, quando o navegador suporta
  function changeTheme(theme: ThemeMode) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!doc.startViewTransition || reduce) {
      patch((s) => ({ ...s, theme }));
      return;
    }
    doc.startViewTransition(() => flushSync(() => patch((s) => ({ ...s, theme }))));
  }

  // Ondas de clique nos botões
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (document.documentElement.dataset.effects === "off") return;
      const el = (e.target as HTMLElement | null)?.closest?.(".btn, .chip, .theme-toggle, .effects-toggle") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const wave = document.createElement("span");
      wave.className = "ripple";
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - r.left - size / 2}px`;
      wave.style.top = `${e.clientY - r.top - size / 2}px`;
      el.appendChild(wave);
      window.setTimeout(() => wave.remove(), 650);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Brilho que segue o cursor dentro dos painéis
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (document.documentElement.dataset.effects === "off") return;
      const panel = (e.target as HTMLElement | null)?.closest?.(".panel, .summary__item") as HTMLElement | null;
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${e.clientX - r.left}px`);
      panel.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  function patch(fn: (s: AppState) => AppState) {
    setState((prev) => fn(prev));
  }

  function notify(message: string, action?: ToastAction) {
    setToast({ message, action });
  }

  function updateTopic(id: string, change: (t: Topic) => Topic) {
    patch((s) => ({ ...s, topics: s.topics.map((t) => (t.id === id ? change(t) : t)) }));
  }

  // Soma horas ao dia de hoje no histórico (base da sequência)
  function addHistory(hours: number) {
    const key = toInputDay(today);
    patch((s) => ({ ...s, history: { ...s.history, [key]: (s.history[key] ?? 0) + hours } }));
  }

  const streak = useMemo(() => computeStreak(state.history, today), [state.history, today]);
  const thisWeek = useMemo(() => weekTotal(state.history, today), [state.history, today]);
  const recent = useMemo(() => lastDays(state.history, today, 14), [state.history, today]);

  const actions = {
    log: (id: string, hours: number) => {
      const topic = state.topics.find((t) => t.id === id);
      const added = topic ? Math.min(hours, Math.max(0, topic.estimatedHours - topic.doneHours)) : hours;
      updateTopic(id, (t) => ({ ...t, doneHours: Math.min(t.estimatedHours, t.doneHours + hours) }));
      if (added > 0) addHistory(added);
      notify(`${Math.round(hours * 100) / 100}h registradas.`);
    },
    complete: (id: string) => {
      const topic = state.topics.find((t) => t.id === id);
      const left = topic ? Math.max(0, topic.estimatedHours - topic.doneHours) : 0;
      const routeDone = state.topics.every((t) => t.id === id || t.doneHours >= t.estimatedHours);
      updateTopic(id, (t) => ({ ...t, doneHours: t.estimatedHours }));
      if (left > 0) addHistory(left);
      if (routeDone && state.topics.length > 0) {
        celebrate({ power: 180 });
        notify("Rota concluída. Parabéns!");
      } else {
        celebrate({ power: 70 });
        notify("Tópico concluído. Bom trabalho!");
      }
    },
    reopen: (id: string) => {
      updateTopic(id, (t) => ({ ...t, doneHours: 0 }));
      notify("Tópico reaberto.");
    },
    edit: (id: string, data: TopicInput) => {
      updateTopic(id, (t) => ({ ...t, ...data, doneHours: Math.min(t.doneHours, data.estimatedHours) }));
      notify("Tópico atualizado.");
    },
    remove: (id: string) => {
      const removed = state.topics.find((t) => t.id === id);
      patch((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== id) }));
      if (removed) {
        notify("Tópico removido.", {
          label: "Desfazer",
          onClick: () => {
            setState((prev) => ({ ...prev, topics: [...prev.topics, removed] }));
            setToast(null);
          },
        });
      }
    },
  };

  function addTopic(data: TopicInput) {
    patch((s) => ({ ...s, topics: [...s.topics, { ...data, id: newId(), doneHours: 0 }] }));
    notify("Tópico adicionado à rota.");
  }

  function addStage() {
    const name = newStage.trim();
    if (!name) return;
    patch((s) => ({ ...s, stages: [...s.stages, { id: newId(), name }] }));
    setNewStage("");
    notify("Etapa criada.");
  }

  function renameStage(id: string, name: string) {
    patch((s) => ({ ...s, stages: s.stages.map((st) => (st.id === id ? { ...st, name } : st)) }));
  }

  function removeStage(id: string) {
    patch((s) => ({
      ...s,
      stages: s.stages.filter((st) => st.id !== id),
      topics: s.topics.filter((t) => t.stageId !== id),
    }));
    notify("Etapa removida.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carta-de-rota-${toInputDay(today)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Backup exportado.");
  }

  async function importBackup(file: File) {
    const parsed = parseState(await file.text());
    if (!parsed) return notify("Arquivo inválido. Use um backup exportado por este app.");
    setState(parsed);
    notify("Backup importado.");
  }

  const visibleStages = state.stages.map((stage) => ({
    stage,
    items: sortItems(
      plan.filter(
        (p) =>
          p.topic.stageId === stage.id &&
          matchesFilter(p, filter) &&
          p.topic.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
      sort,
    ),
  }));
  const visibleCount = visibleStages.reduce((sum, v) => sum + v.items.length, 0);
  const pendingCount = plan.filter((p) => p.status !== "done").length;

  return (
    <div className="app">
      <ChartBackground enabled={effects} />
      <Confetti />
      <a className="skip" href="#rota">Pular para a rota</a>
      <header className="app__header">
        <div className="brand">
          <Logo size={52} />
          <div>
            <p className="app__eyebrow">Planejador de estudos</p>
            <h1>Carta de Rota</h1>
            <p>Marque o destino, estime o caminho e acompanhe quando cada trecho termina.</p>
          <p className={`streak ${streak > 0 ? "streak--on" : ""}`}>
            {streak > 0
              ? <><span aria-hidden="true">🔥</span> {streak} {streak === 1 ? "dia seguido" : "dias seguidos"} estudando</>
              : "Registre horas hoje para começar uma sequência."}
          </p>
          </div>
        </div>
        <div className="app__tools">
          {installEvent && (
            <button
              type="button"
              className="btn btn--small"
              onClick={async () => {
                await installEvent.prompt();
                setInstallEvent(null);
              }}
            >
              Instalar app
            </button>
          )}
          <button
            type="button"
            className="btn btn--small effects-toggle"
            aria-pressed={effects}
            onClick={() => setEffects((on) => !on)}
            title="Liga ou desliga as animações"
          >
            <span aria-hidden="true">✦</span> Efeitos {effects ? "ligados" : "desligados"}
          </button>
          <ThemeToggle theme={state.theme} onChange={changeTheme} />
        </div>
      </header>

      <section className="summary" aria-label="Resumo">
        <Stat value={stats.totalRemaining} suffix="h" label="restantes" />
        <div className="summary__item">
          <span className="summary__value">
            {isEmpty ? "—" : stats.lastFinish ? formatDay(stats.lastFinish) : pendingCount > 0 ? "—" : "🎉"}
          </span>
          <span className="summary__label">
            {isEmpty
              ? "adicione um tópico"
              : pendingCount === 0
                ? "rota concluída"
                : stats.lastFinish
                  ? "conclusão prevista"
                  : "sem horas na semana"}
          </span>
        </div>
        <Stat value={stats.lateCount} tone={stats.lateCount > 0 ? "alert" : "ok"} label={stats.lateCount === 1 ? "tópico em risco" : "tópicos em risco"} />
        <Stat value={stats.overall} suffix="%" label="da jornada feita" bar={stats.overall} />
      </section>

      <main className="app__grid">
        <aside className="side">
          <section className="panel">
            <h2>Novo tópico <kbd className="kbd" title="Atalho">N</kbd></h2>
            <TopicForm
              stages={state.stages}
              defaultStageId={state.stages[0]?.id ?? ""}
              defaultDeadline={toInputDay(addDays(today, 14))}
              submitLabel="Adicionar à rota"
              onSubmit={addTopic}
            />
          </section>

          <section className="panel">
            <h2>Semana de estudo</h2>
            <WeekEditor value={state.weekHours} onChange={(weekHours) => patch((s) => ({ ...s, weekHours }))} />
            <WeekGoal
              goal={state.weeklyGoal}
              done={thisWeek}
              onChange={(weeklyGoal) => patch((s) => ({ ...s, weeklyGoal }))}
            />
            <p className="hint">A previsão pula os dias sem horas, então fins de semana livres não atrasam a rota.</p>
          </section>

          <section className="panel">
            <h2>Etapas</h2>
            <form className="add-stage" onSubmit={(e) => { e.preventDefault(); addStage(); }}>
              <input value={newStage} maxLength={40} placeholder="Nova etapa" aria-label="Nome da nova etapa" onChange={(e) => setNewStage(e.target.value)} />
              <button type="submit" className="btn btn--small">Criar</button>
            </form>
          </section>

          <section className="panel">
            <h2>Dados</h2>
            <div className="data-tools">
              <button type="button" className="btn btn--small" onClick={exportBackup}>Exportar backup</button>
              <button type="button" className="btn btn--small" onClick={() => fileRef.current?.click()}>Importar backup</button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importBackup(file);
                  e.target.value = "";
                }}
              />
              {isEmpty ? (
                <button type="button" className="btn btn--small" onClick={() => { setState(sampleState(today)); notify("Exemplo carregado."); }}>
                  Carregar exemplo
                </button>
              ) : (
                <ConfirmButton
                  className="btn btn--small btn--ghost"
                  label="Limpar tudo"
                  confirmLabel="Confirmar: apaga tudo"
                  onConfirm={() => { setState(emptyState()); notify("Rota limpa."); }}
                />
              )}
            </div>
          </section>
        </aside>

        <section className="route-panel" id="rota" aria-label="Rota de estudos" tabIndex={-1}>
          {!isEmpty && <Timeline days={days} />}
          {!isEmpty && <HistoryChart days={recent} />}

          <div className="route-panel__head">
            <h2>Rota</h2>
            <div className="filters" role="group" aria-label="Filtrar tópicos">
              {FILTERS.map((f) => (
                <button key={f.value} type="button" className="chip" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {!isEmpty && (
            <div className="toolbar">
              <input
                type="search"
                className="toolbar__search"
                placeholder="Buscar tópico"
                aria-label="Buscar tópico"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="toolbar__sort"
                aria-label="Ordenar tópicos"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="deadline">Ordenar por prazo</option>
                <option value="progress">Ordenar por progresso</option>
                <option value="remaining">Ordenar por horas restantes</option>
              </select>
            </div>
          )}

          {isEmpty ? (
            <div className="empty empty--onboard">
              <p className="empty__title">Bem-vindo à Carta de Rota.</p>
              <ol className="steps">
                <li><strong>Adicione tópicos</strong> com as horas que cada um leva e o prazo.</li>
                <li><strong>Ajuste sua semana</strong> para dizer em quais dias você consegue estudar.</li>
                <li><strong>Acompanhe a previsão</strong> e registre as horas conforme avança.</li>
              </ol>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => { setState(sampleState(today)); notify("Exemplo carregado."); }}
              >
                Ver um exemplo
              </button>
            </div>
          ) : visibleCount === 0 ? (
            <div className="empty">
              <p className="empty__title">Nenhum tópico com este filtro.</p>
              <button type="button" className="btn btn--small" onClick={() => setFilter("all")}>Mostrar todos</button>
            </div>
          ) : (
            visibleStages.map(({ stage, items }) =>
              items.length === 0 ? null : (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  items={items}
                  stages={state.stages}
                  actions={actions}
                  canRemove={state.stages.length > 1}
                  onRename={(name) => renameStage(stage.id, name)}
                  onRemove={() => removeStage(stage.id)}
                />
              ),
            )
          )}
        </section>
      </main>

      <footer className="app__footer">
        <p>
          Carta de Rota v{VERSION} ·{" "}
          <button type="button" className="link" onClick={() => setInfo("help")}>Ajuda</button> ·{" "}
          <button type="button" className="link" onClick={() => setInfo("news")}>Novidades</button>
        </p>
        <p>Dados salvos só neste navegador.</p>
      </footer>

      <InfoDialog tab={info} onTab={setInfo} onClose={() => setInfo(null)} />

      <div className="waves" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path className="waves__back" d="M0,64 C240,112 480,16 720,64 C960,112 1200,16 1440,64 L1440,120 L0,120 Z" />
          <path className="waves__front" d="M0,84 C300,30 600,110 900,72 C1100,46 1300,96 1440,80 L1440,120 L0,120 Z" />
        </svg>
      </div>

      <Toast message={toast?.message ?? null} action={toast?.action ?? null} />
    </div>
  );
}
