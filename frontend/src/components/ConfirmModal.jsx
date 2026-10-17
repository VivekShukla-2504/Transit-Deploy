import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
        aria-label="Close modal backdrop"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl border border-base-700 bg-base-900 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              danger
                ? 'bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30'
                : 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
            }`}
          >
            {danger ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-semibold text-base-100">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-base-400">{message}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-1 text-base-400 hover:bg-base-800 hover:text-base-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-base-700 bg-base-800/80 px-4 py-2 text-xs font-semibold text-base-200 hover:bg-base-750 hover:text-base-100 transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                : 'bg-signal-500 hover:bg-signal-600 focus:ring-signal-500'
            } disabled:opacity-50`}
          >
            {loading ? 'Please wait…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

