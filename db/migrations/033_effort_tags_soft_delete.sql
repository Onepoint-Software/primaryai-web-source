-- Effort tags on lesson_schedule (Low / Medium / High marking load)
alter table lesson_schedule
  add column if not exists effort       text,
  add column if not exists deleted_at   timestamptz;

alter table lesson_schedule
  add constraint if not exists lesson_schedule_effort_check
    check (effort in ('low','medium','high'));

create index if not exists lesson_schedule_deleted_at_idx
  on lesson_schedule(user_id, deleted_at)
  where deleted_at is not null;
