import { useEffect, useState } from 'react';

/** Sticky contents list with active-section tracking. Only rendered for long pieces. */
export default function TableOfContents({ items }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean);
    if (!els.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="kicker mb-4 text-blood-400">In this piece</p>
      <ol className="space-y-1 border-l border-ink-600">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#${item.id}`);
              }}
              className={`-ml-px block border-l-2 py-1.5 leading-snug transition-colors ${item.level === 3 ? 'pl-7' : 'pl-4'} ${
                active === item.id ? 'border-blood text-white' : 'border-transparent text-ink-300 hover:text-white'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
