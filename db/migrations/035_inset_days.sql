-- INSET days and bank holidays within term dates
create table if not exists user_profile_inset_days (
  id          uuid  primary key default gen_random_uuid(),
  user_id     uuid  not null references auth.users(id) on delete cascade,
  event_date  date  not null,
  label       text  not null default 'INSET Day',
  day_type    text  not null default 'inset',   -- inset | bank_holiday | closure
  created_at  timestamptz not null default now(),

  constraint inset_day_type_check
    check (day_type in ('inset','bank_holiday','closure')),
  unique (user_id, event_date)
);

create index if not exists inset_days_user_date_idx
  on user_profile_inset_days(user_id, event_date);
