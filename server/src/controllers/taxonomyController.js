import { Article, Category, Tag, PUBLIC_FILTER } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, assertObjectId } from '../utils/http.js';
import { slugify, uniqueSlug } from '../utils/slug.js';

async function countsBy(field) {
  const rows = await Article.aggregate([
    { $match: PUBLIC_FILTER() },
    ...(field === 'tags' ? [{ $unwind: '$tags' }] : []),
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

/* ---------- categories ---------- */

export const listCategories = asyncHandler(async (_req, res) => {
  const [cats, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    countsBy('category'),
  ]);
  ok(res, cats.map((c) => ({ ...c, articleCount: counts.get(String(c._id)) || 0 })));
});

export const getCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug }).lean();
  if (!cat) throw ApiError.notFound('Category not found.');
  ok(res, cat);
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(Category, req.body.slug || req.body.name);
  created(res, await Category.create({ ...req.body, slug }));
});

export const updateCategory = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Category');
  const cat = await Category.findById(req.params.id);
  if (!cat) throw ApiError.notFound('Category not found.');
  Object.assign(cat, req.body);
  if (req.body.slug) cat.slug = await uniqueSlug(Category, req.body.slug, cat._id);
  await cat.save();
  ok(res, cat);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Category');
  const inUse = await Article.countDocuments({ category: req.params.id });
  if (inUse) {
    throw ApiError.conflict(`This category is used by ${inUse} article(s). Reassign them first.`);
  }
  const removed = await Category.findByIdAndDelete(req.params.id);
  if (!removed) throw ApiError.notFound('Category not found.');
  ok(res, { deleted: true, id: removed._id });
});

/* ---------- tags ---------- */

export const listTags = asyncHandler(async (_req, res) => {
  const [tags, counts] = await Promise.all([Tag.find().sort({ name: 1 }).lean(), countsBy('tags')]);
  ok(res, tags.map((t) => ({ ...t, articleCount: counts.get(String(t._id)) || 0 })));
});

export const createTag = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.slug || req.body.name);
  if (await Tag.exists({ slug })) throw ApiError.conflict('That tag already exists.');
  created(res, await Tag.create({ name: req.body.name, slug }));
});

export const updateTag = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Tag');
  const tag = await Tag.findById(req.params.id);
  if (!tag) throw ApiError.notFound('Tag not found.');
  tag.name = req.body.name;
  if (req.body.slug) tag.slug = await uniqueSlug(Tag, req.body.slug, tag._id);
  await tag.save();
  ok(res, tag);
});

export const deleteTag = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Tag');
  const removed = await Tag.findByIdAndDelete(req.params.id);
  if (!removed) throw ApiError.notFound('Tag not found.');
  await Article.updateMany({ tags: removed._id }, { $pull: { tags: removed._id } });
  ok(res, { deleted: true, id: removed._id });
});
