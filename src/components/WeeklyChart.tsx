import { formatDay } from "../logic/plan";

interface WeeklyChartProps {
  weeks: { start: Date; hours: number }[];
  goal: number;
}

export default function WeeklyChart({ weeks, goal }: WeeklyChartProps) {
  const max = Math.max(1, goal, ...weeks.map((w) => w.hours));
  const total = weeks.reduce((sum, w) => sum + w.hours, 0);
  return (
    <section className="panel timeline" aria-labelledby="weekly-title">
      <div className="timeline__head">
        <h2 id="weekly-title">Últimas 4 semanas</h2>
        <span className="hint">{Math.round(total * 10) / 10}h no período{goal > 0 ? ` · meta ${goal}h/semana` : ""}</span>
      </div>
      {total === 0 ? (
        <p className="hint">Quando você registrar horas, o resumo semanal aparece aqui.</p>
      ) : (
        <ol className="timeline__bars weekly">
          {weeks.map((w) => {
            const met = goal > 0 && w.hours >= goal;
            return (
              <li
                key={w.start.toISOString()}
                className={`timeline__day ${met ? "is-met" : ""}`}
                title={`Semana de ${formatDay(w.start)}: ${w.hours}h${goal > 0 ? ` de ${goal}h` : ""}`}
              >
                <div className="timeline__track">
                  {goal > 0 && <span className="timeline__cap" style={{ bottom: `${(goal / max) * 100}%` }} />}
                  <span className="timeline__fill" style={{ height: `${(w.hours / max) * 100}%` }} />
                </div>
                <span className="timeline__label">{Math.round(w.hours * 10) / 10}h</span>
                <span className="timeline__num">{formatDay(w.start)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
