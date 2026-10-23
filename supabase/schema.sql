-- CloudMint starter schema. Run in Supabase SQL Editor after reviewing.
-- This scaffold intentionally does NOT implement deposits, guaranteed returns,
-- mining payouts, referral commissions, or withdrawals. Those require a compliant
-- payment provider, legal review, and server-side ledger/approval logic.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  display_rate numeric(7,4),
  duration_days integer not null default 120 check (duration_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.packages enable row level security;
create policy "Anyone can view active packages" on public.packages for select using (is_active = true);

insert into public.packages(name,price,display_rate,duration_days) values
 ('Basic',50,2.00,120),('Premium',100,2.50,120),('Pro',200,3.00,120),('Elite',500,3.50,120),('VIP',1000,4.00,120)
on conflict do nothing;

-- IMPORTANT:
-- Create the first administrator using Supabase Auth, then assign admin status
-- through a server-controlled process (never trust a browser-supplied role).
-- Do not add a public policy that lets users modify their own role or balances.
