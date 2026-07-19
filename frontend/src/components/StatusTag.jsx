const COLOR_MAP = {
  // Vehicle statuses
  Available: '#3fb8af',
  'On Trip': '#4c8bf5',
  'In Shop': '#f2a93b',
  Retired: '#e2574c',
  // Driver statuses
  'Off Duty': '#75838d',
  Suspended: '#e2574c',
  // Trip statuses
  Draft: '#75838d',
  Dispatched: '#4c8bf5',
  Completed: '#3fb8af',
  Cancelled: '#e2574c',
  // Maintenance
  Open: '#f2a93b',
  Closed: '#3fb8af',
};

export default function StatusTag({ status }) {
  const color = COLOR_MAP[status] || '#75838d';
  return (
    <span className="tag" style={{ color }}>
      {status}
    </span>
  );
}
