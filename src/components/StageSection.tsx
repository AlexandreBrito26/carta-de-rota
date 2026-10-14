import { useState } from "react";
import type { ScheduledTopic, Stage } from "../logic/plan";
import ConfirmButton from "./ConfirmButton";
import TopicCard, { type TopicActions } from "./TopicCard";

interface StageSectionProps {
  stage: Stage;
  items: ScheduledTopic[];
  stages: Stage[];
  actions: TopicActions;
  onRename: (name: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function StageSection({ stage, items, stages, actions, onRename, onRemove, canRemove }: StageSectionProps) {
  const [name, setName] = useState(stage.name);
  const estimated = items.reduce((sum, i) => sum + i.topic.estimatedHours, 0);
  const done = items.reduce((sum, i) => sum + Math.min(i.topic.doneHours, i.topic.estimatedHours), 0);
  const pct = estimated > 0 ? Math.round((done / estimated) * 100) : 0;

  function commitName() {
    const clean = name.trim();
    if (clean && clean !== stage.name) onRename(clean);
    else setName(stage.name);
  }

  return (
    <section className="stage" aria-labelledby={`stage-${stage.id}`}>
      <header className="stage__head">
        <input
          id={`stage-${stage.id}`}
          className="stage__name"
          value={name}
          maxLength={40}
          aria-label="Nome da etapa"
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
        <span className="stage__pct">{pct}%</span>
        {canRemove && (
          <ConfirmButton
            className="card__link card__link--danger"
            label="Excluir etapa"
            confirmLabel="Confirmar: apaga os tópicos"
            onConfirm={onRemove}
          />
        )}
      </header>
      <div className="stage__bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <ol className="route">
        {items.map((item) => (
          <TopicCard key={item.topic.id} item={item} stages={stages} actions={actions} />
        ))}
      </ol>
      {items.length === 0 && <p className="hint">Nenhum tópico nesta etapa com o filtro atual.</p>}
    </section>
  );
}
