import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import Img from '../ui/Img.jsx';

export default function PlayerCard({ player, light = false }) {
  return (
    <article className="group relative">
      <div className="relative">
        <Img
          src={player.portrait}
          alt={`${player.name}`}
          className="aspect-[3/4] w-full"
          imgClassName="grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
          sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw"
          width={600}
          fallbackLabel="Player File"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
        {player.ratingCount > 0 && (
          <span className="absolute right-0 top-0 inline-flex items-center gap-1 bg-blood px-2 py-1 text-xs font-bold text-white">
            <Star className="h-3 w-3 fill-current" aria-hidden /> {player.ratingAverage.toFixed(1)}
            <span className="sr-only">community rating</span>
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="kicker truncate text-blood-400" title={player.position}>{player.position}</p>
          <h3 className="mt-1 font-display text-xl font-bold leading-tight text-white">
            <Link to={`/players/${player.slug}`} className="after:absolute after:inset-0">
              {player.name}
            </Link>
          </h3>
        </div>
      </div>
      <p className={`mt-2 text-xs ${light ? 'text-ink/60' : 'text-ink-300'}`}>
        {player.currentClub} · {player.nationality}
        {player.isSample && <span className="ml-1 italic">(sample)</span>}
      </p>
    </article>
  );
}
