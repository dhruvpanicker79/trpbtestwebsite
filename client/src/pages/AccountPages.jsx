import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, FolderInput, Trash2 } from 'lucide-react';
import { articlesApi, miscApi, usersApi } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import ArticleCard from '../components/articles/ArticleCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Avatar, CardSkeleton, EmptyState, ErrorState, FieldError, Spinner } from '../components/ui/Bits.jsx';

function AccountTabs({ active }) {
  const tab = (to, label, key) => (
    <Link to={to} className={`-mb-px border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider ${active === key ? 'border-blood text-white' : 'border-transparent text-ink-300 hover:text-white'}`}>
      {label}
    </Link>
  );
  return (
    <nav className="mt-8 flex border-b border-ink-600" aria-label="Account">
      {tab('/account', 'Settings', 'settings')}
      {tab('/account/bookmarks', 'Reading lists', 'bookmarks')}
    </nav>
  );
}

export function AccountPage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    bio: user.bio || '',
    favouriteClub: user.favouriteClub || '',
    avatar: user.avatar || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  useSeo({ title: 'Account settings', noindex: true });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (body, which) => {
    setBusy(which);
    setErrors({});
    try {
      const { data } = await usersApi.updateMe(body);
      setUser(data);
      toast.success(which === 'password' ? 'Password updated.' : 'Profile saved.');
      if (which === 'password') setPw({ currentPassword: '', newPassword: '' });
      return true;
    } catch (err) {
      setErrors({ form: err.message, ...err.fieldErrors });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const onProfile = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your name.';
    if (!/^[a-z0-9_]{3,24}$/i.test(form.username)) errs.username = '3–24 characters: letters, numbers or underscores.';
    if (form.bio.length > 280) errs.bio = 'Keep your bio under 280 characters.';
    if (Object.keys(errs).length) return setErrors(errs);
    save({ ...form, username: form.username.toLowerCase() }, 'profile');
  };

  const onPassword = (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Enter your current password.';
    if (pw.newPassword.length < 8 || !/[A-Za-z]/.test(pw.newPassword) || !/[0-9]/.test(pw.newPassword)) {
      errs.newPassword = 'At least 8 characters with a letter and a number.';
    }
    if (Object.keys(errs).length) return setErrors(errs);
    save(pw, 'password');
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Avatar must be under 2 MB.');
    setBusy('avatar');
    try {
      const { data } = await miscApi.upload(file, 'avatar');
      setForm((f) => ({ ...f, avatar: data.url }));
      const { data: updated } = await usersApi.updateMe({ avatar: data.url });
      setUser(updated);
      toast.success('Avatar updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container-site max-w-3xl py-14">
      <h1 className="font-display text-5xl font-bold text-white">Your account</h1>
      <AccountTabs active="settings" />

      <form onSubmit={onProfile} noValidate className="mt-10 space-y-6">
        {errors.form && <p className="border-l-4 border-blood bg-blood/10 px-4 py-3 text-sm" role="alert">{errors.form}</p>}
        <div className="flex items-center gap-5">
          <Avatar user={{ ...user, avatar: form.avatar }} size={80} />
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            <button type="button" className="btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={busy === 'avatar'}>
              {busy === 'avatar' ? <Spinner className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />} Upload avatar
            </button>
            {form.avatar && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => setForm({ ...form, avatar: '' })}>
                Remove
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="acc-name">Name</label>
            <input id="acc-name" className={`field ${errors.name ? 'field-error' : ''}`} value={form.name} onChange={set('name')} />
            <FieldError>{errors.name}</FieldError>
          </div>
          <div>
            <label className="label" htmlFor="acc-username">Username</label>
            <input id="acc-username" className={`field ${errors.username ? 'field-error' : ''}`} value={form.username} onChange={set('username')} />
            <FieldError>{errors.username}</FieldError>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="acc-club">Favourite club</label>
          <input id="acc-club" className="field" value={form.favouriteClub} onChange={set('favouriteClub')} maxLength={60} />
        </div>
        <div>
          <label className="label" htmlFor="acc-bio">Bio</label>
          <textarea id="acc-bio" rows={3} className={`field ${errors.bio ? 'field-error' : ''}`} value={form.bio} onChange={set('bio')} />
          <div className="mt-1 flex justify-between">
            <FieldError>{errors.bio}</FieldError>
            <span className="ml-auto text-xs text-ink-400">{form.bio.length}/280</span>
          </div>
        </div>
        <button className="btn-red" disabled={busy === 'profile'}>
          {busy === 'profile' && <Spinner className="h-4 w-4" />} Save profile
        </button>
      </form>

      <form onSubmit={onPassword} noValidate className="mt-16 space-y-6 border-t border-ink-600 pt-10">
        <h2 className="font-display text-2xl font-semibold text-white">Change password</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="acc-cur">Current password</label>
            <input id="acc-cur" type="password" autoComplete="current-password" className={`field ${errors.currentPassword ? 'field-error' : ''}`} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <FieldError>{errors.currentPassword}</FieldError>
          </div>
          <div>
            <label className="label" htmlFor="acc-new">New password</label>
            <input id="acc-new" type="password" autoComplete="new-password" className={`field ${errors.newPassword ? 'field-error' : ''}`} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            <FieldError>{errors.newPassword}</FieldError>
          </div>
        </div>
        <button className="btn-ghost" disabled={busy === 'password'}>
          {busy === 'password' && <Spinner className="h-4 w-4" />} Update password
        </button>
      </form>
    </div>
  );
}

export function BookmarksPage() {
  const toast = useToast();
  const [list, setList] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload, setData } = useAsync(() => usersApi.bookmarks({ list, page, limit: 12 }), [list, page]);
  useSeo({ title: 'Reading lists', noindex: true });

  const lists = meta?.lists || [];

  const remove = async (b) => {
    try {
      await articlesApi.bookmark(b.article._id); // toggles off
      setData((items) => items.filter((x) => x._id !== b._id));
      toast.success('Removed from your reading list.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const move = async (b) => {
    const name = window.prompt('Move to which reading list? (existing or new name)', b.list);
    if (!name || !name.trim() || name.trim() === b.list) return;
    try {
      await usersApi.moveBookmark(b.article._id, name.trim().slice(0, 40));
      toast.success(`Moved to “${name.trim()}”.`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="container-site py-14">
      <h1 className="font-display text-5xl font-bold text-white">Your account</h1>
      <AccountTabs active="bookmarks" />

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Reading lists">
        <button onClick={() => { setList(''); setPage(1); }} aria-pressed={!list} className={`border px-3 py-1.5 text-xs font-semibold ${!list ? 'border-blood bg-blood text-white' : 'border-ink-500 text-bone'}`}>
          All saved
        </button>
        {lists.map((l) => (
          <button
            key={l.name}
            onClick={() => { setList(l.name); setPage(1); }}
            aria-pressed={list === l.name}
            className={`border px-3 py-1.5 text-xs font-semibold ${list === l.name ? 'border-blood bg-blood text-white' : 'border-ink-500 text-bone hover:border-bone'}`}
          >
            {l.name} <span className="opacity-70">({l.count})</span>
          </button>
        ))}
      </div>

      <div className="mt-10">
        {loading ? (
          <CardSkeleton count={3} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data?.length ? (
          <EmptyState title="Nothing saved yet" message="Tap “Save” on any story to add it to a reading list." action={<Link to="/" className="btn-red btn-sm">Browse stories</Link>} />
        ) : (
          <>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((b) => (
                <div key={b._id} className="flex flex-col">
                  <ArticleCard article={b.article} />
                  <div className="mt-4 flex items-center justify-between border-t border-ink-600 pt-3 text-xs">
                    <span className="text-ink-400">In “{b.list}”</span>
                    <span className="flex gap-3">
                      <button onClick={() => move(b)} className="inline-flex items-center gap-1 font-semibold text-ink-300 hover:text-white">
                        <FolderInput className="h-3.5 w-3.5" /> Move
                      </button>
                      <button onClick={() => remove(b)} className="inline-flex items-center gap-1 font-semibold text-ink-300 hover:text-blood-400">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pages={meta?.pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
