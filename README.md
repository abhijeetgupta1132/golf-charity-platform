# ⛳ Fairway For Good — Golf Charity Subscription Platform

A full-stack web application built for the Digital Heroes Full Stack Development Trainee selection process.

**Live demo**: [Deploy via the steps below]
**Stack**: React + Vite · Supabase · Stripe · Vercel

---

## Features Implemented

### User Features
- ✅ Subscription system (monthly £9.99 / yearly £99) via Stripe
- ✅ Score entry with rolling 5-score system (1–45 Stableford, auto-removes oldest)
- ✅ Charity selection with 10%+ contribution model
- ✅ Monthly draw participation (auto-qualified when subscribed + 5 scores)
- ✅ User dashboard with subscription status, scores, charity, winnings
- ✅ Prize history with payment status tracking

### Draw System
- ✅ 5-number, 4-number, 3-number match tiers
- ✅ Random draw mode (lottery-style)
- ✅ Algorithmic mode (weighted by most/least frequent user scores)
- ✅ Jackpot rollover when no 5-match winner
- ✅ Prize split equally among multiple winners per tier
- ✅ Admin simulation/pre-analysis before publish

### Admin Panel
- ✅ User management (edit names, roles, subscription status)
- ✅ Draw management (configure, simulate, publish)
- ✅ Charity management (add/edit/delete/hide)
- ✅ Winner verification (Pending → Verified → Paid flow)
- ✅ Overview dashboard with stats

### Technical
- ✅ Mobile-first responsive design
- ✅ JWT auth via Supabase Auth
- ✅ Row Level Security (RLS) on all tables
- ✅ Stripe webhook lifecycle (checkout, renewal, cancellation)
- ✅ Clean, commented codebase

---

## 🚀 Deployment Guide (2-Day Checklist)

### Step 1 — Supabase Setup (20 mins)

1. Go to **supabase.com** → Create new account → New project
2. Note your **Project URL** and **anon public key** (Settings → API)
3. Also note your **service_role key** (keep this secret — server-side only)
4. Go to **SQL Editor** → New query → Paste the full contents of `supabase/schema.sql` → Run

> This creates all tables, RLS policies, triggers, and seed data.

5. Go to **Authentication → Settings** → Enable Email/Password
6. Optionally disable email confirmation for demo: Auth → Settings → "Confirm email" OFF

### Step 2 — Stripe Setup (15 mins)

1. Go to **dashboard.stripe.com** → Create new account
2. Go to **Products** → Add product: "Fairway For Good Membership"
3. Add two prices:
   - Monthly: £9.99 / month → Copy **Price ID** (`price_xxx`)
   - Yearly: £99.00 / year → Copy **Price ID** (`price_xxx`)
4. Go to **Developers → API keys** → Copy **Secret key** (`sk_test_xxx`)
5. Keep the webhook secret for Step 4

### Step 3 — GitHub Setup (5 mins)

```bash
git init
git add .
git commit -m "Initial commit — Fairway For Good"
git remote add origin https://github.com/YOUR_USERNAME/fairway-for-good.git
git push -u origin main
```

### Step 4 — Vercel Deployment (10 mins)

1. Go to **vercel.com** → Create new account → Import Git repo
2. Set **Root Directory** to `frontend`
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Add Environment Variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_STRIPE_MONTHLY_PRICE_ID` | Stripe monthly price ID |
| `VITE_STRIPE_YEARLY_PRICE_ID` | Stripe yearly price ID |
| `VITE_APP_URL` | Your Vercel URL (set after first deploy) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

6. Deploy! Get your live URL.
7. Go back to Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://YOUR_APP.vercel.app/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy webhook signing secret → Add as `STRIPE_WEBHOOK_SECRET` env var in Vercel

### Step 5 — Create Admin User (5 mins)

1. Register normally via your live app
2. Go to Supabase SQL Editor and run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```
3. Sign out and back in — you'll see the Admin Panel in the navbar

---

## Test Credentials (for submission)

After deploying, create these accounts:

**Regular User:**
- Email: `user@demo.com`
- Password: `demo1234`

**Admin User:**
- Email: `admin@demo.com`
- Password: `admin1234`
- Then run: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@demo.com';`

---

## Project Structure

```
fairway-for-good/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, AdminLayout
│   │   ├── context/          # AuthContext (Supabase auth state)
│   │   ├── pages/
│   │   │   ├── Home.jsx      # Landing page
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx # User dashboard
│   │   │   ├── Scores.jsx    # Score entry (rolling 5)
│   │   │   ├── Charities.jsx # Browse & select charity
│   │   │   ├── Draws.jsx     # Prize draw info & results
│   │   │   ├── Subscribe.jsx # Stripe subscription
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminDraws.jsx     # Draw engine + simulation
│   │   │       ├── AdminCharities.jsx
│   │   │       └── AdminWinners.jsx   # Verify & pay winners
│   │   └── utils/
│   │       └── supabase.js
│   └── package.json
├── api/
│   ├── create-checkout-session.js   # Stripe checkout
│   └── stripe-webhook.js            # Subscription lifecycle
├── supabase/
│   └── schema.sql                   # Complete DB schema + RLS
└── README.md
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extends Supabase auth users with name, role |
| `subscriptions` | Stripe subscription state per user |
| `golf_scores` | Up to 5 Stableford scores per user (auto-rolling) |
| `charities` | Charity listings with raised totals |
| `charity_selections` | User ↔ charity mapping + contribution % |
| `draws` | Monthly draw records with prize pool breakdown |
| `winnings` | Winner records with payment lifecycle |

---

## PRD Requirements Checklist

| Requirement | Status |
|---|---|
| Subscription engine (monthly + yearly) | ✅ |
| Stripe payment gateway | ✅ |
| Non-subscribers get restricted access | ✅ |
| Subscription renewal/cancellation lifecycle | ✅ |
| Score entry 1–45 Stableford | ✅ |
| Rolling 5-score system | ✅ |
| Scores in reverse chronological order | ✅ |
| 5/4/3 number draw tiers | ✅ |
| Random draw logic | ✅ |
| Algorithmic draw logic | ✅ |
| Monthly draw cadence | ✅ |
| Admin simulation mode | ✅ |
| Jackpot rollover | ✅ |
| 40/35/25% prize pool split | ✅ |
| Split prizes among multiple winners | ✅ |
| Charity selection at signup | ✅ |
| 10% minimum contribution | ✅ |
| Charity directory with search/filter | ✅ |
| User dashboard (all modules) | ✅ |
| Admin dashboard (all modules) | ✅ |
| Winner verification flow | ✅ |
| Payout tracking (Pending→Verified→Paid) | ✅ |
| Mobile-first responsive design | ✅ |
| JWT-based auth | ✅ via Supabase |
| Emotion-driven non-golf-cliché design | ✅ |

Built by: [Your Name] · Digital Heroes Selection · March 2026
