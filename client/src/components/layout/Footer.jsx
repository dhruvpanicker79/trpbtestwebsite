import { Link } from 'react-router-dom';
import { AtSign, Instagram, Play, Rss } from 'lucide-react';
import { Stamp } from '../ui/Logo.jsx';
import { INSTAGRAM_URL, NAV_CATEGORIES } from '../../utils/constants.js';

const SOCIALS = [
  { label: 'Instagram', href: INSTAGRAM_URL, Icon: Instagram },
  { label: 'X (Twitter)', href: 'https://x.com/', Icon: AtSign },
  { label: 'YouTube', href: 'https://youtube.com/', Icon: Play },
  { label: 'Sitemap', href: '/sitemap.xml', Icon: Rss },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t-4 border-blood bg-ink-950">
      <div className="container-site py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4">
              <Stamp size={52} />
              <p className="font-display text-3xl font-bold uppercase leading-none text-white sm:text-4xl">
                The Ronin’s
                <br />
                Playbook
              </p>
            </div>
            <p className="mt-6 max-w-sm text-lg text-ink-300">
              Football, Beyond The 90. An independent publication for people who watch the game twice — once for the
              result, once for everything else.
            </p>
            <div className="mt-8 flex gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center border border-ink-500 text-bone transition-colors hover:border-blood hover:bg-blood"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7" aria-label="Footer">
            <div>
              <p className="kicker mb-4 text-blood-400">Sections</p>
              <ul className="space-y-2.5 text-sm">
                {NAV_CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link to={`/category/${c.slug}`} className="text-ink-300 hover:text-white">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker mb-4 text-blood-400">Community</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/players" className="text-ink-300 hover:text-white">Player Files</Link></li>
                <li><Link to="/polls" className="text-ink-300 hover:text-white">Polls & Debates</Link></li>
                <li><Link to="/search" className="text-ink-300 hover:text-white">Search</Link></li>
                <li><Link to="/register" className="text-ink-300 hover:text-white">Join TRPB</Link></li>
              </ul>
            </div>
            <div>
              <p className="kicker mb-4 text-blood-400">The Playbook</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/about" className="text-ink-300 hover:text-white">About</Link></li>
                <li><Link to="/about#standards" className="text-ink-300 hover:text-white">Editorial standards</Link></li>
                <li><Link to="/account/bookmarks" className="text-ink-300 hover:text-white">Reading lists</Link></li>
                <li><a href="/sitemap.xml" className="text-ink-300 hover:text-white">Sitemap</a></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-ink-700 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} The Ronin’s Playbook (TRPB). Independent football writing.</p>
          <p>Sample content: players, clubs and matches marked as samples are fictional.</p>
        </div>
      </div>
    </footer>
  );
}
