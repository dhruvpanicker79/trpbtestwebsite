import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { miscApi } from '../../services/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner } from '../ui/Bits.jsx';
import Img from '../ui/Img.jsx';

/** Image picker: upload a file (Cloudinary or local fallback) or paste a URL. */
export default function ImageField({ id, label, value, onChange, aspect = 'aspect-[16/9]' }) {
  const toast = useToast();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return toast.error('Images must be under 6 MB.');
    setBusy(true);
    try {
      const { data } = await miscApi.upload(file);
      onChange(data.url);
      toast.success(data.provider === 'cloudinary' ? 'Uploaded to Cloudinary.' : 'Uploaded (local storage).');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <div className={`relative ${aspect} w-full border border-dashed border-ink-500 bg-ink-800`}>
        {value ? (
          <>
            <Img src={value} alt="" className="absolute inset-0" imgClassName="!object-contain" width={900} />
            <button type="button" onClick={() => onChange('')} className="absolute right-2 top-2 bg-ink/80 p-1.5 text-white hover:bg-blood" aria-label="Remove image">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => ref.current?.click()} className="absolute inset-0 grid place-items-center text-sm text-ink-300 hover:text-white" disabled={busy}>
            <span className="flex flex-col items-center gap-2">
              {busy ? <Spinner /> : <Upload className="h-5 w-5" />}
              {busy ? 'Uploading…' : 'Upload image'}
            </span>
          </button>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input id={id} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" className="field py-2 text-xs" />
        <button type="button" onClick={() => ref.current?.click()} className="btn-ghost btn-sm shrink-0" disabled={busy}>
          {busy ? <Spinner className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />} File
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
