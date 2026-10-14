import type { ThemeMode } from "../logic/plan";

const NEXT: Record<ThemeMode, ThemeMode> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemeMode, string> = { system: "Automático", light: "Dia", dark: "Noite" };
const ICON: Record<ThemeMode, string> = { system: "◐", light: "☀", dark: "☾" };

interface ThemeToggleProps {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}

export default function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onChange(NEXT[theme])}
      aria-label={`Tema: ${LABEL[theme]}. Trocar para ${LABEL[NEXT[theme]]}`}
      title={`Tema: ${LABEL[theme]}`}
    >
      <span aria-hidden="true">{ICON[theme]}</span>
      <span>{LABEL[theme]}</span>
    </button>
  );
}
