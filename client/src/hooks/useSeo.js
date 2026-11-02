import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = "The Ronin's Playbook";
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
const DEFAULT_DESC =
  'Independent football writing: tactical analysis, player files, match analysis and football culture. Football, Beyond The 90.';
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&h=630&q=80';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Client-side page metadata: title, description, canonical, Open Graph and
 * Twitter tags. In production the Express server also injects these into the
 * initial HTML for crawlers that do not execute JavaScript.
 */
export function useSeo({ title, description, image, type = 'website', publishedTime, noindex } = {}) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} — TRPB` : `${SITE_NAME} — Football, Beyond The 90.`;
    const desc = description || DEFAULT_DESC;
    const url = `${SITE_URL}${pathname}`;
    const img = image || DEFAULT_IMAGE;

    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
    setCanonical(url);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'article:published_time', publishedTime);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);
  }, [title, description, image, type, publishedTime, noindex, pathname]);
}
