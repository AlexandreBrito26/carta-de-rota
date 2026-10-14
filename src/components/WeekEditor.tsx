import { DEFAULT_WEEK, WEEKDAY_LABELS, type WeekHours } from "../logic/plan";

interface WeekEditorProps {
  value: WeekHours;
  onChange: (value: WeekHours) => void;
}

const PRESETS: { label: string; value: WeekHours }[] = [
  { label: "Padrão", value: DEFAULT_WEEK },
  { label: "Todo dia 1h", value: [1, 1, 1, 1, 1, 1, 1] },
  { label: "Intensivo", value: [4, 3, 3, 3, 3, 3, 4] },
  { label: "Só fim de semana", value: [4, 0, 0, 0, 0, 0, 4] },
];

export default function WeekEditor({ value, onChange }: WeekEditorProps) {
  const total = value.reduce((sum, h) => sum + h, 0);

  function setDay(index: number, hours: number) {
    const next = [...value] as WeekHours;
    next[index] = Math.min(16, Math.max(0, hours));
    onChange(next);
  }

  return (
    <div className="week">
      <div className="week__grid" role="group" aria-label="Horas de estudo por dia da semana">
        {WEEKDAY_LABELS.map((label, i) => (
          <label key={label} className="week__day">
            <span>{label}</span>
            <input
              type="number"
              min={0}
              max={16}
              step={0.5}
              value={value[i]}
              aria-label={`Horas em ${label}`}
              onChange={(e) => setDay(i, Number(e.target.value))}
            />
          </label>
        ))}
      </div>
      <div className="week__footer">
        <span className="hint">{total}h por semana</span>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="chip" onClick={() => onChange(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
