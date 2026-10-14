import { useCountUp } from "../hooks/useCountUp";

interface StatProps {
  value: number;
  suffix?: string;
  label: string;
  tone?: "ok" | "alert";
  bar?: number;
}

export default function Stat({ value, suffix = "", label, tone, bar }: StatProps) {
  const shown = useCountUp(value);
  return (
    <div className={`summary__item ${tone ? `summary__item--${tone}` : ""}`}>
      <span className="summary__value">{Math.round(shown)}{suffix}</span>
      <span className="summary__label">{label}</span>
      {bar !== undefined && (
        <div className="summary__bar" aria-hidden="true">
          <span style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}
