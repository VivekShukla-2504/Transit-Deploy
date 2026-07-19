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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <p className="text-sm font-medium text-base-100">{user?.name}</p>
        <p className="mono text-[11px] text-base-400">
          {ROLE_LABELS[user?.role] || user?.role}
        </p>

        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-base-700 bg-base-900 px-3 py-2 text-xs font-semibold text-base-200 shadow-sm hover:border-danger-500 hover:text-danger-500"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-base-950 text-base-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-base-700/80 bg-base-900/85 backdrop-blur md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
          aria-label="Close menu overlay"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-base-700/80 bg-base-900/95 backdrop-blur transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-base-700/80 bg-base-950/85 px-4 py-3 backdrop-blur md:hidden">
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

          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-base-400 hover:bg-base-800 hover:text-base-100"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>
    </div>
  );
}