import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
  Compass,
  Menu,
  X,
  Sun,
  Moon,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vehicles', label: 'Vehicle Registry', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trips', icon: RouteIcon },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const ROLE_LABELS = {
  FleetManager: 'Fleet Manager',
  Driver: 'Driver',
  SafetyOfficer: 'Safety Officer',
  FinancialAnalyst: 'Financial Analyst',
};

export default function Layout({ children }) {
  const { user, logout, claimRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [targetRole, setTargetRole] = useState('FleetManager');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimError, setClaimError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClaimRole = async (e) => {
    e.preventDefault();
    setClaimError('');
    if (!adminKey.trim()) {
      setClaimError('Please enter the organization admin key.');
      return;
    }
    setSubmittingClaim(true);
    const res = await claimRole(targetRole, adminKey.trim());
    setSubmittingClaim(false);
    if (res.ok) {
      toast.success(`Role upgraded to ${ROLE_LABELS[targetRole] || targetRole}!`);
      setClaimModalOpen(false);
      setAdminKey('');
    } else {
      setClaimError(res.message);
      toast.error(res.message);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between border-b border-base-700/80 px-5 py-5">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-signal-500" strokeWidth={2.2} />
          <div>
            <p className="font-display text-base font-semibold leading-none tracking-tight">
              TransitOps
            </p>
            <p className="mono mt-1 text-[10px] uppercase tracking-widest text-base-400">
              Fleet Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-base-400 hover:bg-base-800 hover:text-base-100"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-base-400 hover:bg-base-800 hover:text-base-100 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-signal-500/10 text-signal-600 shadow-sm ring-1 ring-inset ring-signal-500/20'
                  : 'text-base-200 hover:bg-base-800 hover:text-base-100'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-base-700/80 p-4">
        <p className="text-sm font-medium text-base-100 truncate">{user?.name}</p>
        <div className="mt-1 flex items-center justify-between">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              user?.role === 'FleetManager'
                ? 'border border-amber-500/30 bg-amber-500/15 text-amber-500'
                : 'border border-base-700 bg-base-800 text-base-400'
            }`}
          >
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>

        {user?.role !== 'FleetManager' && (
          <button
            type="button"
            onClick={() => {
              setClaimModalOpen(true);
              setClaimError('');
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 shadow-sm transition hover:bg-amber-500/20"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Enter Admin Key</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="mt-2.5 flex w-full items-center gap-2 rounded-xl border border-base-700 bg-base-900 px-3 py-2 text-xs font-semibold text-base-200 shadow-sm hover:border-danger-500 hover:text-danger-500"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-base-950 text-base-100 print:h-auto print:overflow-visible print:bg-white print:text-black">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-base-700/80 bg-base-900/85 backdrop-blur md:flex print:hidden">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden print:hidden"
          aria-label="Close menu overlay"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-base-700/80 bg-base-900/95 backdrop-blur transition-transform duration-300 md:hidden print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto print:overflow-visible print:h-auto print:p-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-base-700/80 bg-base-950/85 px-4 py-3 backdrop-blur md:hidden print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1 text-base-200 hover:bg-base-800"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-signal-500" />
              <span className="font-display font-semibold">TransitOps</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role !== 'FleetManager' && (
              <button
                onClick={() => {
                  setClaimModalOpen(true);
                  setClaimError('');
                }}
                className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500"
                title="Enter Organization Key to elevate role"
              >
                <KeyRound className="h-3 w-3" />
                <span>Admin Key</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="rounded-xl p-2 text-base-400 hover:bg-base-800 hover:text-base-100"
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7 print:max-w-none print:p-0">
          {children}
        </div>
      </main>

      {/* Role Upgrade Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-base-700 bg-base-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-base-100">
                    Authorize Role Access
                  </h3>
                  <p className="text-xs text-base-400">
                    Unlock administrative permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                className="rounded-lg p-1 text-base-400 hover:bg-base-800 hover:text-base-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleClaimRole} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-300">
                  Select Desired Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-base-700 bg-base-800 px-3.5 py-2.5 text-sm text-base-100 focus:border-signal-500 focus:outline-none"
                >
                  <option value="FleetManager">Fleet Manager (Full Super-Admin Control)</option>
                  <option value="SafetyOfficer">Safety Officer (Driver & Compliance Lead)</option>
                  <option value="FinancialAnalyst">Financial Analyst (Audits & ROI Lead)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-300">
                  Organization Secret Key
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter organization authorization key"
                    required
                    className="w-full rounded-xl border border-base-700 bg-base-800 pl-9 pr-3.5 py-2.5 text-sm text-base-100 focus:border-signal-500 focus:outline-none"
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-signal-500" />
                </div>
              </div>

              {claimError && (
                <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-xs text-danger-400">
                  {claimError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="rounded-xl border border-base-700 bg-base-800 px-4 py-2.5 text-xs font-semibold text-base-300 hover:bg-base-700 hover:text-base-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="flex items-center gap-1.5 rounded-xl bg-signal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-signal-500 transition disabled:opacity-50"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{submittingClaim ? 'Verifying…' : 'Authorize & Upgrade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}