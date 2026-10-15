interface WeekGoalProps {
  goal: number;
  done: number;
  onChange: (goal: number) => void;
}

export default function WeekGoal({ goal, done, onChange }: WeekGoalProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  return (
    <div className="goal">
      <label className="field goal__field">
        <span>Meta semanal (horas)</span>
        <input
          type="number"
          min={0}
          max={168}
          step={0.5}
          value={goal}
          onChange={(e) => onChange(Math.min(168, Math.max(0, Number(e.target.value) || 0)))}
        />
      </label>
      {goal > 0 ? (
        <>
          <div className="goal__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da meta semanal">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="hint">
            {done}h de {goal}h esta semana{pct >= 100 ? " · meta batida!" : ""}
          </p>
        </>
      ) : (
        <p className="hint">Defina uma meta para acompanhar a semana.</p>
      )}
    </div>
  );
}
