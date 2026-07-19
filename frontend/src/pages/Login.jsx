import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Route, ShieldCheck, Sparkles, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Field,
  Input,
  Select,
  Banner,
  PrimaryButton,
} from '../components/FormField';

const ROLES = [
  { value: 'FleetManager', label: 'Fleet Manager' },
  { value: 'Driver', label: 'Dispatcher' },
  { value: 'SafetyOfficer', label: 'Safety Officer' },
  { value: 'FinancialAnalyst', label: 'Financial Analyst' },
];

const HERO_SLIDES = [
  {
    title: 'Dispatch without the noise',
    subtitle: 'Track vehicles, drivers, and trips from a single control surface.',
    image: '/van.jpg',
    icon: Route,
  },
  {
    title: 'Safer routes, faster decisions',
    subtitle: 'Bring visibility to vehicle status, maintenance, and driver readiness.',
    image: '/van.jpg',
    icon: ShieldCheck,
  },
];

export default function Login() {
  const { login, register, forgotPassword, resetPassword, loading, error, setError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailUrl, setResetEmailUrl] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    role: 'FleetManager',
  });

  const update = (key) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: event.target.value,
    }));
  };

  const handleForgotPasswordClick = () => {
    setMode('forgot-password');
    setError('');
    setSuccessMessage('');
    setResetEmailUrl('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setResetEmailUrl('');

    if (mode === 'forgot-password') {
      const res = await forgotPassword(form.email, form.role);
      if (res.ok) {
        setSuccessMessage(res.message);
        if (res.previewUrl) {
          setResetEmailUrl(res.previewUrl);
        }
        // Switch to OTP verify & password reset mode
        setMode('reset-password');
      }
      return;
    }

    if (mode === 'reset-password') {
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(form.password)) {
        setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).");
        return;
      }

      const res = await resetPassword(form.email, form.otp, form.password);
      if (res.ok) {
        setSuccessMessage(res.message);
        setMode('login'); // go back to login mode
        setForm((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
          otp: '',
        }));
      }
      return;
    }

    if (mode === 'register') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(form.password)) {
        setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).");
        return;
      }
    }

    const ok =
      mode === 'login'
        ? await login(form.email, form.password, form.role)
        : await register(form);

    if (ok) navigate('/');
  };

  const currentSlide = HERO_SLIDES[0];

  return (
    <div className="min-h-dvh bg-base-950 p-4 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-8 right-8 z-20 rounded-xl border border-base-700 bg-base-900 p-3 text-base-400 hover:bg-base-800 hover:text-base-100 shadow-sm"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-7xl grid-cols-[1.15fr_0.85fr] overflow-hidden rounded-[2rem] border border-base-700 bg-base-900 shadow-[0_30px_90px_-45px_rgba(31,26,20,0.5)]">
        <section className="relative flex overflow-hidden border-r border-base-700 bg-gradient-to-br from-[#0c0f1a] via-[#12192c] to-[#070a12] flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(13,148,136,0.1),transparent_50%)]" />

          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-6 xl:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                <Compass className="h-6 w-6" strokeWidth={2.2} />
              </div>

              <div>
                <p className="font-display text-2xl font-semibold text-white">
                  TransitOps
                </p>
                <p className="mono text-[10px] uppercase tracking-[0.32em] text-white/70">
                  Fleet Control Platform
                </p>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center py-4 min-h-0 w-full">
              <div className="relative flex h-full min-h-[14rem] max-h-[22rem] xl:max-h-[26rem] w-full items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/5 overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)]">
                <img
                  key={currentSlide.image}
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover transition-opacity duration-700 ease-out"
                />
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-white/80 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Smart dispatch workspace
              </div>

              <h1 className="font-display text-4xl font-semibold leading-tight text-white xl:text-5xl">
                {currentSlide.title}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/78 sm:text-base">
                {currentSlide.subtitle}
              </p>
            </div>

            <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-6">
              <div className="flex items-center gap-3 text-white/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <currentSlide.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Live fleet imagery</p>
                  <p className="text-xs text-white/60">Auto-rotates every few seconds</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-10 py-10">
          <div className="w-full max-w-[26rem]">
            <div className="rounded-3xl border border-base-700 bg-base-900/80 p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] backdrop-blur sm:p-6">
              {mode === 'forgot-password' || mode === 'reset-password' ? (
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold">
                    {mode === 'forgot-password' ? 'Forgot Password' : 'Reset Password'}
                  </h2>
                  <p className="text-xs text-base-400 mt-1">
                    {mode === 'forgot-password'
                      ? 'Enter your email and role to request a 6-digit OTP code.'
                      : 'Enter the 6-digit OTP code and set your new password.'}
                  </p>
                </div>
              ) : (
                <div className="mb-5 flex gap-1 rounded-2xl bg-base-800 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className={`flex-1 rounded-xl px-2 py-2 text-sm transition ${mode === 'login'
                      ? 'bg-base-900 text-signal-600 shadow-sm'
                      : 'text-base-400'
                      }`}
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className={`flex-1 rounded-xl px-2 py-2 text-sm transition ${mode === 'register'
                      ? 'bg-base-900 text-signal-600 shadow-sm'
                      : 'text-base-400'
                      }`}
                  >
                    Create account
                  </button>
                </div>
              )}

              {successMessage && (
                <Banner tone="ok">
                  <div>
                    <p>{successMessage}</p>
                    {resetEmailUrl && (
                      <a
                        href={resetEmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block font-semibold underline text-teal-800 dark:text-teal-400 hover:opacity-80 text-xs"
                      >
                        [Dev Mode] Click here to open sent email preview 📧
                      </a>
                    )}
                  </div>
                </Banner>
              )}
              {error && <Banner tone="danger">{error}</Banner>}

              <form onSubmit={submit}>
                {mode === 'register' && (
                  <Field label="Full name" required>
                    <Input
                      value={form.name}
                      onChange={update('name')}
                      required
                      placeholder="Jordan Blake"
                    />
                  </Field>
                )}

                <Field label="Email" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    required
                    placeholder="you@company.com"
                    disabled={mode === 'reset-password'}
                    className={mode === 'reset-password' ? 'opacity-60 cursor-not-allowed' : ''}
                  />
                </Field>

                {mode === 'reset-password' && (
                  <Field label="OTP Code" required>
                    <Input
                      type="text"
                      value={form.otp}
                      onChange={update('otp')}
                      required
                      maxLength={6}
                      placeholder="123456"
                    />
                  </Field>
                )}

                {mode !== 'forgot-password' && (
                  <Field label={mode === 'reset-password' ? "New Password" : "Password"} required>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={update('password')}
                        required
                        className="pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-400 hover:text-base-100 transition"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {(mode === 'register' || mode === 'reset-password') && (
                      <p className="mt-1 text-[10px] text-base-400 leading-normal">
                        At least 8 chars, including 1 uppercase, 1 lowercase, 1 number, and 1 symbol.
                      </p>
                    )}
                  </Field>
                )}

                {mode === 'reset-password' && (
                  <Field label="Confirm Password" required>
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={update('confirmPassword')}
                      required
                      placeholder="••••••••"
                    />
                  </Field>
                )}

                {mode === 'login' && (
                  <div className="mb-4 text-right">
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="text-xs font-semibold text-signal-500 hover:text-signal-600 transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode !== 'reset-password' && (
                  <Field label="Role" required>
                    <Select value={form.role} onChange={update('role')}>
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}

                <PrimaryButton type="submit" disabled={loading} className="mt-2 w-full">
                  {loading
                    ? 'Please wait…'
                    : mode === 'login'
                      ? 'Sign in'
                      : mode === 'register'
                        ? 'Create account'
                        : mode === 'forgot-password'
                          ? 'Send OTP Code'
                          : 'Reset Password'}
                </PrimaryButton>

                {(mode === 'forgot-password' || mode === 'reset-password') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMessage('');
                      setResetEmailUrl('');
                    }}
                    className="mt-4 w-full text-center text-xs font-semibold text-base-400 hover:text-base-100 transition"
                  >
                    Back to Sign in
                  </button>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}