import { useMemo } from 'react';

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/**
 * Prepare stored (server-sanitised) article HTML for display: add anchor ids
 * to headings for the table of contents, and make every image lazy.
 */
export function useArticleHtml(html) {
  return useMemo(() => {
    if (!html) return { html: '', toc: [] };
    const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
    const root = doc.getElementById('root');
    const toc = [];
    const used = new Set();
    root.querySelectorAll('h2, h3').forEach((h) => {
      let id = slug(h.textContent || '') || 'section';
      while (used.has(id)) id = `${id}-x`;
      used.add(id);
      h.id = id;
      toc.push({ id, text: h.textContent, level: h.tagName === 'H2' ? 2 : 3 });
    });
    root.querySelectorAll('img').forEach((img) => {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });
    return { html: root.innerHTML, toc };
  }, [html]);
}

export default function ArticleBody({ html }) {
  // Content is sanitised on the server with a strict whitelist before storage.
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
