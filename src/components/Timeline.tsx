import { formatDay, type DayPlan } from "../logic/plan";

interface TimelineProps {
  days: DayPlan[];
}

const WEEK_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function Timeline({ days }: TimelineProps) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.capacity, d.planned)));
  const hasWork = days.some((d) => d.planned > 0);

  return (
    <section className="panel timeline" aria-labelledby="timeline-title">
      <div className="timeline__head">
        <h2 id="timeline-title">Próximas duas semanas</h2>
        <span className="hint">barra = horas marcadas · traço = horas disponíveis</span>
      </div>
      {!hasWork ? (
        <p className="hint">Nada agendado. Configure as horas da semana ou adicione um tópico.</p>
      ) : (
        <ol className="timeline__bars">
          {days.map((d) => {
            const planned = (d.planned / max) * 100;
            const cap = (d.capacity / max) * 100;
            const off = d.capacity === 0;
            return (
              <li
                key={d.date.toISOString()}
                className={`timeline__day ${off ? "is-off" : ""} ${d.planned > d.capacity ? "is-over" : ""}`}
                title={`${formatDay(d.date)}: ${d.planned}h marcadas de ${d.capacity}h${d.topics.length ? ` · ${d.topics.join(", ")}` : ""}`}
              >
                <div className="timeline__track">
                  <span className="timeline__cap" style={{ bottom: `${cap}%` }} />
                  <span className="timeline__fill" style={{ height: `${planned}%` }} />
                </div>
                <span className="timeline__label">{WEEK_SHORT[d.date.getDay()]}</span>
                <span className="timeline__num">{d.date.getDate()}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
