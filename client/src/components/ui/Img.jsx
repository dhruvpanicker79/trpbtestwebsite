import { useState } from 'react';
import { sizedImage, srcSetFor } from '../../utils/format.js';

/**
 * Editorial fallback art: a pitch diagram on near-black. Used whenever an
 * image is missing or fails to load, so layouts never collapse into blank boxes.
 */
export function PitchArt({ label, className = '' }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-ink-800 ${className}`} aria-hidden>
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect width="400" height="260" fill="#121212" />
        <g fill="none" stroke="#2a2a2a" strokeWidth="2">
          <rect x="20" y="20" width="360" height="220" />
          <line x1="200" y1="20" x2="200" y2="240" />
          <circle cx="200" cy="130" r="34" />
          <rect x="20" y="75" width="54" height="110" />
          <rect x="326" y="75" width="54" height="110" />
          <rect x="20" y="105" width="20" height="50" />
          <rect x="360" y="105" width="20" height="50" />
        </g>
        <g fill="#b5121b">
          <circle cx="120" cy="90" r="5" />
          <circle cx="150" cy="170" r="5" />
          <circle cx="245" cy="120" r="5" />
        </g>
        <path d="M120 90 Q 180 60 245 120" stroke="#b5121b" strokeWidth="2" fill="none" strokeDasharray="5 5" />
      </svg>
      {label && (
        <span className="kicker absolute bottom-3 left-3 bg-ink/80 px-2 py-1 text-ink-300">{label}</span>
      )}
    </div>
  );
}

export default function Img({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  sizes = '(min-width: 1024px) 50vw, 100vw',
  width = 1200,
  eager = false,
  fallbackLabel,
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div className={className}>
        <PitchArt label={fallbackLabel} />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-ink-700 ${className}`}>
      <img
        src={sizedImage(src, width)}
        srcSet={srcSetFor(src)}
        sizes={sizes}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={eager ? 'high' : undefined}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  );
}
