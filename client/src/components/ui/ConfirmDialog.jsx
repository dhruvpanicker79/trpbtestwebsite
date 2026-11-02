import { useEffect, useRef } from 'react';
import { Spinner } from './Bits.jsx';

/** Minimal accessible confirm dialog built on the native <dialog> element. */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="w-[calc(100%-2rem)] max-w-md border border-ink-500 bg-ink-800 p-0 text-bone backdrop:bg-black/70"
    >
      <div className="p-6">
        <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
        {message && <p className="mt-2 text-sm text-ink-300">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn-red btn-sm" onClick={onConfirm} disabled={busy} autoFocus>
            {busy && <Spinner className="h-3.5 w-3.5" />} {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
