import { z } from 'zod';
import { ARTICLE_STATUSES } from '../models/Article.js';

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id.');
const str = (max, min = 0) => z.string().trim().min(min).max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'), 'Must be a valid URL.');

/* ---------- auth & users ---------- */

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[A-Za-z]/, 'Password must include a letter.')
  .regex(/[0-9]/, 'Password must include a number.');

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, 'Username: 3–24 characters, letters, numbers or underscores.');

export const registerSchema = z.object({
  name: str(80, 2),
  username,
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email is required.'),
  password: z.string().min(1, 'Password is required.').max(128),
});

export const updateMeSchema = z
  .object({
    name: str(80, 2),
    username,
    bio: str(280),
    avatar: optionalUrl,
    favouriteClub: str(60),
    currentPassword: z.string().max(128),
    newPassword: password,
  })
  .partial()
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: 'Enter your current password to set a new one.',
    path: ['currentPassword'],
  });

export const roleSchema = z.object({ role: z.enum(['USER', 'EDITOR', 'ADMIN']) });

/* ---------- articles ---------- */

const image = z
  .object({ url: optionalUrl, alt: str(200), caption: str(300), credit: str(120) })
  .partial();

const tactical = z
  .object({
    formation: str(20),
    inPossession: str(20),
    outOfPossession: str(20),
    summary: str(1200),
    roles: z
      .array(z.object({ position: str(20, 1), role: str(60, 1), description: str(500) }))
      .max(14),
    boards: z.array(image).max(8),
  })
  .partial();

export const articleCreateSchema = z.object({
  title: str(160, 3),
  slug: str(90).optional(),
  excerpt: str(400).default(''),
  coverImage: image.default({}),
  category: objectId,
  tags: z.array(objectId).max(12).default([]),
  players: z.array(objectId).max(12).default([]),
  clubs: z.array(str(60, 1)).max(12).default([]),
  content: z.string().max(300_000).default(''),
  status: z.enum(ARTICLE_STATUSES).default('draft'),
  scheduledFor: z.coerce.date().nullable().optional(),
  featured: z.boolean().optional(),
  tactical: tactical.nullable().optional(),
  seo: z.object({ metaTitle: str(70), metaDescription: str(170) }).partial().optional(),
});

export const articleUpdateSchema = articleCreateSchema.partial();

/* ---------- taxonomy ---------- */

export const categorySchema = z.object({
  name: str(60, 2),
  slug: str(60).optional(),
  description: str(300).default(''),
  kicker: str(60).default(''),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export const tagSchema = z.object({ name: str(40, 2), slug: str(40).optional() });

/* ---------- community ---------- */

export const commentSchema = z.object({ body: str(2000, 2) });
export const reportSchema = z.object({ reason: str(200).default('') });
export const voteSchema = z.object({ optionId: objectId });
export const rateSchema = z.object({ score: z.coerce.number().int().min(1).max(10) });
export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});
export const bookmarkListSchema = z.object({ list: str(40, 1) });

/* ---------- polls & players (admin) ---------- */

export const pollSchema = z.object({
  question: str(200, 5),
  description: str(600).default(''),
  options: z
    .array(z.object({ _id: objectId.optional(), text: str(120, 1) }))
    .min(2, 'A poll needs at least two options.')
    .max(8),
  status: z.enum(['open', 'closed']).default('open'),
  closesAt: z.coerce.date().nullable().optional(),
  featured: z.boolean().default(false),
  article: objectId.nullable().optional(),
});
export const pollUpdateSchema = pollSchema.partial();

export const playerSchema = z.object({
  name: str(80, 2),
  slug: str(90).optional(),
  portrait: optionalUrl.default(''),
  nationality: str(60).default(''),
  position: str(40).default(''),
  currentClub: str(80).default(''),
  born: str(40).default(''),
  preferredFoot: z.enum(['Left', 'Right', 'Both', '']).default(''),
  summary: str(3000).default(''),
  timeline: z
    .array(
      z.object({
        club: str(80, 1),
        from: str(12, 1),
        to: str(12).default(''),
        note: str(300).default(''),
        loan: z.boolean().default(false),
      })
    )
    .max(30)
    .default([]),
  achievements: z
    .array(z.object({ title: str(120, 1), year: str(12).default(''), detail: str(300).default('') }))
    .max(40)
    .default([]),
  isSample: z.boolean().default(false),
});
export const playerUpdateSchema = playerSchema.partial();

export const commentModerationSchema = z.object({
  status: z.enum(['visible', 'hidden', 'removed']),
  clearReports: z.boolean().optional(),
});
