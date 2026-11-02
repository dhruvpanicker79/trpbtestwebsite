import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Flag, Folders, LogOut, Menu, PenSquare, Users, UserSquare2, Vote, X, ExternalLink } from 'lucide-react';
import { Stamp } from '../components/ui/Logo.jsx';
import { Avatar } from '../components/ui/Bits.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSeo } from '../hooks/useSeo.js';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: BarChart3, end: true },
  { to: '/dashboard/articles', label: 'Articles', icon: FileText },
  { to: '/dashboard/articles/new', label: 'New article', icon: PenSquare },
  { to: '/dashboard/taxonomy', label: 'Categories & tags', icon: Folders, admin: true },
  { to: '/dashboard/players', label: 'Players', icon: UserSquare2, admin: true },
  { to: '/dashboard/polls', label: 'Polls', icon: Vote, admin: true },
  { to: '/dashboard/comments', label: 'Moderation', icon: Flag, admin: true },
  { to: '/dashboard/users', label: 'Users & roles', icon: Users, admin: true },
];

export default function DashboardLayout() {
  const { user, hasRole, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useSeo({ title: 'Dashboard', noindex: true });

  useEffect(() => setOpen(false), [location.pathname]);

  const items = NAV.filter((n) => !n.admin || hasRole('ADMIN'));

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5">
        <Stamp size={30} />
        <span className="leading-none">
          <span className="block font-display text-base font-bold uppercase text-white">TRPB Desk</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400">{user.role.toLowerCase()}</span>
        </span>
      </Link>
      <nav className="mt-2 flex-1 space-y-0.5 px-3" aria-label="Dashboard">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end || to.endsWith('/new')}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-blood text-white' : 'text-ink-300 hover:bg-ink-700 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-ink-600 p-3">
        <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-ink-300 hover:text-white">
          <ExternalLink className="h-4 w-4" /> View site
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-ink-300 hover:text-white">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <div className="flex items-center gap-3 px-3 pt-3">
          <Avatar user={user} size={30} />
          <span className="min-w-0 text-xs">
            <span className="block truncate font-semibold text-white">{user.name}</span>
            <span className="block truncate text-ink-400">@{user.username}</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-ink-600 bg-ink-900 lg:block">{sidebar}</aside>

      <div className="flex items-center justify-between border-b border-ink-600 bg-ink-900 px-4 py-3 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Stamp size={26} /> <span className="font-display font-bold uppercase text-white">TRPB Desk</span>
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open dashboard menu" className="p-2">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-ink-600 bg-ink-900">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 p-2">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}

/** Shared page header for dashboard screens. */
export function DashHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink-600 pb-5">
      <div>
        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-300">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    published: 'bg-bone text-ink',
    draft: 'border border-ink-400 text-ink-300',
    scheduled: 'bg-blood/20 text-blood-400 border border-blood/50',
    open: 'bg-bone text-ink',
    closed: 'border border-ink-400 text-ink-300',
    visible: 'bg-bone text-ink',
    hidden: 'bg-blood/20 text-blood-400',
  };
  return <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] || 'text-ink-300'}`}>{status}</span>;
}
