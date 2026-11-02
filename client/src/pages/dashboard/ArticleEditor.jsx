import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { adminApi, articlesApi, playersApi, taxonomyApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import RichTextEditor from '../../components/dashboard/RichTextEditor.jsx';
import ImageField from '../../components/dashboard/ImageField.jsx';
import { ErrorState, FieldError, PageLoader, Spinner } from '../../components/ui/Bits.jsx';
import { DashHeader, StatusPill } from '../../layouts/DashboardLayout.jsx';

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  coverImage: { url: '', alt: '', caption: '', credit: '' },
  category: '',
  tags: [],
  players: [],
  clubs: [],
  content: '',
  status: 'draft',
  scheduledFor: '',
  featured: false,
  tactical: null,
  seo: { metaTitle: '', metaDescription: '' },
};

const EMPTY_TACTICAL = { formation: '', inPossession: '', outOfPossession: '', summary: '', roles: [], boards: [] };

/** Convert a Date/ISO string to the value format of <input type="datetime-local">. */
function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromArticle(a) {
  return {
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt || '',
    coverImage: { url: '', alt: '', caption: '', credit: '', ...(a.coverImage || {}) },
    category: a.category?._id || '',
    tags: (a.tags || []).map((t) => t._id),
    players: (a.players || []).map((p) => p._id),
    clubs: a.clubs || [],
    content: a.content || '',
    status: a.status,
    scheduledFor: toLocalInput(a.scheduledFor),
    featured: Boolean(a.featured),
    tactical: a.tactical ? { ...EMPTY_TACTICAL, ...a.tactical } : null,
    seo: { metaTitle: '', metaDescription: '', ...(a.seo || {}) },
  };
}

function Section({ title, children, aside }) {
  return (
    <section className="border border-ink-600 bg-ink-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="kicker text-ink-300">{title}</h2>
        {aside}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Chips({ options, selected, onToggle, empty }) {
  if (!options.length) return <p className="text-xs text-ink-400">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o._id);
        return (
          <button
            key={o._id}
            type="button"
            onClick={() => onToggle(o._id)}
            aria-pressed={on}
            className={`border px-2.5 py-1 text-xs font-semibold ${on ? 'border-blood bg-blood text-white' : 'border-ink-500 text-ink-300 hover:text-white'}`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

export default function ArticleEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(null);
  const [dirty, setDirty] = useState(false);

  const existing = useAsync(() => (isNew ? Promise.resolve({ data: null }) : adminApi.article(id)), [id]);
  const categories = useAsync(() => taxonomyApi.categories(), []);
  const tags = useAsync(() => taxonomyApi.tags(), []);
  const players = useAsync(() => playersApi.list({ limit: 50 }), []);

  useEffect(() => {
    if (existing.data) setForm(fromArticle(existing.data));
    else if (isNew) setForm(EMPTY);
    setDirty(false);
  }, [existing.data, isNew]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const setNested = (key, patch) => set({ [key]: { ...form[key], ...patch } });
  const toggleIn = (key, value) =>
    set({ [key]: form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value] });

  const tactical = form.tactical;
  const setTactical = (patch) => set({ tactical: { ...tactical, ...patch } });

  const wordCount = useMemo(() => form.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length, [form.content]);

  const validate = (status) => {
    const e = {};
    if (form.title.trim().length < 3) e.title = 'Give the article a headline (3+ characters).';
    if (!form.category) e.category = 'Choose a category.';
    if (status !== 'draft') {
      if (!form.excerpt.trim()) e.excerpt = 'Published articles need an excerpt.';
      if (wordCount < 20) e.content = 'Write a little more before publishing.';
    }
    if (status === 'scheduled') {
      if (!form.scheduledFor) e.scheduledFor = 'Choose a publication date and time.';
      else if (new Date(form.scheduledFor) <= new Date()) e.scheduledFor = 'Scheduled time must be in the future.';
    }
    return e;
  };

  const save = async (status = form.status, { preview } = {}) => {
    const errs = validate(status);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    const body = {
      ...form,
      status,
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      scheduledFor: status === 'scheduled' ? new Date(form.scheduledFor).toISOString() : null,
      tactical: tactical
        ? {
            ...tactical,
            roles: tactical.roles.filter((r) => r.position.trim() && r.role.trim()),
            boards: tactical.boards.filter((b) => b.url),
          }
        : null,
    };
    if (!hasRole('ADMIN')) delete body.featured;

    setSaving(status);
    try {
      const { data } = isNew ? await articlesApi.create(body) : await articlesApi.update(id, body);
      const wasPublished = form.status === 'published';
      setDirty(false);
      setForm(fromArticle(data));
      toast.success(
        status === 'published' ? (wasPublished ? 'Changes published.' : 'Published.') : status === 'scheduled' ? 'Scheduled.' : 'Draft saved.'
      );
      if (preview) window.open(`/article/${data.slug}`, '_blank', 'noopener');
      if (isNew) navigate(`/dashboard/articles/${data._id}`, { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (!isNew && existing.loading) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(form.status);
      }}
      noValidate
    >
      <DashHeader
        title={isNew ? 'New article' : 'Edit article'}
        subtitle={
          isNew ? 'Drafts are private until published.' : (
            <span className="flex items-center gap-2">
              <StatusPill status={form.status} /> {dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
          )
        }
        actions={
          <>
            {!isNew && (
              <Link to={`/article/${form.slug}`} target="_blank" className="btn-ghost btn-sm">
                <ExternalLink className="h-3.5 w-3.5" /> {form.status === 'published' ? 'View' : 'Preview'}
              </Link>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={() => save(form.status, { preview: true })} disabled={Boolean(saving)}>
              Save & preview
            </button>
            {form.status === 'published' ? (
              <>
                <button type="button" className="btn-ghost btn-sm" onClick={() => save('draft')} disabled={Boolean(saving)}>
                  {saving === 'draft' && <Spinner className="h-3.5 w-3.5" />} Unpublish
                </button>
                <button type="button" className="btn-red btn-sm" onClick={() => save('published')} disabled={Boolean(saving)}>
                  {saving === 'published' && <Spinner className="h-3.5 w-3.5" />} Update
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-ghost btn-sm" onClick={() => save('draft')} disabled={Boolean(saving)}>
                  {saving === 'draft' && <Spinner className="h-3.5 w-3.5" />} Save draft
                </button>
                <button type="button" className="btn-red btn-sm" onClick={() => save('published')} disabled={Boolean(saving)}>
                  {saving === 'published' && <Spinner className="h-3.5 w-3.5" />} Publish now
                </button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <div>
            <label htmlFor="ed-title" className="sr-only">Headline</label>
            <textarea
              id="ed-title"
              rows={2}
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Headline"
              className={`w-full resize-none border-b-2 bg-transparent pb-2 font-display text-3xl font-bold text-white placeholder:text-ink-500 focus:outline-none sm:text-4xl ${errors.title ? 'border-blood-400' : 'border-ink-500 focus:border-bone'}`}
            />
            <FieldError>{errors.title}</FieldError>
          </div>
          <div>
            <label htmlFor="ed-excerpt" className="label">Excerpt / standfirst</label>
            <textarea id="ed-excerpt" rows={2} maxLength={400} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} className={`field font-serif text-base ${errors.excerpt ? 'field-error' : ''}`} />
            <div className="mt-1 flex justify-between"><FieldError>{errors.excerpt}</FieldError><span className="ml-auto text-xs text-ink-400">{form.excerpt.length}/400</span></div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="label !mb-0">Body</span>
              <span className="text-xs text-ink-400">{wordCount} words · ~{Math.max(1, Math.round(wordCount / 225))} min read</span>
            </div>
            <RichTextEditor value={form.content} onChange={(html) => set({ content: html })} />
            <FieldError>{errors.content}</FieldError>
          </div>

          {/* Tactical block */}
          <Section
            title="Tactical board (optional)"
            aside={
              <label className="flex items-center gap-2 text-xs text-ink-300">
                <input type="checkbox" checked={Boolean(tactical)} onChange={(e) => set({ tactical: e.target.checked ? { ...EMPTY_TACTICAL } : null })} className="accent-[#b5121b]" />
                Include
              </label>
            }
          >
            {!tactical ? (
              <p className="text-sm text-ink-400">Add formations, phase shapes, player roles and annotated boards. Shown as a structured panel in the article.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['formation', 'Base formation', '4-3-3'],
                    ['inPossession', 'In possession', '3-2-5'],
                    ['outOfPossession', 'Out of possession', '4-4-2'],
                  ].map(([k, l, ph]) => (
                    <div key={k}>
                      <label className="label" htmlFor={`tac-${k}`}>{l}</label>
                      <input id={`tac-${k}`} className="field" maxLength={20} placeholder={ph} value={tactical[k]} onChange={(e) => setTactical({ [k]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="label" htmlFor="tac-summary">Team shape summary</label>
                  <textarea id="tac-summary" rows={3} maxLength={1200} className="field" value={tactical.summary} onChange={(e) => setTactical({ summary: e.target.value })} />
                </div>

                <div>
                  <p className="label">Player roles</p>
                  <div className="space-y-2">
                    {tactical.roles.map((r, i) => (
                      <div key={i} className="grid grid-cols-[70px_1fr_auto] gap-2 sm:grid-cols-[80px_180px_1fr_auto]">
                        <input aria-label="Position" className="field" placeholder="RB" maxLength={20} value={r.position} onChange={(e) => setTactical({ roles: tactical.roles.map((x, j) => (j === i ? { ...x, position: e.target.value } : x)) })} />
                        <input aria-label="Role" className="field" placeholder="Inverted full-back" maxLength={60} value={r.role} onChange={(e) => setTactical({ roles: tactical.roles.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} />
                        <input aria-label="Description" className="field col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto" placeholder="What the role does" maxLength={500} value={r.description} onChange={(e) => setTactical({ roles: tactical.roles.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} />
                        <button type="button" aria-label="Remove role" className="px-2 text-ink-400 hover:text-blood-400" onClick={() => setTactical({ roles: tactical.roles.filter((_, j) => j !== i) })}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setTactical({ roles: [...tactical.roles, { position: '', role: '', description: '' }] })}>
                    <Plus className="h-3.5 w-3.5" /> Add role
                  </button>
                </div>

                <div>
                  <p className="label">Tactical boards</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tactical.boards.map((b, i) => (
                      <div key={i} className="space-y-2 border border-ink-600 p-3">
                        <ImageField id={`board-${i}`} value={b.url} onChange={(url) => setTactical({ boards: tactical.boards.map((x, j) => (j === i ? { ...x, url } : x)) })} />
                        <input aria-label="Board caption" className="field" placeholder="Caption / annotation" maxLength={300} value={b.caption || ''} onChange={(e) => setTactical({ boards: tactical.boards.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} />
                        <input aria-label="Board alt text" className="field" placeholder="Alt text" maxLength={200} value={b.alt || ''} onChange={(e) => setTactical({ boards: tactical.boards.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })} />
                        <button type="button" className="text-xs font-semibold text-ink-400 hover:text-blood-400" onClick={() => setTactical({ boards: tactical.boards.filter((_, j) => j !== i) })}>
                          Remove board
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setTactical({ boards: [...tactical.boards, { url: '', caption: '', alt: '' }] })}>
                    <Plus className="h-3.5 w-3.5" /> Add board
                  </button>
                </div>
              </>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Section title="Publishing">
            <p className="flex items-center gap-2 text-sm text-ink-300">
              Current status: <StatusPill status={form.status} />
            </p>
            {form.status !== 'published' && (
              <div>
                <label className="label" htmlFor="ed-when">Schedule for later</label>
                <input id="ed-when" type="datetime-local" className={`field ${errors.scheduledFor ? 'field-error' : ''}`} value={form.scheduledFor} onChange={(e) => set({ scheduledFor: e.target.value })} />
                <FieldError>{errors.scheduledFor}</FieldError>
                <p className="mt-1.5 text-xs text-ink-400">The API’s scheduler publishes due articles automatically (checked every minute while the server runs).</p>
                <button type="button" className="btn-red btn-sm mt-3 w-full" onClick={() => save('scheduled')} disabled={Boolean(saving)}>
                  {saving === 'scheduled' && <Spinner className="h-3.5 w-3.5" />} {form.status === 'scheduled' ? 'Update schedule' : 'Schedule'}
                </button>
              </div>
            )}
            {hasRole('ADMIN') && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="accent-[#b5121b]" />
                Feature on homepage
              </label>
            )}
            <div>
              <label className="label" htmlFor="ed-slug">URL slug</label>
              <input id="ed-slug" className="field font-mono text-xs" placeholder="auto-generated from the headline" value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
              <p className="mt-1 break-all text-xs text-ink-400">/article/{form.slug || '…'}</p>
            </div>
          </Section>

          <Section title="Cover image">
            <ImageField id="ed-cover" value={form.coverImage.url} onChange={(url) => setNested('coverImage', { url })} />
            <input aria-label="Cover alt text" className="field" placeholder="Alt text" maxLength={200} value={form.coverImage.alt} onChange={(e) => setNested('coverImage', { alt: e.target.value })} />
            <input aria-label="Cover caption" className="field" placeholder="Caption" maxLength={300} value={form.coverImage.caption} onChange={(e) => setNested('coverImage', { caption: e.target.value })} />
            <input aria-label="Photo credit" className="field" placeholder="Photo credit" maxLength={120} value={form.coverImage.credit} onChange={(e) => setNested('coverImage', { credit: e.target.value })} />
          </Section>

          <Section title="Taxonomy">
            <div>
              <label className="label" htmlFor="ed-cat">Category</label>
              <select id="ed-cat" className={`field ${errors.category ? 'field-error' : ''}`} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                <option value="">Choose…</option>
                {(categories.data || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <FieldError>{errors.category}</FieldError>
            </div>
            <div>
              <p className="label">Tags</p>
              <Chips options={tags.data || []} selected={form.tags} onToggle={(v) => toggleIn('tags', v)} empty="No tags yet — an admin can add them." />
            </div>
            <div>
              <p className="label">Players</p>
              <Chips options={players.data || []} selected={form.players} onToggle={(v) => toggleIn('players', v)} empty="No player profiles yet." />
            </div>
            <div>
              <label className="label" htmlFor="ed-clubs">Clubs (comma-separated)</label>
              <input
                id="ed-clubs"
                className="field"
                defaultValue={form.clubs.join(', ')}
                key={form.clubs.join('|')}
                onBlur={(e) => set({ clubs: e.target.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12) })}
              />
            </div>
          </Section>

          <Section title="SEO">
            <div>
              <label className="label" htmlFor="ed-mt">Meta title</label>
              <input id="ed-mt" className="field" maxLength={70} placeholder={form.title} value={form.seo.metaTitle} onChange={(e) => setNested('seo', { metaTitle: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ed-md">Meta description</label>
              <textarea id="ed-md" rows={3} className="field" maxLength={170} placeholder={form.excerpt} value={form.seo.metaDescription} onChange={(e) => setNested('seo', { metaDescription: e.target.value })} />
              <p className="mt-1 text-right text-xs text-ink-400">{form.seo.metaDescription.length}/170</p>
            </div>
          </Section>
        </div>
      </div>
    </form>
  );
}
