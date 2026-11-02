# THE RONIN'S PLAYBOOK (TRPB)

> **Football, Beyond The 90.**

A football editorial and community platform built on the MERN stack: long reads, tactical analysis with boards, player files, polls, comments and an editorial dashboard.

```
client/   React 18 + Vite + Tailwind CSS + React Router + TipTap + Recharts + Framer Motion
server/   Node.js + Express + MongoDB (Mongoose) + JWT (HTTP-only cookies) + Zod + Cloudinary
```

---

## Quick start (local development)

**Requirements:** Node.js 18.18 or newer (20 LTS recommended) and MongoDB 6+ (local install, Docker, or a free MongoDB Atlas cluster).

```bash
# 1. Install everything (root, server, client)
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env      # then edit values
cp client/.env.example client/.env

# 3. Seed sample content (clears TRPB collections first!)
npm run seed

# 4. Run API (http://localhost:5000) and web (http://localhost:5173) together
npm run dev
```

The seed prints the demo accounts. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env` to reach `/dashboard`.

### Running MongoDB

- **Docker:** `docker run -d --name trpb-mongo -p 27017:27017 mongo:7`
- **Atlas:** create a free cluster, add a database user, allow your IP, and set `MONGODB_URI=mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/trpb`.

### Windows machines with Application Control (Smart App Control / WDAC)

Some locked-down Windows PCs block MSI installers and native Node add-ons. This repo copes with that:

- `client/package.json` overrides Rollup with `@rollup/wasm-node`, so Vite builds without a native `.node` binary (slightly slower builds; harmless elsewhere).
- Portable Node.js and MongoDB can live in `.tools/` (git-ignored). `scripts/dev-local.ps1` puts them on `PATH`, starts `mongod` with data in `.mongo-data/`, and runs `npm run dev`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev-local.ps1 -Seed   # first run
powershell -ExecutionPolicy Bypass -File scripts\dev-local.ps1         # afterwards
```

### Root scripts

| Script | What it does |
| --- | --- |
| `npm run install:all` | Install root, server and client dependencies |
| `npm run dev` | API + Vite dev server concurrently |
| `npm run seed` | Reset and seed the database with sample content |
| `npm run build` | Production build of the client into `client/dist` |
| `npm start` | Start the API (serves `client/dist` too when `NODE_ENV=production`) |
| `npm run test:smoke` | End-to-end API checks against a running, freshly seeded server |

---

## Environment variables

### `server/.env`

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | no | Default `5000` |
| `MONGODB_URI` | yes | e.g. `mongodb://127.0.0.1:27017/trpb` |
| `JWT_SECRET` | yes in production | Long random string. A dev-only fallback is used locally with a warning |
| `CLIENT_URL` | yes | Allowed browser origin(s), comma-separated. Also used for canonical URLs and the sitemap |
| `NODE_ENV` | no | `development` or `production` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for seeding | The seed creates this administrator. Never commit real values |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | no | When all three are set, uploads go to Cloudinary; otherwise to `server/uploads` |
| `COOKIE_SAMESITE` | no | `lax` (default) or `none` for cross-site deployments (forces `Secure`) |
| `SEED_USER_PASSWORD` | no | Password for seeded demo editors/readers. Random per run if unset |
| `SCHEDULER_INTERVAL_MS` | no | How often scheduled articles are checked. Default 60000 |

### `client/.env`

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | `/api` in development (Vite proxies it). Full URL if the API is on another host |
| `VITE_SITE_URL` | Public site URL for canonical / Open Graph tags |
| `VITE_DEV_API_TARGET` | Where the dev proxy sends `/api`, `/uploads`, `/sitemap.xml`, `/robots.txt` |

---

## Features

### Public site
- Editorial homepage: lead story, “Just in”, featured grid, latest feed with **load more**, trending (views × likes × comments × bookmarks, decayed by age), Tactical Room, Player Files, polls & debates, newsletter sign-up.
- Article pages: cover with caption/credit, category, date, author, reading time, sanitised rich text, figures with captions, auto **table of contents** for longer pieces, tags, players, related articles, view count, like, bookmark, native share with clipboard fallback, threaded comments, JSON-LD.
- Category pages (6 seeded sections) with sorting and numbered pagination.
- Search across titles, excerpts, body text, tags, players, clubs and categories (weighted MongoDB text index, with substring fallback), category filter, sort, pagination. With no query it becomes an archive browser with tag filters.
- Player profiles: portrait, nationality, position, club, summary, career timeline, achievements, related articles, **1–10 community ratings** with distribution.
- Reusable `TacticalBlock` component: formation and phase shapes, team-shape summary, role table and annotated boards.

### Community
- Registration, login, logout, HTTP-only cookie sessions, profile editing (name, username, bio, club, avatar upload, password change).
- Likes, bookmarks with named **reading lists**, comments with one level of replies, comment reporting.
- Polls with one vote per user (unique index) and animated result bars; player ratings with one rating per user (re-rating updates).

### Dashboard (`/dashboard`)
| Role | Can do |
| --- | --- |
| USER | Read, comment, like, bookmark, vote, rate |
| EDITOR | + create/edit/preview/publish/unpublish/schedule/delete **own** articles, upload images, see analytics for own articles |
| ADMIN | + everything: all articles, featuring, categories, tags, players, polls, comment moderation, users & roles, newsletter list |

Every rule is enforced in Express middleware/controllers; the UI only hides what you can’t use.

- Overview cards and Recharts analytics (top articles engagement, monthly publishing/views, category share).
- TipTap editor: H2/H3, bold/italic/strike, lists, pull quotes, dividers, links, images with alt text and captions (upload or URL), undo/redo.
- Draft / scheduled / published states. **Scheduling is real:** an in-process scheduler publishes due articles every minute while the API is running. On serverless hosts, call `publishDueArticles()` from a cron job instead.

---

## API

All responses use `{ success: true, data, meta? }` or `{ success: false, error: { message, code, details? } }`. List endpoints accept `page` and `limit` (capped) and return `meta: { page, limit, total, pages, hasMore }`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` |
| Articles | `GET /api/articles` (`category`, `tag`, `player`, `author`, `sort=newest\|popular\|discussed\|oldest`) · `GET /api/articles/featured` · `GET /api/articles/trending` · `GET /api/articles/:slug` · `POST /api/articles` · `PATCH /api/articles/:id` · `DELETE /api/articles/:id` · `POST /api/articles/:id/view` · `GET /api/articles/:id/related` |
| Engagement | `POST /api/articles/:id/like` · `POST /api/articles/:id/bookmark` · `GET/POST /api/articles/:id/comments` · `POST /api/comments/:id/replies` · `DELETE /api/comments/:id` · `POST /api/comments/:id/report` |
| Taxonomy | `GET /api/categories` · `GET /api/categories/:slug` · `GET /api/tags` · admin `POST/PATCH/DELETE` on both |
| Search | `GET /api/search?q=&category=&sort=relevance\|newest\|popular&page=` |
| Users | `GET /api/users/:username` · `PATCH /api/users/me` · `GET /api/users/me/bookmarks` · `PATCH /api/users/me/bookmarks/:articleId` |
| Polls | `GET /api/polls` · `GET /api/polls/:id` · `POST /api/polls/:id/vote` · admin `POST/PATCH/DELETE /api/polls` |
| Players | `GET /api/players` · `GET /api/players/:slug` · `POST /api/players/:id/rate` · admin `POST/PATCH/DELETE /api/players` |
| Admin | `GET /api/admin/analytics` · `GET /api/admin/articles` · `GET /api/admin/articles/:id` · `PATCH /api/admin/articles/:id/featured` · `GET /api/admin/users` · `PATCH /api/admin/users/:id/role` · `GET /api/admin/comments` · `PATCH /api/admin/comments/:id` · `GET /api/admin/subscribers` |
| Other | `POST /api/newsletter` · `POST /api/uploads` · `POST /api/uploads/avatar` · `GET /sitemap.xml` · `GET /robots.txt` · `GET /api/health` |

Rate limits: auth endpoints 20 / 15 min per IP; public writes 40 / min per IP.

---

## Security notes
- Passwords hashed with bcrypt (12 rounds); JWT in an HTTP-only, `SameSite` cookie (`Secure` in production).
- Role is re-read from the database on every request, so demotions apply immediately. Admins can’t change their own role and the last admin can’t be demoted.
- Article HTML is sanitised server-side with a strict whitelist; comments and bios are stored as plain text.
- Unique compound indexes guard likes, bookmarks, poll votes and player ratings against duplicates and race conditions.
- Public endpoints only ever return `status: published` with `publishedAt <= now`; drafts are visible only to their author and admins.
- Helmet, CORS allow-list with credentials, JSON body size limit, validated inputs (Zod) everywhere.

---

## SEO
- Per-page `<title>`, description, canonical, Open Graph and Twitter tags (`useSeo` hook), JSON-LD on articles.
- `GET /sitemap.xml` (home, sections, published articles, players) and `GET /robots.txt`, generated from the database.
- **In production the Express server serves the built client and injects article/player/category metadata into the initial HTML**, so link previews and non-JS crawlers see real titles, descriptions and images. The page body itself is still client-rendered; for full prerendering of article bodies, add SSR/prerendering.
- Lazy-loaded responsive images (`srcset` for Unsplash and Cloudinary URLs), with a designed fallback when an image fails.

---

## Deployment

**Vercel + GitHub:** see [DEPLOY.md](DEPLOY.md) for a step-by-step guide. The repo includes `vercel.json` and `api/index.js`, which run the Express API as a serverless function next to the static site, on one domain.

### Option A — single Node service
Deploy the repo to one Node host (Render, Railway, Fly.io, a VPS):

```bash
npm run install:all && npm run build
NODE_ENV=production npm start
```

Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL=https://your-domain` and Cloudinary keys. The API serves `client/dist`, `/sitemap.xml`, `/robots.txt` and SEO-injected HTML from the same origin, so cookies stay first-party and `COOKIE_SAMESITE=lax` works.

> Without Cloudinary, uploads are written to `server/uploads`, which is lost on hosts with ephemeral disks. Configure Cloudinary for production.

### Option B — separate client and API
- Host `client/dist` on a static host and set `VITE_API_URL=https://api.example.com/api` at build time.
- Set `CLIENT_URL=https://www.example.com` on the API. If the two are on **different sites**, set `COOKIE_SAMESITE=none` (HTTPS required). Prefer subdomains of one site (`www.` + `api.`) so `lax` keeps working.
- Add rewrites on the static host: all routes → `index.html`; `/sitemap.xml` and `/robots.txt` → the API.

### Seeding production
The seed refuses to run with `NODE_ENV=production` unless you pass `--force` (`npm run seed --prefix server -- --force`). It **deletes** existing TRPB data first.

---

## Sample content
The seed creates 6 categories, 12 tags, 6 player profiles, 13 articles (11 published, 1 draft, 1 scheduled), comments, likes, bookmarks, 3 polls and ratings.

**All players, clubs and matches are fictional and labelled as samples.** Seed poll counts include sample baseline votes and seeded view counts are illustrative. Historical essays describe well-known ideas in general terms without invented statistics. Photos are from Unsplash; tactical boards are original SVG diagrams in `client/public/images/tactics`.

No email is sent by the newsletter form — it stores sign-ups for you to export or connect to an email provider.
