# Deploying TRPB to GitHub + Vercel (step by step)

The whole site deploys as **one Vercel project**: the React site is served as static files and the Express API runs as a serverless function on the same domain (`/api/...`). You need four free accounts:

| Service | What it's for |
| --- | --- |
| **GitHub** | Stores the code; Vercel redeploys on every change |
| **Vercel** | Hosts the site and API |
| **MongoDB Atlas** | The live database (your PC's local MongoDB can't be reached from the internet) |
| **Cloudinary** | Image uploads (Vercel can't store uploaded files) |

Your live link will look like **`https://the-ronins-playbook.vercel.app`** (Vercel picks it from the project name).

---

## Step 1 — Create the database (MongoDB Atlas)

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign up.
2. Create a **free M0 cluster** (any region close to you, e.g. Mumbai `ap-south-1`).
3. **Database Access** → *Add New Database User* → username + password (use letters and numbers only, so it's safe in a URL). Role: *Read and write to any database*.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`). Vercel's servers don't have fixed IPs, so this is required.
5. **Database** → *Connect* → *Drivers* → copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Put your password in, and add the database name `trpb` after `.net/`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/trpb?retryWrites=true&w=majority`
   Keep this string private — it's your **MONGODB_URI**.

## Step 2 — Fill the live database with the sample content (from this PC)

Open **PowerShell** and run (replace the connection string and pick your own admin login):

```powershell
$env:Path = "C:\Users\nairb\OneDrive\Desktop\trpb website\.tools\node-v22.11.0-win-x64;" + $env:Path
cd "C:\Users\nairb\OneDrive\Desktop\trpb website\server"
$env:MONGODB_URI = "mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/trpb?retryWrites=true&w=majority"
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_PASSWORD = "a-strong-password-123"
node src/seed/seed.js
```

You should see `[seed] Done.` and the demo accounts. **The admin email/password you set here is how you'll sign in to the live dashboard.** (The seed wipes TRPB data first — only run it again if you want to reset the live site.)

## Step 3 — Get image-upload keys (Cloudinary)

1. Sign up at <https://cloudinary.com/users/register_free>.
2. On the **Dashboard / API Keys** page copy **Cloud name**, **API Key** and **API Secret**.

## Step 4 — Put the code on GitHub

Use the clean copy at **`C:\Users\nairb\OneDrive\Desktop\trpb-website-github`** (it has no `node_modules`, no `.env` secrets and no local database). Re-create it any time with the PowerShell command at the bottom of this file.

1. Sign in at <https://github.com> → **New repository** (`+` top-right).
2. Name: `the-ronins-playbook` · **Private** · *don't* add a README/gitignore → **Create repository**.

**Option A — GitHub Desktop (easiest if it installs on your PC)**
3. Install <https://desktop.github.com>, sign in.
4. *File → Add local repository* → choose `trpb-website-github` → it offers to **create a repository** → accept.
5. *Commit to main* → **Publish repository** → pick the repo name → Publish.

**Option B — Upload in the browser (works even if installers are blocked)**
GitHub accepts at most 100 files per upload, so do it in two batches:
3. On the empty repo page click **uploading an existing file**.
4. **Batch 1:** open `trpb-website-github` in File Explorer and drag the **`client`** folder into the browser. Wait until every file is listed → *Commit changes*.
5. Click **Add file → Upload files** again. **Batch 2:** select everything else — `api`, `scripts`, `server`, `.gitignore`, `DEPLOY.md`, `package.json`, `package-lock.json`, `README.md`, `vercel.json` — drag them in → *Commit changes*.
6. Check the repo shows `api/`, `client/`, `server/` and `vercel.json` at the top level.

## Step 5 — Deploy on Vercel

1. Go to <https://vercel.com/signup> → **Continue with GitHub**.
2. **Add New… → Project** → find `the-ronins-playbook` → **Import** (allow Vercel access to the repo if asked).
3. On the configure screen:
   - **Framework Preset:** `Other`
   - **Root Directory:** leave as `./`
   - **Build & Output settings:** leave alone — `vercel.json` already sets them.
4. Open **Environment Variables** and add these (Name → Value):

   | Name | Value |
   | --- | --- |
   | `MONGODB_URI` | your Atlas string from Step 1 |
   | `JWT_SECRET` | a long random string (64+ characters — mash the keyboard or use a password generator) |
   | `CLIENT_URL` | `https://the-ronins-playbook.vercel.app` (fix it in step 7 if Vercel gives a different URL) |
   | `VITE_SITE_URL` | same as `CLIENT_URL` |
   | `COOKIE_SECURE` | `true` |
   | `CLOUDINARY_CLOUD_NAME` | from Step 3 |
   | `CLOUDINARY_API_KEY` | from Step 3 |
   | `CLOUDINARY_API_SECRET` | from Step 3 |
   | `CRON_SECRET` | another random string (protects the scheduled-publishing job) |

   ⚠️ Do **not** add `NODE_ENV` — Vercel sets it, and adding it can break the build.
5. Click **Deploy** and wait ~2–3 minutes.
6. When it says *Congratulations*, click the preview — **that's your live website link**.
7. If the URL is different from what you typed for `CLIENT_URL`, go to **Settings → Environment Variables**, update `CLIENT_URL` and `VITE_SITE_URL` to the exact URL (no trailing `/`), then **Deployments → ⋯ → Redeploy**.

## Step 6 — Check it works

- `https://YOUR-URL/api/health` → shows `"status":"ok"`.
- The homepage shows the lead story and the Instagram button.
- **Sign in** with the admin email/password from Step 2 → avatar menu → **Dashboard**.
- In the dashboard, create a test article and upload an image (this proves Cloudinary works), then delete it.

## Updating the site later

Change files → push them to GitHub (GitHub Desktop: *Commit* + *Push*; browser: *Add file → Upload files* into the right folder). Vercel redeploys automatically in about two minutes.

## Optional — your own domain

Vercel → Project → **Settings → Domains** → add e.g. `theroninsplaybook.com` and follow the DNS instructions. Then set `CLIENT_URL` and `VITE_SITE_URL` to `https://theroninsplaybook.com` and redeploy.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| API returns *“Database unavailable”* | Atlas **Network Access** must allow `0.0.0.0/0`; check the password in `MONGODB_URI` |
| You sign in but appear signed out | Make sure `CLIENT_URL` matches the site URL exactly and `COOKIE_SECURE=true` |
| *“Image uploads need Cloudinary”* | The three `CLOUDINARY_*` variables are missing or wrong — fix, then redeploy |
| Build fails | Open the failed deployment's **Build Logs**; check you didn't add `NODE_ENV` |

### How scheduling works on Vercel
Scheduled articles are published automatically the first time anyone visits the site after their time arrives (checked at most once a minute), plus a daily backup job (`vercel.json → crons`). There's no always-on server process on Vercel.

### Re-create the clean GitHub copy (PowerShell)

```powershell
$src = "C:\Users\nairb\OneDrive\Desktop\trpb website"; $dst = "C:\Users\nairb\OneDrive\Desktop\trpb-website-github"
if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
robocopy $src $dst /E /XD node_modules .tools .mongo-data dist .claude /XF .env "*.log"
Get-ChildItem "$dst\server\uploads" -File | Where-Object Name -ne '.gitkeep' | Remove-Item
```
