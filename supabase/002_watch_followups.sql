-- Flight Watch, follow-up automation, airport slugs. Apply via the Supabase Management API.

alter table fcc_airports_covered
  add column if not exists slug text,
  add column if not exists iata text,
  add column if not exists country text,
  add column if not exists city text;
create unique index if not exists fcc_airports_covered_slug_idx on fcc_airports_covered (slug);

-- Private key store: the cron RPCs compare a caller-supplied key against this. Anon cannot read it.
create table if not exists fcc_secrets (key text primary key, value text not null);
alter table fcc_secrets enable row level security;

create table if not exists fcc_watches (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  email text not null,
  flight_number text not null,
  flight_date date not null,
  departure_iata text,
  passengers int not null default 1,
  status text not null default 'pending',
  confirmed_at timestamptz,
  check_token text,
  verdict text,
  checked_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists fcc_watches_due_idx on fcc_watches (flight_date) where status = 'confirmed';
create index if not exists fcc_watches_token_idx on fcc_watches (token);
create index if not exists fcc_watches_email_idx on fcc_watches (lower(email));
alter table fcc_watches enable row level security;
drop policy if exists "fcc anon insert watches" on fcc_watches;
create policy "fcc anon insert watches" on fcc_watches for insert to anon with check (true);

alter table fcc_purchases
  add column if not exists followup_stage int not null default 0,
  add column if not exists followup_at timestamptz,
  add column if not exists outcome text,
  add column if not exists outcome_at timestamptz;

-- Watch RPCs
create or replace function fcc_get_watches(p_token text)
returns setof fcc_watches language sql security definer stable set search_path = public as $$
  select w.* from fcc_watches w
  where lower(w.email) = (select lower(email) from fcc_watches where token = p_token limit 1)
    and w.status <> 'unsubscribed'
  order by w.flight_date desc
$$;
revoke all on function fcc_get_watches(text) from public; grant execute on function fcc_get_watches(text) to anon;

create or replace function fcc_confirm_watch(p_token text)
returns setof fcc_watches language sql security definer volatile set search_path = public as $$
  update fcc_watches set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
  where lower(email) = (select lower(email) from fcc_watches where token = p_token limit 1)
    and status = 'pending'
  returning *
$$;
revoke all on function fcc_confirm_watch(text) from public; grant execute on function fcc_confirm_watch(text) to anon;

create or replace function fcc_unsubscribe_watch(p_token text, p_id uuid default null)
returns int language plpgsql security definer volatile set search_path = public as $$
declare n int;
begin
  if p_id is null then
    update fcc_watches set status = 'unsubscribed'
    where lower(email) = (select lower(email) from fcc_watches where token = p_token limit 1) and status in ('pending','confirmed');
  else
    update fcc_watches set status = 'unsubscribed'
    where id = p_id and lower(email) = (select lower(email) from fcc_watches where token = p_token limit 1);
  end if;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function fcc_unsubscribe_watch(text, uuid) from public; grant execute on function fcc_unsubscribe_watch(text, uuid) to anon;

-- Cron-only RPCs (key-gated)
create or replace function fcc_due_watches(p_key text, p_limit int default 40)
returns setof fcc_watches language sql security definer stable set search_path = public as $$
  select * from fcc_watches
  where p_key = (select value from fcc_secrets where key = 'cron')
    and status = 'confirmed' and flight_date < (now() at time zone 'utc')::date
  order by flight_date asc limit p_limit
$$;
revoke all on function fcc_due_watches(text, int) from public; grant execute on function fcc_due_watches(text, int) to anon;

create or replace function fcc_mark_watch(p_key text, p_id uuid, p_status text, p_check_token text, p_verdict text, p_notified boolean)
returns void language sql security definer volatile set search_path = public as $$
  update fcc_watches set status = p_status, check_token = coalesce(p_check_token, check_token), verdict = coalesce(p_verdict, verdict),
    checked_at = now(), notified_at = case when p_notified then now() else notified_at end
  where id = p_id and p_key = (select value from fcc_secrets where key = 'cron')
$$;
revoke all on function fcc_mark_watch(text, uuid, text, text, text, boolean) from public; grant execute on function fcc_mark_watch(text, uuid, text, text, text, boolean) to anon;

create or replace function fcc_due_followups(p_key text, p_stage int, p_min_days int, p_limit int default 40)
returns setof fcc_purchases language sql security definer stable set search_path = public as $$
  select * from fcc_purchases
  where p_key = (select value from fcc_secrets where key = 'cron')
    and status = 'ready' and followup_stage = p_stage - 1 and outcome is null
    and paid_at < now() - make_interval(days => p_min_days)
  order by paid_at asc limit p_limit
$$;
revoke all on function fcc_due_followups(text, int, int, int) from public; grant execute on function fcc_due_followups(text, int, int, int) to anon;

create or replace function fcc_mark_followup(p_key text, p_id uuid, p_stage int)
returns void language sql security definer volatile set search_path = public as $$
  update fcc_purchases set followup_stage = p_stage, followup_at = now()
  where id = p_id and p_key = (select value from fcc_secrets where key = 'cron')
$$;
revoke all on function fcc_mark_followup(text, uuid, int) from public; grant execute on function fcc_mark_followup(text, uuid, int) to anon;

create or replace function fcc_set_outcome(p_token text, p_outcome text)
returns void language sql security definer volatile set search_path = public as $$
  update fcc_purchases set outcome = p_outcome, outcome_at = now() where token = p_token
$$;
revoke all on function fcc_set_outcome(text, text) from public; grant execute on function fcc_set_outcome(text, text) to anon;

-- Disruption page helpers (public data, anon-readable already; these just shape it)
create or replace function fcc_airport_worst_days(p_icao text, p_limit int default 30)
returns setof fcc_apt_delay_daily language sql stable set search_path = public as $$
  select * from fcc_apt_delay_daily where icao = p_icao order by delay_min desc limit p_limit
$$;
grant execute on function fcc_airport_worst_days(text, int) to anon;

create or replace function fcc_day_across_airports(p_day date, p_limit int default 12)
returns setof fcc_apt_delay_daily language sql stable set search_path = public as $$
  select * from fcc_apt_delay_daily where day = p_day order by delay_min desc limit p_limit
$$;
grant execute on function fcc_day_across_airports(date, int) to anon;
