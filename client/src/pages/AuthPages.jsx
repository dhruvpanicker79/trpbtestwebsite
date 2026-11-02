import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSeo } from '../hooks/useSeo.js';
import Img from '../components/ui/Img.jsx';
import { Stamp } from '../components/ui/Logo.jsx';
import { FieldError, Spinner } from '../components/ui/Bits.jsx';

const COVER = 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1400&q=80';

function Field({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className={`field ${error ? 'field-error' : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </div>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Img src={COVER} alt="" eager className="absolute inset-0" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <div className="absolute bottom-0 p-12">
          <Stamp size={56} />
          <p className="mt-6 max-w-md font-display text-5xl font-bold leading-[1] text-white">Football, Beyond The 90.</p>
          <p className="mt-4 max-w-sm text-lg text-ink-300">Comment, vote, rate players and build your reading lists.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">{title}</h1>
          <p className="mt-3 text-ink-300">{subtitle}</p>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useSeo({ title: 'Sign in', noindex: true });

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Enter your email or username.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const u = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${u.name.split(' ')[0]}.`);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: err.message, ...err.fieldErrors });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to the Playbook.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {errors.form && <p className="border-l-4 border-blood bg-blood/10 px-4 py-3 text-sm text-bone" role="alert">{errors.form}</p>}
        <Field id="email" label="Email or username" autoComplete="username" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" disabled={busy} className="btn-red w-full">
          {busy && <Spinner className="h-4 w-4" />} Sign in
        </button>
      </form>
      <p className="mt-8 text-sm text-ink-300">
        New here? <Link to="/register" state={location.state} className="link-underline font-semibold text-bone">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useSeo({ title: 'Join TRPB', noindex: true });

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your name.';
    if (!/^[a-z0-9_]{3,24}$/i.test(form.username.trim())) e.username = '3–24 characters: letters, numbers or underscores.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'At least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) e.password = 'Include at least one letter and one number.';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), username: form.username.trim().toLowerCase(), email: form.email.trim() });
      toast.success('Account created. Welcome to TRPB.');
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: err.message, ...err.fieldErrors });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Join TRPB" subtitle="Free account. Comment, vote, rate and save stories.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {errors.form && <p className="border-l-4 border-blood bg-blood/10 px-4 py-3 text-sm text-bone" role="alert">{errors.form}</p>}
        <Field id="name" label="Name" autoComplete="name" value={form.name} error={errors.name} onChange={set('name')} />
        <Field id="username" label="Username" autoComplete="username" value={form.username} error={errors.username} onChange={set('username')} />
        <Field id="email" label="Email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={set('email')} />
        <Field id="password" label="Password" type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={set('password')} />
        <button type="submit" disabled={busy} className="btn-red w-full">
          {busy && <Spinner className="h-4 w-4" />} Create account
        </button>
      </form>
      <p className="mt-8 text-sm text-ink-300">
        Already a member? <Link to="/login" state={location.state} className="link-underline font-semibold text-bone">Sign in</Link>
      </p>
    </AuthShell>
  );
}
