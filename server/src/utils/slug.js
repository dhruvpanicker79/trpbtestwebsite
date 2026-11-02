export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

/** Return a slug unique within `Model`, appending -2, -3… when needed. */
export async function uniqueSlug(Model, source, excludeId) {
  const base = slugify(source) || 'untitled';
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}
