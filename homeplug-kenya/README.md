# Home Plug Kenya — Team Console

An internal tool for the team: client contacts & viewing schedule, and an
expenses/earnings tracker. Google Sheets is the database, Google Apps Script
is the API, and the frontend is a Next.js app you deploy to Vercel from
GitHub.

```
homeplug-kenya/
  apps-script/Code.gs   <- paste this into a Google Apps Script project
  web/                  <- the Next.js app, push this to GitHub → Vercel
```

## Part 1 — Set up the Google Sheet + API (15 min)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like "Home Plug Kenya — Data".
2. In the sheet, go to **Extensions > Apps Script**.
3. Delete whatever code is in `Code.gs`, then paste in the entire contents
   of `apps-script/Code.gs` from this project.
4. At the top of the file, change `SECRET_KEY` to your own long random
   string (this signs passwords — don't skip it). Anything like a random
   40-character string is fine.
5. In the function dropdown at the top of the editor, select **setup**,
   then click **Run**. The first time, Google will ask you to authorize
   the script — click through **Advanced > Go to (project name) unsafe**
   (this warning shows because it's your own unpublished script, it's
   normal). This creates the `Users`, `Sessions`, `Clients`, and
   `Transactions` tabs and one admin login:
   - username: `admin`
   - password: `changeme123`
6. Click **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize again if asked.
7. Copy the **Web app URL** it gives you — it looks like
   `https://script.google.com/macros/s/AKfycb.../exec`. You'll need this
   in Part 2.

Whenever you edit `Code.gs` later, you need to create a **new deployment
version** (Deploy > Manage deployments > edit (pencil) > New version) for
changes to go live — saving alone isn't enough.

## Part 2 — Run the app locally (optional but recommended first)

1. Make sure you have [Node.js](https://nodejs.org) installed (v18+).
2. In a terminal:
   ```
   cd web
   npm install
   cp .env.local.example .env.local
   ```
3. Open `.env.local` and paste your Apps Script Web App URL as
   `NEXT_PUBLIC_API_URL`.
4. Run `npm run dev`, open `http://localhost:3000`, and log in with
   `admin` / `changeme123`. Go to **Team** and change the admin password,
   then add real accounts for your agents.

## Part 3 — Push to GitHub

1. Create a new empty repository on GitHub (don't add a README there).
2. From the `homeplug-kenya` folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## Part 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com), sign in with GitHub, click
   **Add New > Project**, and import the repo you just pushed.
2. When it asks for the **Root Directory**, set it to `web` (important —
   the Next.js app lives inside the `web` folder, not the repo root).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = your Apps Script Web App URL from Part 1.
4. Click **Deploy**. In a minute or two you'll get a live URL like
   `homeplug-kenya.vercel.app` — share that with your team.

Any time you push to `main` on GitHub, Vercel redeploys automatically.

## How the pieces fit together

- **Clients & Viewings** — one row per client contact: name, phone,
  which property they're coming to view, date/time, which agent is
  handling it, status (Scheduled/Completed/Cancelled/No-show), and the
  viewing fee (with a paid/unpaid flag).
- **Expenses & Earnings** — a simple ledger. Log transport, airtime,
  ads, etc. as expenses, and viewing fees/commissions as earnings. The
  Overview page totals it into earnings, expenses, and net.
- **Team** — admins can add new agent logins (name, username, temporary
  password). Everyone can change their own password.
- All of this data lives in your Google Sheet, so you can also open it
  directly any time for a raw look, pivot tables, or backups.

## Notes & next steps

- This intentionally leaves out public-facing listing pages — it's just
  for your team. If you later want the app to also post listings to your
  socials or a public site, that's a separate, bigger addition — happy to
  help with that when you're ready.
- Passwords are stored as salted-style HMAC hashes (not reversible), but
  this is not bank-grade security — it's appropriate for a small internal
  team tool, not for storing highly sensitive data.
- Google Apps Script web apps have a soft usage ceiling (fine for a team
  of a few people; if you ever scale to heavy daily use, you'd migrate the
  backend to a real database).
