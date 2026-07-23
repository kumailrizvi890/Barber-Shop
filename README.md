# Fade House — Barber Booking App

A production Next.js rebuild of the Fade House barber-booking prototype: customers browse barbers, book a chair, track appointments, and earn rewards; barbers approve/decline requests, manage weekly availability and services, and post work photos/videos.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase** (Postgres, Auth, Storage).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once it's up, open **SQL Editor** → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) → Run. This creates every table, row-level-security policy, and the `posts` storage bucket used by the app.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. In **Authentication → Providers**, email/password is enabled by default — that's all this app uses. If you don't want email-confirmation to block first login during testing, turn off "Confirm email" under **Authentication → Settings**.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/auth`. Sign up once as a **Barber** (add at least one service) so there's someone to book, then sign up again (a different email, e.g. in a private window) as a **Customer** to try the booking flow.

## 4. Deploy

The fastest path is **Vercel**:

1. Push this folder to a GitHub repo (see below).
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo.
3. Add the two env vars from step 2 in the Vercel project settings.
4. Deploy. Vercel auto-detects Next.js — no build config needed.

Any other Node host (Railway, Render, Netlify, self-hosted) works too since this is a standard Next.js app — just set the same two env vars and run `npm run build && npm start`.

## Pushing to GitHub

No GitHub connection was active in this session, so the code lives in this folder rather than a repo. To publish it:

```bash
cd fade-house   # this folder
git init
git add .
git commit -m "Fade House — initial build"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Create the empty repo on GitHub first, or use `gh repo create` if you have the GitHub CLI.)

## What's implemented

- **Auth**: email/password login & signup, role picker (Customer/Barber), barber signup collects phone/location/bio and a repeatable services-&-rates builder — matches validation rules from the original design spec.
- **Customer app**: Home (crew list, book-now hero), 3-step Book flow (barber → service/date/time → confirm), Bookings list with status stripes and tap-to-rate, Rewards (points, progress bar, 5000-pt redemption).
- **Barber app**: Requests (approve/decline), Schedule (Bookings sub-tab with reminder/complete actions; Availability sub-tab with per-weekday recurring slot blocking), Profile (services CRUD, My Work photo/video uploads to Supabase Storage).
- **Notifications**: bell + slide-down panel, generated on request/approve/decline/reminder/completion, unread badge, mark-as-read.
- **Rewards**: 10 points per $1, credited on rating; 5000-point redemption.
- **Data**: everything lives in Postgres via `supabase/schema.sql` — no mock/in-memory state.

## Notes & things you may want to adjust

- **Reminders** are barber-triggered (a button), same as the original prototype — wire this to a Supabase Edge Function + cron if you want real 1-hour-before reminders sent automatically.
- **Slot availability** combines the barber's real blocked slots (`availability` table) with a small amount of deterministic pseudo-randomness (`seededUnavailable` in `app/customer/book/page.tsx`) so the demo doesn't show every slot open before any bookings exist — remove that once you have real booking-density data to grey out slots from.
- **Barber rating** is recalculated as a simple running average of a barber's rated bookings each time a new rating comes in.
- The phone-frame prototype was mobile-only; this rebuild is a responsive web app — full width on phones, a centered card shell on tablet/desktop (see `.app-shell` in `app/globals.css`).
