import { formatDay } from "../logic/plan";

interface HistoryChartProps {
  days: { date: Date; hours: number }[];
}

export default function HistoryChart({ days }: HistoryChartProps) {
  const max = Math.max(1, ...days.map((d) => d.hours));
  const total = days.reduce((sum, d) => sum + d.hours, 0);
  return (
    <section className="panel timeline" aria-labelledby="history-title">
      <div className="timeline__head">
        <h2 id="history-title">Histórico · 14 dias</h2>
        <span className="hint">{Math.round(total * 10) / 10}h registradas</span>
      </div>
      {total === 0 ? (
        <p className="hint">As horas que você registrar aparecem aqui, dia a dia.</p>
      ) : (
        <ol className="timeline__bars">
          {days.map((d) => (
            <li key={d.date.toISOString()} className="timeline__day" title={`${formatDay(d.date)}: ${d.hours}h`}>
              <div className="timeline__track">
                <span className="timeline__fill" style={{ height: `${(d.hours / max) * 100}%` }} />
              </div>
              <span className="timeline__label">{d.hours > 0 ? `${Math.round(d.hours * 10) / 10}` : "·"}</span>
              <span className="timeline__num">{d.date.getDate()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
