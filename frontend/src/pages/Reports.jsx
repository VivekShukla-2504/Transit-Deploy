import { useEffect, useState } from 'react';
import { Download, Printer, Calendar, FileSpreadsheet, ChevronDown } from 'lucide-react';
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
import { useToast } from '../context/ToastContext';

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
  const toast = useToast();
  const [report, setReport] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState(null);

  // Date filter state
  const [datePreset, setDatePreset] = useState('all'); // 'all' | '30d' | '90d' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === '90d') {
      const past = new Date();
      past.setDate(now.getDate() - 90);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  const loadData = () => {
    setLoading(true);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    Promise.all([
      api.get('/reports/vehicles', { params }),
      api.get('/reports/fleet-utilization'),
    ])
      .then(([reportResponse, utilizationResponse]) => {
        setReport(reportResponse.data);
        setUtilization(utilizationResponse.data);
      })
      .catch((err) => {
        toast.error('Could not load reports data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const exportReport = async (type) => {
    setExportingType(type);
    setExportMenuOpen(false);

    try {
      let endpoint = '/reports/export.csv';
      let filename = 'transitops-vehicle-report.csv';
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      if (type === 'trips') {
        endpoint = '/reports/trips/export.csv';
        filename = 'transitops-trips-report.csv';
      } else if (type === 'drivers') {
        endpoint = '/reports/drivers/export.csv';
        filename = 'transitops-drivers-report.csv';
      }

      const response = await api.get(endpoint, {
        params: type === 'drivers' ? {} : params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded.`);
    } catch (err) {
      toast.error(`Failed to export ${type} report.`);
    } finally {
      setExportingType(null);
    }
  };

  const handlePrint = () => {
    window.print();
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
      {/* Print-Only Official Executive Header */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight">TRANSITOPS FLEET OPERATIONS</h1>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-700">
              Executive Fleet Analytics &amp; Audit Report
            </p>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-900">
              Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
            <p>
              Reporting Window:{' '}
              {datePreset === 'all'
                ? 'All Time (Full Fleet History)'
                : `${startDate || 'Start'} to ${endDate || 'Present'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Header & Action Hub */}
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">
            Reports &amp; Analytics
          </p>
          <h1 className="font-display text-2xl font-semibold">Fleet performance</h1>
        </div>

        {/* Date Filter Controls & Export Actions */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Preset Buttons */}
          <div className="flex rounded-xl border border-base-700 bg-base-900 p-0.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  datePreset === preset.id
                    ? 'bg-signal-500/15 text-signal-500 shadow-sm'
                    : 'text-base-400 hover:text-base-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 rounded-xl border border-base-700 bg-base-900 px-2 py-1 text-xs">
              <Calendar className="h-3.5 w-3.5 text-base-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-base-200 focus:outline-none"
                placeholder="From"
              />
              <span className="text-base-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-base-200 focus:outline-none"
                placeholder="To"
              />
            </div>
          )}

          {/* Export Hub Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={Boolean(exportingType)}
              className="flex items-center gap-1.5 rounded-xl border border-base-700 bg-base-900 px-3 py-1.5 text-xs font-semibold text-base-100 hover:border-signal-500 hover:text-signal-500 transition disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exportingType ? `Exporting ${exportingType}…` : 'Export CSV'}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-xl border border-base-700 bg-base-900/95 py-1 shadow-xl backdrop-blur">
                  <button
                    onClick={() => exportReport('vehicles')}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-base-200 hover:bg-base-800 hover:text-signal-500"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Vehicles Report (.csv)
                  </button>
                  <button
                    onClick={() => exportReport('trips')}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-base-200 hover:bg-base-800 hover:text-signal-500"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Trips Registry (.csv)
                  </button>
                  <button
                    onClick={() => exportReport('drivers')}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-base-200 hover:bg-base-800 hover:text-signal-500"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Drivers Registry (.csv)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-base-700 bg-base-900 px-3 py-1.5 text-xs font-semibold text-base-100 hover:border-signal-500 hover:text-signal-500 transition"
            title="Print or Save as PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
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
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2 print:hidden">
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

      {/* Vehicle Analytics Table with Print Optimization */}
      <div className="scrollbar-thin overflow-x-auto rounded border border-base-700 bg-base-900 print:border-black print:bg-white print:overflow-visible">
        <table className="min-w-[1050px] w-full text-sm print:min-w-full print:text-black print:text-xs">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400 print:border-b-2 print:border-black print:text-black">
              <th className="px-4 py-3 print:py-2">Vehicle</th>
              <th className="px-4 py-3 print:py-2">Trips</th>
              <th className="px-4 py-3 print:py-2">Distance</th>
              <th className="px-4 py-3 print:py-2">Fuel Eff.</th>
              <th className="px-4 py-3 print:py-2">Fuel Cost</th>
              <th className="px-4 py-3 print:py-2">Maint. Cost</th>
              <th className="px-4 py-3 print:py-2">Op. Cost</th>
              <th className="px-4 py-3 print:py-2">Revenue</th>
              <th className="px-4 py-3 print:py-2">ROI</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400 print:text-black">
                  Loading…
                </td>
              </tr>
            ) : report.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400 print:text-black">
                  No data found for the selected reporting period.
                </td>
              </tr>
            ) : (
              report.map((item) => (
                <tr
                  key={item.vehicleId}
                  className="border-b border-base-800 last:border-0 hover:bg-base-800/50 print:border-gray-300 print:hover:bg-transparent"
                >
                  <td className="mono px-4 py-3 font-medium print:py-1.5 print:text-black">{item.registrationNumber}</td>
                  <td className="px-4 py-3 print:py-1.5 print:text-black">{item.totalTrips}</td>
                  <td className="px-4 py-3 print:py-1.5 print:text-black">{item.totalDistanceKm} km</td>
                  <td className="px-4 py-3 print:py-1.5 print:text-black">
                    {item.fuelEfficiencyKmPerLiter} km/L
                  </td>
                  <td className="px-4 py-3 print:py-1.5 print:text-black">₹{item.totalFuelCost.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 print:py-1.5 print:text-black">₹{item.totalMaintenanceCost.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 print:py-1.5 font-medium print:text-black">₹{item.operationalCost.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 print:py-1.5 font-medium print:text-black">₹{item.totalRevenue.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 print:py-1.5">
                    <span
                      className={`font-semibold ${
                        item.roi >= 0 ? 'text-ok-500 print:text-black' : 'text-danger-500 print:text-black'
                      }`}
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

      {/* Print-Only Audit Authorization Block */}
      <div className="hidden print:flex mt-12 justify-between items-end border-t border-gray-400 pt-6 text-xs text-black">
        <div>
          <p className="font-semibold">TransitOps Automated Fleet Audit</p>
          <p className="text-gray-600">Generated securely via internal fleet records.</p>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="font-medium">Authorized Officer Signature:</span>
            <span className="border-b border-black w-48 inline-block"></span>
          </div>
          <div className="flex gap-4">
            <span className="font-medium">Audit Review Date:</span>
            <span className="border-b border-black w-36 inline-block"></span>
          </div>
        </div>
      </div>
    </div>
  );
}