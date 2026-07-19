export default function KpiCard({ label, value, suffix, accent }) {
  return (
    <div className="min-w-0 rounded-2xl border border-base-700 bg-base-900 p-4 shadow-[0_18px_50px_-35px_rgba(31,26,20,0.35)] sm:p-5">
      <div
        className="mb-4 h-1.5 w-14 rounded-full"
        style={{ backgroundColor: accent || '#d39a10' }}
      />

      <p className="mono truncate text-[10px] uppercase tracking-[0.28em] text-base-400">
        {label}
      </p>

      <p className="mt-2 break-words font-display text-3xl font-semibold leading-none text-base-100 sm:text-4xl">
        {value}
        {suffix ? (
          <span className="ml-1 text-base text-base-400 sm:text-lg">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}