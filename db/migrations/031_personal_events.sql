-- Personal events: life-comes-first items separate from the school schedule
create table if not exists personal_events (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  title          text        not null,
  all_day        boolean     not null default false,
  event_date     date,                          -- used when all_day = true
  start_at       timestamptz,                   -- used when all_day = false
  end_at         timestamptz,
  repeat_rule    text        not null default 'none',   -- none | daily | weekly | custom
  repeat_days    text[]      not null default '{}',     -- ['mon','thu'] for custom
  valid_from     date,
  valid_to       date,
  location       text,
  notes          text,
  boundary_impact boolean    not null default false,    -- protect finish time
  colour         text        not null default 'teal',
  deleted_at     timestamptz,                           -- soft delete
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint personal_events_repeat_rule_check
    check (repeat_rule in ('none','daily','weekly','custom')),
  constraint personal_events_date_or_time_check
    check (all_day = true or (start_at is not null and end_at is not null))
);

create index if not exists personal_events_user_date_idx
  on personal_events(user_id, event_date);

create index if not exists personal_events_user_start_idx
  on personal_events(user_id, start_at);
