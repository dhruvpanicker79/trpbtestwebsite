import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { playersApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import ImageField from '../../components/dashboard/ImageField.jsx';
import { ErrorState, FieldError, PageLoader, Spinner } from '../../components/ui/Bits.jsx';
import { DashHeader } from '../../layouts/DashboardLayout.jsx';

const EMPTY = {
  name: '', slug: '', portrait: '', nationality: '', position: '', currentClub: '', born: '', preferredFoot: '',
  summary: '', timeline: [], achievements: [], isSample: false,
};

const pick = (p) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] ?? EMPTY[k]])),
  timeline: (p.timeline || []).map(({ club, from, to, note, loan }) => ({ club, from, to: to || '', note: note || '', loan: Boolean(loan) })),
  achievements: (p.achievements || []).map(({ title, year, detail }) => ({ title, year: year || '', detail: detail || '' })),
});

export default function PlayerEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const existing = useAsync(() => (isNew ? Promise.resolve({ data: null }) : playersApi.getById(id)), [id]);
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing.data) setF(pick(existing.data));
  }, [existing.data]);

  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setRow = (key, i, patch) => set({ [key]: f[key].map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (f.name.trim().length < 2) errs.name = 'Name is required.';
    if (f.timeline.some((t) => !t.club.trim() || !t.from.trim())) errs.timeline = 'Each timeline entry needs a club and a start season.';
    if (f.achievements.some((a) => !a.title.trim())) errs.achievements = 'Each achievement needs a title.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const body = { ...f, slug: f.slug.trim() || undefined };
      const { data } = isNew ? await playersApi.create(body) : await playersApi.update(id, body);
      toast.success('Player saved.');
      if (isNew) navigate(`/dashboard/players/${data._id}`, { replace: true });
      else setF(pick(data));
    } catch (err) {
      setErrors({ form: err.message, ...err.fieldErrors });
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!isNew && existing.loading) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const text = (key, label, props = {}) => (
    <div>
      <label className="label" htmlFor={`p-${key}`}>{label}</label>
      <input id={`p-${key}`} className={`field ${errors[key] ? 'field-error' : ''}`} value={f[key]} onChange={(e) => set({ [key]: e.target.value })} {...props} />
      <FieldError>{errors[key]}</FieldError>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      <DashHeader
        title={isNew ? 'Add player' : `Edit ${f.name || 'player'}`}
        subtitle="Profiles are editorial. Don’t enter statistics you can’t verify."
        actions={<button className="btn-red btn-sm" disabled={busy}>{busy && <Spinner className="h-3.5 w-3.5" />} Save player</button>}
      />
      {errors.form && <p className="mb-6 border-l-4 border-blood bg-blood/10 px-4 py-3 text-sm" role="alert">{errors.form}</p>}

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <ImageField id="p-portrait" label="Portrait" value={f.portrait} onChange={(portrait) => set({ portrait })} aspect="aspect-[3/4]" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.isSample} onChange={(e) => set({ isSample: e.target.checked })} className="accent-[#b5121b]" />
            Mark as sample / fictional profile
          </label>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('name', 'Name', { maxLength: 80 })}
            {text('slug', 'Slug (optional)', { placeholder: 'auto from name' })}
            {text('position', 'Position', { maxLength: 40 })}
            {text('currentClub', 'Current club', { maxLength: 80 })}
            {text('nationality', 'Nationality', { maxLength: 60 })}
            {text('born', 'Born', { maxLength: 40, placeholder: 'e.g. 1999, Yokohama' })}
            <div>
              <label className="label" htmlFor="p-foot">Preferred foot</label>
              <select id="p-foot" className="field" value={f.preferredFoot} onChange={(e) => set({ preferredFoot: e.target.value })}>
                <option value="">—</option>
                <option>Left</option>
                <option>Right</option>
                <option>Both</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="p-summary">Career summary</label>
            <textarea id="p-summary" rows={5} maxLength={3000} className="field font-serif" value={f.summary} onChange={(e) => set({ summary: e.target.value })} />
          </div>

          <fieldset className="border border-ink-600 p-4">
            <legend className="kicker px-2 text-ink-300">Career timeline</legend>
            <div className="space-y-2">
              {f.timeline.map((t, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_90px_90px_1fr_auto_auto]">
                  <input aria-label="Club" className="field col-span-2 sm:col-span-1" placeholder="Club" value={t.club} onChange={(e) => setRow('timeline', i, { club: e.target.value })} />
                  <input aria-label="From" className="field" placeholder="From" value={t.from} onChange={(e) => setRow('timeline', i, { from: e.target.value })} />
                  <input aria-label="To" className="field" placeholder="To (blank = now)" value={t.to} onChange={(e) => setRow('timeline', i, { to: e.target.value })} />
                  <input aria-label="Note" className="field col-span-2 sm:col-span-1" placeholder="Note" value={t.note} onChange={(e) => setRow('timeline', i, { note: e.target.value })} />
                  <label className="flex items-center gap-1 text-xs text-ink-300"><input type="checkbox" checked={t.loan} onChange={(e) => setRow('timeline', i, { loan: e.target.checked })} className="accent-[#b5121b]" /> Loan</label>
                  <button type="button" aria-label="Remove entry" className="p-2 text-ink-400 hover:text-blood-400" onClick={() => set({ timeline: f.timeline.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <FieldError>{errors.timeline}</FieldError>
            <button type="button" className="btn-ghost btn-sm mt-3" onClick={() => set({ timeline: [...f.timeline, { club: '', from: '', to: '', note: '', loan: false }] })}><Plus className="h-3.5 w-3.5" /> Add club</button>
          </fieldset>

          <fieldset className="border border-ink-600 p-4">
            <legend className="kicker px-2 text-ink-300">Achievements & milestones</legend>
            <div className="space-y-2">
              {f.achievements.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 sm:grid-cols-[1fr_90px_1fr_auto]">
                  <input aria-label="Title" className="field" placeholder="Title" value={a.title} onChange={(e) => setRow('achievements', i, { title: e.target.value })} />
                  <input aria-label="Year" className="field" placeholder="Year" value={a.year} onChange={(e) => setRow('achievements', i, { year: e.target.value })} />
                  <input aria-label="Detail" className="field col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto" placeholder="Detail" value={a.detail} onChange={(e) => setRow('achievements', i, { detail: e.target.value })} />
                  <button type="button" aria-label="Remove achievement" className="p-2 text-ink-400 hover:text-blood-400" onClick={() => set({ achievements: f.achievements.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <FieldError>{errors.achievements}</FieldError>
            <button type="button" className="btn-ghost btn-sm mt-3" onClick={() => set({ achievements: [...f.achievements, { title: '', year: '', detail: '' }] })}><Plus className="h-3.5 w-3.5" /> Add achievement</button>
          </fieldset>
        </div>
      </div>
    </form>
  );
}
