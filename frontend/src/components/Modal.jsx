import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children, width = 'max-w-lg' }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-[#241c120f] backdrop-blur-sm sm:items-center sm:justify-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-base-700 bg-base-900 shadow-[0_30px_90px_-35px_rgba(31,26,20,0.45)] sm:max-h-[85vh] sm:rounded-2xl ${width}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-base-700/80 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="font-display text-base font-semibold">{title}</h3>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-base-400 hover:bg-base-800 hover:text-base-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <div className="scrollbar-thin min-h-0 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}