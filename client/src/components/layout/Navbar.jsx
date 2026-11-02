import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, LayoutDashboard, LogOut, Menu, Search, Settings, User, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { Avatar } from '../ui/Bits.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { NAV_CATEGORIES } from '../../utils/constants.js';
import { formatDate } from '../../utils/format.js';

function SearchBar({ onDone, autoFocus }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim().length < 2) return;
        navigate(`/search?q=${encodeURIComponent(q.trim())}`);
        setQ('');
        onDone?.();
      }}
      className="flex w-full items-center gap-3 border-b-2 border-bone pb-2"
    >
      <Search className="h-5 w-5 text-ink-300" aria-hidden />
      <label htmlFor="site-search" className="sr-only">
        Search articles, players and clubs
      </label>
      <input
        id="site-search"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search stories, players, clubs, tactics…"
        className="w-full min-w-0 bg-transparent font-display text-xl text-white placeholder:text-ink-400 focus:outline-none sm:text-3xl"
      />
      <button type="submit" className="btn-red btn-sm shrink-0">
        Search
      </button>
    </form>
  );
}

function AccountMenu() {
  const { user, logout, hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const item = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-bone hover:bg-ink-700';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar user={user} size={32} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-60 border border-ink-500 bg-ink-800 py-2 shadow-2xl">
          <div className="border-b border-ink-600 px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-ink-300">@{user.username} · {user.role.toLowerCase()}</p>
          </div>
          <Link role="menuitem" to={`/u/${user.username}`} className={item} onClick={() => setOpen(false)}>
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link role="menuitem" to="/account/bookmarks" className={item} onClick={() => setOpen(false)}>
            <Bookmark className="h-4 w-4" /> Reading lists
          </Link>
          <Link role="menuitem" to="/account" className={item} onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
          {hasRole('EDITOR') && (
            <Link role="menuitem" to="/dashboard" className={item} onClick={() => setOpen(false)}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}
          <button
            role="menuitem"
            className={`${item} border-t border-ink-600`}
            onClick={async () => {
              setOpen(false);
              await logout();
              toast.info('Signed out.');
              navigate('/');
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navLink = ({ isActive }) =>
    `kicker relative py-3 transition-colors ${isActive ? 'text-white after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-blood' : 'text-ink-300 hover:text-white'}`;

  return (
    // Solid background on purpose: backdrop-filter would trap the fixed mobile menu inside the header.
    <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-900">
      {/* Top strip */}
      <div className="hidden border-b border-ink-700 md:block">
        <div className="container-site flex h-8 items-center justify-between text-[11px] text-ink-300">
          <span className="uppercase tracking-[0.2em]">{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="font-bold text-ink-300">Football, Beyond The 90.</span>
          <span className="flex items-center gap-4 uppercase tracking-[0.2em]">
            <Link to="/players" className="hover:text-white">Players</Link>
            <Link to="/polls" className="hover:text-white">Polls</Link>
            <Link to="/about" className="hover:text-white">About</Link>
          </span>
        </div>
      </div>

      <div className="container-site flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Logo />
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-4">
          <button
            onClick={() => setSearchOpen((s) => !s)}
            className="grid h-10 w-10 place-items-center text-bone hover:text-white"
            aria-label="Open search (shortcut: /)"
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          {!loading &&
            (user ? (
              <AccountMenu />
            ) : (
              <div className="hidden items-center gap-3 sm:flex">
                <Link to="/login" className="kicker text-bone hover:text-white">
                  Sign in
                </Link>
                <Link to="/register" className="btn-red btn-sm">
                  Join
                </Link>
              </div>
            ))}
          <button
            className="grid h-10 w-10 place-items-center text-bone lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Category bar */}
      <nav className="hidden border-t border-ink-700 lg:block" aria-label="Sections">
        <div className="container-site flex items-center gap-8">
          <NavLink to="/" end className={navLink}>
            Front Page
          </NavLink>
          {NAV_CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/category/${c.slug}`} className={navLink}>
              {c.name}
            </NavLink>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full border-b border-ink-600 bg-ink-900 py-8"
          >
            <div className="container-site">
              <SearchBar autoFocus onDone={() => setSearchOpen(false)} />
              <p className="mt-3 text-xs text-ink-400">Press Esc to close · “/” opens search anywhere</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink-900 lg:hidden"
          >
            <div className="container-site flex h-16 items-center justify-between border-b border-ink-600">
              <Logo compact />
              <button className="grid h-10 w-10 place-items-center" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="container-site flex-1 py-8">
              <SearchBar onDone={() => setMenuOpen(false)} />
              <nav className="mt-10 flex flex-col" aria-label="Sections">
                <NavLink to="/" end className="border-b border-ink-700 py-4 font-display text-3xl font-semibold text-white">
                  Front Page
                </NavLink>
                {NAV_CATEGORIES.map((c) => (
                  <NavLink
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    className={({ isActive }) =>
                      `border-b border-ink-700 py-4 font-display text-3xl font-semibold ${isActive ? 'text-blood-400' : 'text-white'}`
                    }
                  >
                    {c.name}
                  </NavLink>
                ))}
                <div className="mt-6 flex gap-6">
                  <Link to="/players" className="kicker text-ink-300">Players</Link>
                  <Link to="/polls" className="kicker text-ink-300">Polls</Link>
                  <Link to="/about" className="kicker text-ink-300">About</Link>
                </div>
              </nav>
              {!user && (
                <div className="mt-10 grid grid-cols-2 gap-3">
                  <Link to="/login" className="btn-ghost">Sign in</Link>
                  <Link to="/register" className="btn-red">Join TRPB</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
