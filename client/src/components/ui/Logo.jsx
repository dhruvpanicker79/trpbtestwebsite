import { Link } from 'react-router-dom';

/** Red hanko-style stamp with 浪 (the first character of rōnin, 浪人). */
export function Stamp({ size = 36, className = '' }) {
  return (
    <span
      className={`stamp inline-grid shrink-0 place-items-center bg-blood font-display font-bold leading-none text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.58 }}
      aria-hidden
    >
      浪
    </span>
  );
}

export default function Logo({ compact = false, light = false }) {
  return (
    <Link to="/" className="group inline-flex min-w-0 items-center gap-2 sm:gap-3" aria-label="The Ronin's Playbook — home">
      <Stamp size={compact ? 28 : 34} />
      <span className="flex flex-col leading-none">
        <span
          className={`whitespace-nowrap font-display font-bold uppercase tracking-[0.02em] ${compact ? 'text-[13px] sm:text-[15px]' : 'text-[13px] sm:text-[21px]'} ${
            light ? 'text-ink' : 'text-white'
          }`}
        >
          The Ronin’s Playbook
        </span>
        {!compact && (
          <span className={`mt-1 hidden font-sans text-[9.5px] sm:block font-semibold uppercase tracking-[0.32em] ${light ? 'text-ink/60' : 'text-ink-300'}`}>
            TRPB · Football, Beyond The 90.
          </span>
        )}
      </span>
    </Link>
  );
}
