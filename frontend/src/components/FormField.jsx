export function Field({ label, children, required }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-base-400">
        {label} {required && <span className="text-danger-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const baseInputClasses =
  'min-h-11 w-full rounded-xl border border-base-700 bg-base-900 px-3 py-2 text-base text-base-100 shadow-sm shadow-base-200/5 placeholder:text-base-500 focus:border-signal-500 focus:outline-none focus:ring-2 focus:ring-signal-500/15 sm:text-sm';

export function Input(props) {
  return (
    <input
      {...props}
      className={`${baseInputClasses} ${props.className || ''}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`${baseInputClasses} ${props.className || ''}`}
    >
      {children}
    </select>
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`${baseInputClasses} min-h-24 resize-y ${props.className || ''}`}
    />
  );
}

export function Banner({ tone = 'danger', children }) {
  const colorMap = {
    danger: 'border-danger-500/30 bg-danger-500/10 text-danger-500',
    ok: 'border-ok-500/30 bg-ok-500/10 text-ok-500',
    warn: 'border-warn-500/30 bg-warn-500/10 text-warn-500',
  };

  return (
    <div className={`mb-4 break-words rounded border px-3 py-2 text-sm ${colorMap[tone]}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-xl bg-signal-500 px-4 py-2 text-sm font-semibold text-white shadow-[var(--btn-shadow)] transition hover:bg-signal-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-xl border border-base-700 bg-base-900 px-4 py-2 text-sm font-semibold text-base-100 shadow-sm shadow-base-200/5 transition hover:border-base-600 hover:bg-base-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}