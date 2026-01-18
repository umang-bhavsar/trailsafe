create table public.hikes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    trail_id text not null,
    emergency_email text not null,
    expected_return_at timestamptz not null,
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    status text not null default 'active',
    last_lat double precision,
    last_lng double precision,
    last_location_at timestamptz,
    alert_sent boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index hikes_user_id_idx on public.hikes (user_id);
create index hikes_status_return_idx on public.hikes (status, expected_return_at);

create table public.breadcrumbs (
    id uuid primary key default gen_random_uuid(),
    hike_id uuid not null references public.hikes(id) on delete cascade,
    lat double precision not null,
    lng double precision not null,
    recorded_at timestamptz not null,
    created_at timestamptz not null default now()
);

create index breadcrumbs_hike_recorded_idx on public.breadcrumbs (hike_id, recorded_at);

create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger hikes_set_updated_at
before update on public.hikes
for each row
execute function public.set_updated_at();

alter table public.hikes enable row level security;

create policy "Hikes are viewable by owner"
on public.hikes for select
using (auth.uid() = user_id);

create policy "Hikes are insertable by owner"
on public.hikes for insert
with check (auth.uid() = user_id);

create policy "Hikes are updatable by owner"
on public.hikes for update
using (auth.uid() = user_id);

alter table public.breadcrumbs enable row level security;

create policy "Breadcrumbs are viewable by owner"
on public.breadcrumbs for select
using (
    exists (
        select 1
        from public.hikes
        where public.hikes.id = public.breadcrumbs.hike_id
          and public.hikes.user_id = auth.uid()
    )
);

create policy "Breadcrumbs are insertable by owner"
on public.breadcrumbs for insert
with check (
    exists (
        select 1
        from public.hikes
        where public.hikes.id = public.breadcrumbs.hike_id
          and public.hikes.user_id = auth.uid()
    )
);
