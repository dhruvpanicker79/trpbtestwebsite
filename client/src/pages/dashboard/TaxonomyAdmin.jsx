import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { taxonomyApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { ErrorState, FieldError, Skeleton, Spinner } from '../../components/ui/Bits.jsx';
import { DashHeader } from '../../layouts/DashboardLayout.jsx';

function CategoryForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { name: '', slug: '', kicker: '', description: '', order: 0 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Name is required.');
    setBusy(true);
    setErr('');
    try {
      await onSave({ name: f.name.trim(), slug: f.slug?.trim() || undefined, kicker: f.kicker || '', description: f.description || '', order: Number(f.order) || 0 });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-3 border border-ink-600 bg-ink-900 p-4 sm:grid-cols-6">
      <input aria-label="Category name" className="field sm:col-span-2" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input aria-label="Slug" className="field sm:col-span-2" placeholder="slug (optional)" value={f.slug || ''} onChange={(e) => setF({ ...f, slug: e.target.value })} />
      <input aria-label="Kicker" className="field" placeholder="Kicker" value={f.kicker || ''} onChange={(e) => setF({ ...f, kicker: e.target.value })} />
      <input aria-label="Order" type="number" min={0} className="field" placeholder="Order" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} />
      <textarea aria-label="Description" className="field sm:col-span-6" rows={2} placeholder="Description" maxLength={300} value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="flex items-center gap-2 sm:col-span-6">
        <button className="btn-red btn-sm" disabled={busy}>{busy && <Spinner className="h-3.5 w-3.5" />} Save</button>
        {onCancel && <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>}
        <FieldError>{err}</FieldError>
      </div>
    </form>
  );
}

export default function TaxonomyAdmin() {
  const toast = useToast();
  const cats = useAsync(() => taxonomyApi.categories(), []);
  const tags = useAsync(() => taxonomyApi.tags(), []);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagEdit, setTagEdit] = useState({ id: null, name: '' });
  const [pending, setPending] = useState(null); // { kind, item }
  const [busy, setBusy] = useState(false);

  const addTag = async (e) => {
    e.preventDefault();
    if (newTag.trim().length < 2) return toast.error('Tag names need at least 2 characters.');
    try {
      await taxonomyApi.createTag({ name: newTag.trim() });
      setNewTag('');
      tags.reload();
      toast.success('Tag added.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveTag = async () => {
    try {
      await taxonomyApi.updateTag(tagEdit.id, { name: tagEdit.name.trim() });
      setTagEdit({ id: null, name: '' });
      tags.reload();
      toast.success('Tag renamed.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      if (pending.kind === 'category') {
        await taxonomyApi.deleteCategory(pending.item._id);
        cats.reload();
      } else {
        await taxonomyApi.deleteTag(pending.item._id);
        tags.reload();
      }
      toast.success('Deleted.');
      setPending(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DashHeader title="Categories & tags" subtitle="Sections appear in the navigation; tags power filtering and search." />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="kicker text-ink-300">Categories</h2>
          {!adding && <button className="btn-red btn-sm" onClick={() => setAdding(true)}>Add category</button>}
        </div>
        {adding && (
          <div className="mb-4">
            <CategoryForm
              onCancel={() => setAdding(false)}
              onSave={async (body) => {
                await taxonomyApi.createCategory(body);
                setAdding(false);
                cats.reload();
                toast.success('Category created.');
              }}
            />
          </div>
        )}
        {cats.loading ? (
          <Skeleton className="h-40" />
        ) : cats.error ? (
          <ErrorState error={cats.error} onRetry={cats.reload} />
        ) : (
          <div className="overflow-x-auto border border-ink-600">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-right">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cats.data.map((c) =>
                  editing === c._id ? (
                    <tr key={c._id} className="border-t border-ink-700">
                      <td colSpan={5} className="p-3">
                        <CategoryForm
                          initial={c}
                          onCancel={() => setEditing(null)}
                          onSave={async (body) => {
                            await taxonomyApi.updateCategory(c._id, body);
                            setEditing(null);
                            cats.reload();
                            toast.success('Category updated.');
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={c._id} className="border-t border-ink-700">
                      <td className="px-4 py-3 tabular-nums text-ink-300">{c.order}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="line-clamp-1 text-xs text-ink-400">{c.description}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-300">{c.slug}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.articleCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="p-2 text-ink-300 hover:text-white" onClick={() => setEditing(c._id)} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
                          <button className="p-2 text-ink-300 hover:text-blood-400" onClick={() => setPending({ kind: 'category', item: c })} aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="kicker mb-4 text-ink-300">Tags</h2>
        <form onSubmit={addTag} className="mb-5 flex max-w-md gap-2">
          <label htmlFor="new-tag" className="sr-only">New tag</label>
          <input id="new-tag" className="field" placeholder="New tag name" maxLength={40} value={newTag} onChange={(e) => setNewTag(e.target.value)} />
          <button className="btn-red btn-sm shrink-0">Add tag</button>
        </form>
        {tags.loading ? (
          <Skeleton className="h-24" />
        ) : tags.error ? (
          <ErrorState error={tags.error} onRetry={tags.reload} />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.data.map((t) => (
              <li key={t._id} className="flex items-center gap-1 border border-ink-500 bg-ink-900 py-1 pl-3 pr-1 text-sm">
                {tagEdit.id === t._id ? (
                  <>
                    <input aria-label="Tag name" autoFocus className="w-32 bg-transparent focus:outline-none" value={tagEdit.name} onChange={(e) => setTagEdit({ ...tagEdit, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), saveTag())} />
                    <button className="p-1 text-ink-300 hover:text-white" onClick={saveTag} aria-label="Save tag"><Check className="h-3.5 w-3.5" /></button>
                    <button className="p-1 text-ink-300 hover:text-white" onClick={() => setTagEdit({ id: null, name: '' })} aria-label="Cancel"><X className="h-3.5 w-3.5" /></button>
                  </>
                ) : (
                  <>
                    <span className="text-white">#{t.name}</span>
                    <span className="ml-1 text-xs text-ink-400">{t.articleCount}</span>
                    <button className="p-1 text-ink-400 hover:text-white" onClick={() => setTagEdit({ id: t._id, name: t.name })} aria-label={`Rename ${t.name}`}><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="p-1 text-ink-400 hover:text-blood-400" onClick={() => setPending({ kind: 'tag', item: t })} aria-label={`Delete ${t.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pending)}
        title={`Delete ${pending?.kind}?`}
        message={pending?.kind === 'tag' ? `“${pending.item.name}” will be removed from all articles.` : 'Categories with articles cannot be deleted — reassign them first.'}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
