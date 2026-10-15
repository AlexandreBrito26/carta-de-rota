import { useState } from "react";
import { formatDay, parseDay, STATUS_LABEL, STATUS_TONE, topicProgress, type Stage, type ScheduledTopic } from "../logic/plan";
import ConfirmButton from "./ConfirmButton";
import FocusTimer from "./FocusTimer";
import TopicForm, { type TopicInput } from "./TopicForm";

export interface TopicActions {
  log: (id: string, hours: number) => void;
  complete: (id: string) => void;
  reopen: (id: string) => void;
  edit: (id: string, data: TopicInput) => void;
  remove: (id: string) => void;
}

interface TopicCardProps {
  item: ScheduledTopic;
  stages: Stage[];
  actions: TopicActions;
}

export default function TopicCard({ item, stages, actions }: TopicCardProps) {
  const { topic, remaining, finishDate, status } = item;
  const [editing, setEditing] = useState(false);
  const [logValue, setLogValue] = useState("");
  const tone = STATUS_TONE[status];
  const progress = topicProgress(topic);
  const done = status === "done";
  const noCapacity = !done && finishDate === null;

  function logHours() {
    const value = Number(logValue.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;
    actions.log(topic.id, value);
    setLogValue("");
  }

  if (editing) {
    return (
      <li className="card card--editing">
        <TopicForm
          stages={stages}
          defaultStageId={topic.stageId}
          defaultDeadline={topic.deadline}
          initial={topic}
          submitLabel="Salvar"
          onSubmit={(data) => {
            actions.edit(topic.id, data);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`card card--${tone}`}>
      <div className="card__head">
        <h3 className="card__title">{topic.name}</h3>
        <span className={`badge badge--${tone}`}>{STATUS_LABEL[status]}</span>
      </div>

      <div className="card__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso de ${topic.name}`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <dl className="card__meta">
        <div>
          <dt>Feito</dt>
          <dd>{topic.doneHours}h de {topic.estimatedHours}h</dd>
        </div>
        <div>
          <dt>Prazo</dt>
          <dd>{formatDay(parseDay(topic.deadline))}</dd>
        </div>
        <div>
          <dt>Previsão</dt>
          <dd>{done ? "—" : finishDate ? formatDay(finishDate) : "sem horas na semana"}</dd>
        </div>
      </dl>

      {noCapacity && <p className="card__note">Adicione horas nos dias da semana para ver a previsão.</p>}

      {done ? (
        <div className="card__actions">
          <button type="button" className="btn btn--small" onClick={() => actions.reopen(topic.id)}>Reabrir</button>
        </div>
      ) : (
        <div className="card__log">
          <FocusTimer topicName={topic.name} onFinish={(hours) => actions.log(topic.id, hours)} />
          <input
            inputMode="decimal"
            placeholder={`Horas feitas (faltam ${remaining}h)`}
            value={logValue}
            aria-label={`Horas feitas em ${topic.name}`}
            onChange={(e) => setLogValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && logHours()}
          />
          <button type="button" className="btn btn--small" onClick={logHours}>Registrar</button>
          <button type="button" className="btn btn--small" onClick={() => actions.complete(topic.id)}>Concluir</button>
        </div>
      )}

      <div className="card__footer">
        <button type="button" className="card__link" onClick={() => setEditing(true)}>Editar</button>
        <ConfirmButton
          className="card__link card__link--danger"
          label="Excluir"
          confirmLabel="Confirmar exclusão"
          onConfirm={() => actions.remove(topic.id)}
        />
      </div>
    </li>
  );
}
