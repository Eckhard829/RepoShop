// Tiny pub/sub so non-React code (api.js) can push toasts
// into the React toast provider.

const listeners = new Set();

export function subscribeToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitToast({ type = "info", message, duration }) {
  listeners.forEach((fn) =>
    fn({ id: Math.random().toString(36).slice(2), type, message, duration }),
  );
}

export const toastOk = (message, duration) =>
  emitToast({ type: "ok", message, duration });
export const toastErr = (message, duration) =>
  emitToast({ type: "err", message, duration });
export const toastInfo = (message, duration) =>
  emitToast({ type: "info", message, duration });
