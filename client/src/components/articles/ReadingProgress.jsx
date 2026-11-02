import { useEffect, useState } from 'react';

/** Thin red bar along the top of the viewport showing how far through the article the reader is. */
export default function ReadingProgress({ targetId }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.getElementById(targetId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setPct(total > 0 ? Math.min(100, Math.max(0, (-rect.top / total) * 100)) : 100);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1" aria-hidden>
      <div className="h-full bg-blood transition-[width] duration-100" style={{ width: `${pct}%` }} />
    </div>
  );
}
