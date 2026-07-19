export default function StatusBar({
  label,
  value,
  total,
  color,
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span>
          {value}
        </span>
      </div>

      <div className="h-3 w-full rounded-full bg-base-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}