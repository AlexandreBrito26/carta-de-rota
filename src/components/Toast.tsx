export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string | null;
  action?: ToastAction | null;
}

export default function Toast({ message, action }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite" data-visible={!!message}>
      <span>{message}</span>
      {action && (
        <button type="button" className="toast__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
