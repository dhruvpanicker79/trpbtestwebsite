import sanitizeHtml from 'sanitize-html';

/** Whitelist matching what the TipTap editor can produce. */
const ARTICLE_HTML_OPTIONS = {
  allowedTags: [
    'p', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'hr', 'br',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
    figure: ['data-type', 'class'],
    h2: ['id'],
    h3: ['id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
  },
};

export function sanitizeArticleHtml(html = '') {
  return sanitizeHtml(String(html), ARTICLE_HTML_OPTIONS);
}

export function htmlToText(html = '') {
  return sanitizeHtml(String(html), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readingTimeMinutes(text = '') {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

/** Plain text only for user generated content (comments, bios). */
export function cleanPlainText(text = '') {
  return sanitizeHtml(String(text), { allowedTags: [], allowedAttributes: {} }).trim();
}
