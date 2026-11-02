export function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  const d = new Date(value);
  return opts.timeStyle || opts.hour ? d.toLocaleString('en-GB', opts) : d.toLocaleDateString('en-GB', opts);
}

export function timeAgo(value) {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'just now';
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    const n = Math.floor(diff / secs);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return '';
}

export function compactNumber(n = 0) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Resize Unsplash / Cloudinary URLs for responsive images; other URLs pass through. */
export function sizedImage(url, width) {
  if (!url) return url;
  try {
    if (url.includes('images.unsplash.com')) {
      const u = new URL(url);
      u.searchParams.set('w', String(width));
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    }
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
    }
  } catch {
    /* fall through */
  }
  return url;
}

export function srcSetFor(url, widths = [480, 800, 1200, 1600]) {
  if (!url || !(url.includes('images.unsplash.com') || url.includes('res.cloudinary.com'))) return undefined;
  return widths.map((w) => `${sizedImage(url, w)} ${w}w`).join(', ');
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
