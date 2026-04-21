-- P1-P4 priorities, labels, snooze, and soft delete for personal_tasks
alter table personal_tasks
  add column if not exists priority      text,
  add column if not exists label         text,
  add column if not exists snoozed_until date,
  add column if not exists deleted_at    timestamptz;

alter table personal_tasks
  add constraint if not exists personal_tasks_priority_check
    check (priority in ('p1','p2','p3','p4')),
  add constraint if not exists personal_tasks_label_check
    check (label in ('planning','marking','admin','personal','send'));

-- Drop old importance constraint and widen to support legacy values
-- (importance kept for backward compat; priority is the new field)
create index if not exists personal_tasks_user_priority_idx
  on personal_tasks(user_id, priority)
  where deleted_at is null and completed = false;

create index if not exists personal_tasks_deleted_idx
  on personal_tasks(user_id, deleted_at)
  where deleted_at is not null;
