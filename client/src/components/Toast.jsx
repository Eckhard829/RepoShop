import { useEffect, useState, useCallback } from "react";
import { subscribeToast } from "./toastBus";
import "./Toast.css";

const DEFAULT_DURATION = 4000;

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(
      () => onClose(toast.id),
      toast.duration ?? DEFAULT_DURATION,
    );
    return () => clearTimeout(t);
  }, [toast, onClose]);

  const cls = `toast toast--${toast.type || "info"}`;
  return (
    <div className={cls} role={toast.type === "err" ? "alert" : "status"}>
      <span className="toast__dot" />
      <span className="toast__msg">{toast.message}</span>
      <button
        className="toast__close"
        aria-label="Dismiss"
        onClick={() => onClose(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const close = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast].slice(-4)); // max 4 on screen
    });
  }, []);

  return (
    <>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={close} />
        ))}
      </div>
    </>
  );
}
