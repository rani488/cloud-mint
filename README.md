# CloudMint — website starter

A responsive CloudMint public landing page, OTP registration/login interface, and user-dashboard design starter using React + Vite + Supabase.

## Included
- Public landing page with hero artwork styling, package cards, onboarding steps, rewards/team feature panels, and Telegram/WhatsApp links.
- Package-card “Get Started” buttons lead to login; login includes a register link.
- Email OTP registration flow, code verification, and profile completion UI.
- Password login UI, profile/dashboard preview, responsive user dashboard.
- Supabase starter schema with row-level security for user profiles and public active packages.
- Vercel SPA rewrite configuration.

## Important before launch
This is a **starter UI**, not a production financial platform. Real deposits, balances, package activation, mining, bonuses, commissions, reinvestment, or withdrawals are intentionally not enabled. A system that promises fixed or doubled returns or pays referral commissions can trigger financial, consumer-protection, and payment-provider rules. Obtain qualified legal/compliance advice and use a licensed payment provider before enabling real money movement. Do not advertise example rates as guaranteed returns.

The dashboard values are placeholders. Do not use them as real account balances.

## 1. Install
Use Node.js 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with your Supabase Project URL and publishable/anon key. Never expose the Supabase `service_role` key in the browser.

## 2. Supabase setup
1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In **Authentication → URL Configuration**, add your local URL (e.g. `http://localhost:5173`) and your Vercel production URL.
4. In **Authentication → Email Templates / SMTP settings**, configure a trusted email provider and set an OTP-friendly template. Supabase's default email OTP length/configuration may be six digits; change only if the selected Supabase configuration supports it. The UI accepts 6–8 digits.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to local `.env` and Vercel Environment Variables.

The app uses `signInWithOtp` and `verifyOtp`. For a secure production profile flow, add server-side validation and a database trigger/function to maintain profiles. Do not store a withdrawal password in plain text or browser state; use a secure server-side credential/reset flow. The withdrawal password UI in this preview is not persisted.

## 3. GitHub
Create a repository, then:

```bash
git init
git add .
git commit -m "Create CloudMint starter"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 4. Vercel
1. Import the GitHub repository in Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add the two Supabase environment variables.
6. Deploy. `vercel.json` includes an SPA rewrite.

## 5. Logo
Place your approved logo file at `public/cloudmint-logo.png` if you want to use the exact artwork. This starter uses a scalable CSS/Lucide-style logo approximation so the UI remains usable even before the image is added.

## Production work still required
- Secure admin role and admin panel with server-enforced role checks.
- Database-backed package management and audit logs.
- Payment-provider webhooks and a double-entry ledger before any deposit/withdrawal functionality.
- Idempotent transaction processing, reconciliation, withdrawal approvals, fraud controls, rate limits, backups, monitoring, and incident recovery.
- Terms, privacy policy, risk disclosures, identity checks if legally required, and jurisdiction/payment-provider approval.
