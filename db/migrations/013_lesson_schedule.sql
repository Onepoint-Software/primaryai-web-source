create table if not exists lesson_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_pack_id uuid not null references lesson_packs(id) on delete cascade,
  title text not null,
  subject text not null,
  year_group text not null,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists lesson_schedule_user_week_idx
  on lesson_schedule (user_id, scheduled_date);

alter table lesson_schedule enable row level security;

create policy "Users can manage their own scheduled lessons"
  on lesson_schedule
  for all
  using (auth.uid() = user_id);
