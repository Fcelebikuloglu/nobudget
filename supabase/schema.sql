-- Run this once in the Supabase SQL Editor.
create table if not exists public.budget_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  transactions jsonb not null default '[]'::jsonb,
  budgets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.budget_data enable row level security;

create policy "Users can read their own budget"
  on public.budget_data for select using (auth.uid() = user_id);

create policy "Users can insert their own budget"
  on public.budget_data for insert with check (auth.uid() = user_id);

create policy "Users can update their own budget"
  on public.budget_data for update using (auth.uid() = user_id);
