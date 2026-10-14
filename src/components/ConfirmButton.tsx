import { useEffect, useState } from "react";

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}

// Primeiro clique arma o botão; o segundo confirma. Desarma sozinho após 3 segundos.
export default function ConfirmButton({ label, confirmLabel, onConfirm, className = "" }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      className={`${className} ${armed ? "is-armed" : ""}`.trim()}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      aria-live="polite"
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
