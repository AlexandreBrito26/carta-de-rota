import { useState, type FormEvent } from "react";
import type { Stage, Topic } from "../logic/plan";

export interface TopicInput {
  stageId: string;
  name: string;
  estimatedHours: number;
  deadline: string;
}

interface TopicFormProps {
  stages: Stage[];
  defaultStageId: string;
  defaultDeadline: string;
  initial?: Topic;
  submitLabel: string;
  onSubmit: (data: TopicInput) => void;
  onCancel?: () => void;
}

export default function TopicForm({ stages, defaultStageId, defaultDeadline, initial, submitLabel, onSubmit, onCancel }: TopicFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [hours, setHours] = useState(initial ? String(initial.estimatedHours) : "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? defaultDeadline);
  const [stageId, setStageId] = useState(initial?.stageId ?? defaultStageId);
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const estimatedHours = Number(hours.replace(",", "."));
    if (!name.trim()) return setError("Dê um nome ao tópico.");
    if (!Number.isFinite(estimatedHours) || estimatedHours <= 0 || estimatedHours > 500) {
      return setError("Informe entre 0,5 e 500 horas.");
    }
    if (!deadline) return setError("Escolha um prazo.");
    setError(null);
    onSubmit({ stageId, name: name.trim(), estimatedHours, deadline });
    if (!initial) {
      setName("");
      setHours("");
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <label className="field">
        <span>Tópico</span>
        <input id={initial ? undefined : "novo-topico"} value={name} maxLength={60} placeholder="Ex.: Hooks avançados no React" onChange={(e) => setName(e.target.value)} autoFocus={!!initial} />
      </label>
      <div className="form__row">
        <label className="field">
          <span>Etapa</span>
          <select value={stageId} onChange={(e) => setStageId(e.target.value)}>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Horas estimadas</span>
          <input inputMode="decimal" value={hours} placeholder="Ex.: 6" onChange={(e) => setHours(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Prazo</span>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </label>
      {error && <p className="form__error" role="alert">{error}</p>}
      <div className="form__actions">
        <button type="submit" className="btn btn--primary">{submitLabel}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
