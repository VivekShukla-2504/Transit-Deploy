import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import api from '../api/axios';
import KpiCard from '../components/KpiCard';

const Custom3DBar = (props) => {
  const { x, y, width, height, index } = props;
  if (width <= 0 || height <= 0) return null;

  // Render cylinder cap offset proportional to bar width
  const capHeight = Math.min(width * 0.25, 6);

  return (
    <g>
      {/* Cylinder body */}
      <path
        d={`M ${x},${y + capHeight} 
            L ${x},${y + height} 
            L ${x + width},${y + height} 
            L ${x + width},${y + capHeight} 
            Z`}
        fill={`url(#bar-grad-${index})`}
      />

      {/* Top Cap */}
      <ellipse
        cx={x + width / 2}
        cy={y + capHeight}
        rx={width / 2}
        ry={capHeight}
        fill={`url(#bar-cap-${index})`}
        stroke="#ffffff"
        strokeWidth={0.5}
        strokeOpacity={0.3}
      />
    </g>
  );
};

export default function Reports() {
  const [report, setReport] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      api.get('/reports/vehicles'),
      api.get('/reports/fleet-utilization'),
    ])
      .then(([reportResponse, utilizationResponse]) => {
        setReport(reportResponse.data);
        setUtilization(utilizationResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = async () => {
    setExporting(true);

    try {
      const response = await api.get('/reports/export.csv', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', 'transitops-vehicle-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setExporting(false);
    }
  };

  const BAR_COLORS = ['#4f46e5', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];

  const chartData = report.map((item) => ({
    name: item.registrationNumber,
    'Fuel Efficiency (km/L)': item.fuelEfficiencyKmPerLiter,
    'Operational Cost': item.operationalCost,
  }));

  const bubbleData = report.map((item) => ({
    name: item.registrationNumber,
    distance: item.totalDistanceKm,
    efficiency: item.fuelEfficiencyKmPerLiter,
    cost: item.operationalCost,
    size: item.operationalCost || 100,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">
            Reports &amp; Analytics
          </p>
          <h1 className="font-display text-2xl font-semibold">Fleet performance</h1>
        </div>

        <button
          onClick={exportCsv}
          disabled={exporting}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-base-600 px-4 py-2 text-sm text-base-100 hover:border-signal-500 hover:text-signal-500 disabled:opacity-50 sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {utilization && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <KpiCard label="Active Vehicles" value={utilization.activeVehicles} />
          <KpiCard
            label="On Trip Now"
            value={utilization.onTripVehicles}
            accent="#4f46e5"
          />
          <KpiCard
            label="Fleet Utilization"
            value={utilization.fleetUtilizationPercent}
            suffix="%"
            accent="#10b981"
          />
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Fuel Efficiency Bar Chart (3D Cylinder Form) */}
          <div className="rounded-3xl border border-base-700 bg-base-900 p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <p className="mb-4 font-display text-sm font-semibold text-base-100">
              Fuel efficiency by vehicle (km/L)
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <defs>
                  {BAR_COLORS.map((color, index) => (
                    <linearGradient key={`bar-grad-${index}`} id={`bar-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="30%" stopColor="#ffffff" stopOpacity={0.45} />
                      <stop offset="70%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#000000" stopOpacity={0.35} />
                    </linearGradient>
                  ))}
                  {BAR_COLORS.map((color, index) => (
                    <linearGradient key={`bar-cap-${index}`} id={`bar-cap-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6} />
                      <stop offset="100%" stopColor={color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--base-700)" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="var(--base-500)"
                  fontSize={11}
                  interval={0}
                />
                <YAxis stroke="var(--base-500)" fontSize={11} width={36} />
                <Tooltip
                  cursor={false} // Removes the grey hover background rectangle
                  contentStyle={{
                    background: 'var(--base-900)',
                    border: '1px solid var(--base-700)',
                    borderRadius: '12px',
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="Fuel Efficiency (km/L)"
                  shape={<Custom3DBar />}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost & Efficiency Bubble Chart (3D Solid Bubble Form) */}
          <div className="rounded-3xl border border-base-700 bg-base-900 p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <p className="mb-4 font-display text-sm font-semibold text-base-100">
              Operational Cost vs. Fuel Efficiency (3D Solid Bubble Form)
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  {BAR_COLORS.map((color, index) => (
                    <radialGradient key={`bubble-grad-${index}`} id={`bubble-grad-${index}`} cx="30%" cy="30%" r="70%" fx="25%" fy="25%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.65} />
                      <stop offset="45%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#000000" stopOpacity={0.45} />
                    </radialGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--base-700)" opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="distance"
                  name="Distance"
                  unit=" km"
                  stroke="var(--base-500)"
                  fontSize={11}
                />
                <YAxis
                  type="number"
                  dataKey="efficiency"
                  name="Efficiency"
                  unit=" km/L"
                  stroke="var(--base-500)"
                  fontSize={11}
                />
                <ZAxis
                  type="number"
                  dataKey="size"
                  range={[150, 1200]}
                  name="Operational Cost"
                  unit=" Rs"
                />
                <Tooltip
                  cursor={false} // Removes crosshair hover guides if desired
                  contentStyle={{
                    background: 'var(--base-900)',
                    border: '1px solid var(--base-700)',
                    borderRadius: '12px',
                    fontSize: 12,
                  }}
                />
                <Scatter name="Fleet Cost & Efficiency" data={bubbleData}>
                  {bubbleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#bubble-grad-${index})`} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <p className="mt-2 text-[10px] text-base-500 text-center">
              Bubble size represents total operational cost (fuel + maintenance).
            </p>
          </div>
        </div>
      )}

      <div className="scrollbar-thin overflow-x-auto rounded border border-base-700 bg-base-900">
        <table className="min-w-[1050px] w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Trips</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Fuel Eff.</th>
              <th className="px-4 py-3">Fuel Cost</th>
              <th className="px-4 py-3">Maint. Cost</th>
              <th className="px-4 py-3">Op. Cost</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400">
                  Loading…
                </td>
              </tr>
            ) : report.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400">
                  No data yet.
                </td>
              </tr>
            ) : (
              report.map((item) => (
                <tr
                  key={item.vehicleId}
                  className="border-b border-base-800 last:border-0 hover:bg-base-800/50"
                >
                  <td className="mono px-4 py-3">{item.registrationNumber}</td>
                  <td className="px-4 py-3">{item.totalTrips}</td>
                  <td className="px-4 py-3">{item.totalDistanceKm} km</td>
                  <td className="px-4 py-3">
                    {item.fuelEfficiencyKmPerLiter} km/L
                  </td>
                  <td className="px-4 py-3">{item.totalFuelCost}</td>
                  <td className="px-4 py-3">{item.totalMaintenanceCost}</td>
                  <td className="px-4 py-3">{item.operationalCost}</td>
                  <td className="px-4 py-3">{item.totalRevenue}</td>
                  <td className="px-4 py-3">
                    <span
                      className={item.roi >= 0 ? 'text-ok-500' : 'text-danger-500'}
                    >
                      {(item.roi * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}