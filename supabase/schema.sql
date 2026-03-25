-- Enable required extension
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  language text default 'en',
  cover_image_url text,
  created_at timestamptz default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  name text not null,
  order_index int default 0,
  panorama_url text,
  created_at timestamptz default now()
);

create table if not exists public.room_photos (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz default now()
);

create table if not exists public.hotspots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  target_room_id uuid not null references public.rooms(id) on delete cascade,
  yaw float not null,
  pitch float not null,
  label text,
  created_at timestamptz default now()
);

create index if not exists idx_tours_owner_id on public.tours(owner_id);
create index if not exists idx_rooms_tour_id on public.rooms(tour_id);
create index if not exists idx_room_photos_room_id on public.room_photos(room_id);
create index if not exists idx_hotspots_room_id on public.hotspots(room_id);

alter table public.profiles enable row level security;
alter table public.tours enable row level security;
alter table public.rooms enable row level security;
alter table public.room_photos enable row level security;
alter table public.hotspots enable row level security;

-- Profiles
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Tours
create policy "tours_owner_crud"
on public.tours
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "tours_public_read_published"
on public.tours
for select
to anon, authenticated
using (status = 'published');

-- Rooms
create policy "rooms_owner_crud"
on public.rooms
for all
to authenticated
using (
  exists (
    select 1 from public.tours t
    where t.id = rooms.tour_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.tours t
    where t.id = rooms.tour_id
      and t.owner_id = auth.uid()
  )
);

create policy "rooms_public_read_published"
on public.rooms
for select
to anon, authenticated
using (
  exists (
    select 1 from public.tours t
    where t.id = rooms.tour_id
      and t.status = 'published'
  )
);

-- Room photos
create policy "room_photos_owner_crud"
on public.room_photos
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.tours t on t.id = r.tour_id
    where r.id = room_photos.room_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.tours t on t.id = r.tour_id
    where r.id = room_photos.room_id
      and t.owner_id = auth.uid()
  )
);

create policy "room_photos_public_read_published"
on public.room_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.tours t on t.id = r.tour_id
    where r.id = room_photos.room_id
      and t.status = 'published'
  )
);

-- Hotspots
create policy "hotspots_owner_crud"
on public.hotspots
for all
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.tours t on t.id = r.tour_id
    where r.id = hotspots.room_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.tours t on t.id = r.tour_id
    where r.id = hotspots.room_id
      and t.owner_id = auth.uid()
  )
);

create policy "hotspots_public_read_published"
on public.hotspots
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.tours t on t.id = r.tour_id
    where r.id = hotspots.room_id
      and t.status = 'published'
  )
);

-- Buckets
insert into storage.buckets (id, name, public)
values ('tour-uploads', 'tour-uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('tour-public', 'tour-public', true)
on conflict (id) do nothing;

-- Storage RLS
create policy "tour_uploads_owner_write"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'tour-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'tour-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "tour_public_owner_write"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'tour-public'
  and exists (
    select 1 from public.tours t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'tour-public'
  and exists (
    select 1 from public.tours t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = auth.uid()
  )
);

create policy "tour_public_read_all"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'tour-public');

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
