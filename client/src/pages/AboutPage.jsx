import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo.js';
import { Stamp } from '../components/ui/Logo.jsx';

export default function AboutPage() {
  useSeo({ title: 'About', description: 'The Ronin’s Playbook is an independent football publication. Football, Beyond The 90.' });
  return (
    <div>
      <header className="container-site grid gap-10 py-16 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Stamp size={64} />
          <h1 className="mt-8 font-display text-5xl font-bold leading-[0.95] text-white sm:text-7xl">
            Masterless. <span className="text-blood-400">Independent.</span> Obsessed.
          </h1>
        </div>
        <p className="text-xl text-ink-300 lg:col-span-4 lg:self-end">
          A rōnin was a samurai without a master. We write about football the same way — answering to no club, no
          broadcaster and no betting partner.
        </p>
      </header>

      <section className="paper py-16">
        <div className="container-site grid gap-12 lg:grid-cols-3">
          {[
            ['The Stories', 'Long-form features about people, places and nights that last longer than ninety minutes.'],
            ['The Board', 'Tactical analysis with diagrams, phase shapes and role tables — clearly labelled as illustrative.'],
            ['The Terraces', 'Culture, design, language and the community that argues with us in the comments.'],
          ].map(([t, d]) => (
            <div key={t} className="border-t-2 border-ink pt-4">
              <h2 className="font-display text-3xl font-bold text-ink">{t}</h2>
              <p className="mt-3 font-serif text-lg text-ink/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="standards" className="container-site max-w-3xl scroll-mt-32 py-16">
        <p className="kicker text-blood-400">Editorial standards</p>
        <h2 className="mt-3 font-display text-4xl font-bold text-white">What we promise</h2>
        <ul className="mt-8 space-y-5 font-serif text-lg text-bone/90">
          <li>— We don’t invent statistics. Where we use illustrative or sample figures, we say so.</li>
          <li>— Fictional or sample content (players, clubs, matches) is labelled as such.</li>
          <li>— Opinion pieces are labelled as opinion.</li>
          <li>— Tactical diagrams are explanatory drawings, not tracking data.</li>
          <li>— Comments are moderated. Report anything abusive and we’ll review it.</li>
        </ul>
        <Link to="/register" className="btn-red mt-10">Join the community</Link>
      </section>
    </div>
  );
}
