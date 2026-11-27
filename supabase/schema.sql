-- =====================================================================
-- Ruang Belajar AI — skema database Supabase
-- Jalankan sekali di Supabase → SQL Editor → New query → Run.
-- Setelah itu jalankan supabase/seed.sql untuk data contoh (opsional).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Navigasi (RESOURCES · KNOWLEDGES · ARTICLES, dst.) ----------
create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  label       text not null,
  type        text not null check (type in ('cards', 'videos', 'articles')),
  heading     text not null default '',
  description text not null default '',
  position    int  not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Item di setiap navigasi ----------
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.sections(id) on delete cascade,
  title       text not null,
  summary     text not null default '',
  category    text not null default '',
  tags        text[] not null default '{}',
  level       text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  url         text not null default '',
  duration    text not null default '',
  body        text not null default '',
  position    int  not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists items_section_position_idx on public.items (section_id, position);

-- ---------- Admin (terhubung ke Supabase Auth) ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- ---------- Pengguna (login email tanpa password) ----------
create table if not exists public.learners (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  level      text check (level in ('beginner', 'intermediate', 'advanced')),
  answers    jsonb,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

-- ---------- Materi yang dibuka pengguna (untuk dashboard) ----------
create table if not exists public.item_views (
  id            bigint generated always as identity primary key,
  learner_email text not null,
  item_id       uuid not null references public.items(id) on delete cascade,
  created_at    timestamptz not null default now()
);
create index if not exists item_views_created_idx on public.item_views (created_at);

-- ---------- Fungsi bantu ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Pengguna masuk dengan email: dibuat bila belum ada, lalu kembalikan levelnya.
create or replace function public.learner_login(p_email text)
returns table (learner_email text, learner_level text)
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Format email belum benar.';
  end if;
  insert into public.learners (email) values (v_email)
  on conflict (email) do update set last_seen = now();
  return query select l.email, l.level from public.learners l where l.email = v_email;
end $$;

-- Simpan hasil kuesioner.
create or replace function public.learner_save_level(p_email text, p_level text, p_answers jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_level not in ('beginner', 'intermediate', 'advanced') then
    raise exception 'Level tidak valid.';
  end if;
  update public.learners set level = p_level, answers = p_answers, last_seen = now()
  where email = lower(trim(p_email));
end $$;

-- Catat materi yang dibuka. Hanya untuk pengguna terdaftar dan materi yang tampil.
create or replace function public.learner_track_view(p_email text, p_item_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
begin
  if not exists (select 1 from public.learners where email = v_email) then return; end if;
  if not exists (select 1 from public.items where id = p_item_id and published) then return; end if;
  update public.learners set last_seen = now() where email = v_email;
  insert into public.item_views (learner_email, item_id) values (v_email, p_item_id);
end $$;

revoke all on function public.learner_track_view(text, uuid) from public;
grant execute on function public.learner_track_view(text, uuid) to anon, authenticated;
revoke all on function public.learner_login(text) from public;
revoke all on function public.learner_save_level(text, text, jsonb) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.learner_login(text) to anon, authenticated;
grant execute on function public.learner_save_level(text, text, jsonb) to anon, authenticated;

-- ---------- Row Level Security ----------
alter table public.sections enable row level security;
alter table public.items    enable row level security;
alter table public.admins   enable row level security;
alter table public.learners enable row level security;
alter table public.item_views enable row level security;

drop policy if exists "sections: publik baca yang tampil" on public.sections;
drop policy if exists "sections: admin kelola"            on public.sections;
drop policy if exists "items: publik baca yang tampil"    on public.items;
drop policy if exists "items: admin kelola"               on public.items;
drop policy if exists "admins: lihat diri sendiri"        on public.admins;
drop policy if exists "learners: admin baca"              on public.learners;
drop policy if exists "item_views: admin baca"            on public.item_views;

create policy "sections: publik baca yang tampil" on public.sections
  for select using (is_visible or public.is_admin());
create policy "sections: admin kelola" on public.sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "items: publik baca yang tampil" on public.items
  for select using (
    (published and exists (select 1 from public.sections s where s.id = section_id and s.is_visible))
    or public.is_admin()
  );
create policy "items: admin kelola" on public.items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins: lihat diri sendiri" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Data pengguna hanya bisa dibaca admin. Pengguna sendiri hanya lewat fungsi di atas.
create policy "learners: admin baca" on public.learners
  for select to authenticated using (public.is_admin());

-- Riwayat materi yang dibuka hanya bisa dibaca admin; dicatat lewat learner_track_view.
create policy "item_views: admin baca" on public.item_views
  for select to authenticated using (public.is_admin());
