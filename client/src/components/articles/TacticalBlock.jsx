import Img from '../ui/Img.jsx';

/**
 * Reusable tactical content component: formation summary, phase shapes,
 * player-role table and annotated tactical boards with captions.
 */
export default function TacticalBlock({ tactical, compact = false }) {
  if (!tactical) return null;
  const { formation, inPossession, outOfPossession, summary, roles = [], boards = [] } = tactical;
  const hasShapes = formation || inPossession || outOfPossession;
  if (!hasShapes && !summary && !roles.length && !boards.length) return null;

  return (
    <section aria-labelledby="tactical-heading" className="my-12 border border-ink-600 bg-ink-800">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-600 px-5 py-3">
        <h2 id="tactical-heading" className="kicker text-blood-400">
          Tactical Room · The Board
        </h2>
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">Diagrams are illustrative</span>
      </header>

      {hasShapes && (
        <dl className="grid grid-cols-3 divide-x divide-ink-600 border-b border-ink-600">
          {[
            ['Base', formation],
            ['In possession', inPossession],
            ['Out of possession', outOfPossession],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-4 sm:px-5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400 sm:text-[11px]">{label}</dt>
              <dd className="mt-1 font-display text-xl font-bold text-white tabular-nums sm:text-3xl">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      )}

      {summary && <p className="border-b border-ink-600 px-5 py-5 font-serif text-[17px] leading-relaxed text-bone/90">{summary}</p>}

      {boards.map((b, i) => (
        <figure key={i} className="border-b border-ink-600 p-4 sm:p-5">
          <Img src={b.url} alt={b.alt || b.caption || 'Tactical board'} className="w-full bg-ink-900" imgClassName="!object-contain" width={1400} fallbackLabel="Tactical board" />
          {b.caption && <figcaption className="mt-3 border-l-2 border-blood pl-3 text-sm text-ink-300">{b.caption}</figcaption>}
        </figure>
      ))}

      {!compact && roles.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">Player roles</caption>
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
                <th scope="col" className="px-5 py-3 font-semibold">Pos.</th>
                <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                <th scope="col" className="px-5 py-3 font-semibold">What it means</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={i} className="border-t border-ink-600 align-top">
                  <td className="px-5 py-3 font-display text-lg font-bold text-blood-400">{r.position}</td>
                  <td className="px-5 py-3 font-semibold text-white">{r.role}</td>
                  <td className="px-5 py-3 text-ink-300">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
