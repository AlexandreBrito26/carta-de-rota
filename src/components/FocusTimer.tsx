import { useEffect, useRef, useState } from "react";
import { celebrate } from "./Confetti";
import { askNotifyPermission, notifyDone, playChime } from "../logic/alerts";

const SESSION = 25 * 60;
const RING = 2 * Math.PI * 26;

interface FocusTimerProps {
  topicName: string;
  onFinish: (hours: number) => void;
}

// Sessão de foco de 25 minutos. Ao terminar, registra o tempo no tópico sozinha.
export default function FocusTimer({ topicName, onFinish }: FocusTimerProps) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(SESSION);
  const endAt = useRef(0);
  const finish = useRef(onFinish);
  finish.current = onFinish;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(id);
        setRunning(false);
        setOpen(false);
        setLeft(SESSION);
        finish.current(SESSION / 3600);
        celebrate({ power: 40 });
        playChime();
        notifyDone("Foco concluído", `25 minutos em ${topicName}. Horas registradas.`);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, topicName]);

  function start() {
    askNotifyPermission();
    endAt.current = Date.now() + left * 1000;
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    setOpen(false);
    setLeft(SESSION);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--small focus-open" onClick={() => setOpen(true)}>
        ⏱ Foco 25 min
      </button>
    );
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const offset = RING * (1 - left / SESSION);

  return (
    <div className="focus" role="group" aria-label={`Sessão de foco em ${topicName}`}>
      <svg className="focus__ring" viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r="26" className="focus__track" />
        <circle
          cx="30"
          cy="30"
          r="26"
          className="focus__progress"
          strokeDasharray={RING}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="focus__time" aria-live="off">{mm}:{ss}</span>
      <div className="focus__actions">
        {running ? (
          <button type="button" className="btn btn--small" onClick={() => setRunning(false)}>Pausar</button>
        ) : (
          <button type="button" className="btn btn--small btn--primary" onClick={start}>
            {left === SESSION ? "Começar" : "Continuar"}
          </button>
        )}
        <button type="button" className="btn btn--small" onClick={stop}>Parar</button>
      </div>
    </div>
  );
}
