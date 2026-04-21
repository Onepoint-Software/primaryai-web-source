-- Day templates: save a typical day layout and apply to date ranges
create table if not exists day_templates (
  id          uuid  primary key default gen_random_uuid(),
  user_id     uuid  not null references auth.users(id) on delete cascade,
  name        text  not null,
  day_of_week text  not null,  -- mon | tue | wed | thu | fri
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint day_templates_dow_check
    check (day_of_week in ('mon','tue','wed','thu','fri'))
);

create table if not exists day_template_blocks (
  id           uuid  primary key default gen_random_uuid(),
  template_id  uuid  not null references day_templates(id) on delete cascade,
  title        text  not null,
  subject      text  not null default '',
  year_group   text  not null default '',
  start_time   time  not null,
  end_time     time  not null,
  event_type   text  not null default 'lesson_pack',
  event_category text,
  effort       text,
  notes        text,

  constraint template_block_effort_check
    check (effort in ('low','medium','high'))
);

create index if not exists day_templates_user_idx
  on day_templates(user_id);

create index if not exists day_template_blocks_template_idx
  on day_template_blocks(template_id);
