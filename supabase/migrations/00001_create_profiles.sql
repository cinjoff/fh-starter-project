-- Create profiles table linked to auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- RLS policies (using subquery form for better query planning)
create policy "Users can view their own profile"
  on public.profiles for select
  using (id = (select auth.uid()));

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = (select auth.uid()));

-- Trigger: auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Trigger: auto-update updated_at on profile change
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profile_updated
  before update on public.profiles
  for each row
  execute function public.update_updated_at();
