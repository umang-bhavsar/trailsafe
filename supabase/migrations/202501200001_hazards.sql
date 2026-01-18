create table public.hazards (
    id uuid primary key default gen_random_uuid(),
    trail_id text not null,
    user_id uuid references auth.users (id) on delete set null,
    lat double precision,
    lng double precision,
    note text,
    created_at timestamptz not null default now()
);

create index hazards_trail_created_idx on public.hazards (trail_id, created_at desc);
create index hazards_created_idx on public.hazards (created_at);

alter table public.hazards enable row level security;

create policy "Hazards are readable by authenticated users"
on public.hazards for select
using (auth.role() = 'authenticated');

create policy "Hazards are insertable by authenticated users"
on public.hazards for insert
with check (auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid()));

create policy "Hazards are updatable by owner"
on public.hazards for update
using (user_id = auth.uid());

create policy "Hazards are deletable by owner"
on public.hazards for delete
using (user_id = auth.uid());

do $$
begin
    if not exists (select 1 from pg_proc where proname = 'purge_old_hazards') then
        create or replace function public.purge_old_hazards()
        returns void
        language sql
        security definer
        set search_path = public
        as $func$
            delete from public.hazards
            where created_at < now() - interval '2 days';
        $func$;
    end if;
end$$;

-- Schedule hourly purge if not already scheduled
do $$
begin
    if not exists (select 1 from cron.job where jobname = 'purge_old_hazards') then
        perform cron.schedule(
            'purge_old_hazards',
            '0 * * * *',
            $$ select public.purge_old_hazards(); $$
        );
    end if;
end$$;
