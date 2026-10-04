import { AlertCircle, Inbox, Loader2 } from "lucide-react";

// Loading, empty and error states used across the app.
export function Loader({ text = "Loading..." }) {
  return (
    <div className="state">
      <Loader2 className="spin" size={28} />
      <p>{text}</p>
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="state">
      <Inbox size={36} />
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="alert alert-error" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-small btn-outline" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
