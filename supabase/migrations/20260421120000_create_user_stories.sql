-- User stories table for the PrimaryAI Story Builder
create table if not exists public.user_stories (
  id            uuid primary key default gen_random_uuid(),
  story_ref     text not null unique,
  who           text not null,
  what          text not null,
  why           text not null,
  priority      text check (priority in ('must','should','could','wont')),
  priority_label text,
  effort        text,
  acceptance_criteria text[] not null default '{}',
  notes         text,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create sequence if not exists user_stories_ref_seq start 1;

create or replace function public.set_story_ref()
returns trigger language plpgsql as $$
begin
  if new.story_ref is null or new.story_ref = '' then
    new.story_ref := 'PAI-' || lpad(nextval('user_stories_ref_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_story_ref on public.user_stories;
create trigger trg_set_story_ref
  before insert on public.user_stories
  for each row execute function public.set_story_ref();

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_stories_updated_at on public.user_stories;
create trigger trg_user_stories_updated_at
  before update on public.user_stories
  for each row execute function public.update_updated_at();

create index if not exists idx_user_stories_priority on public.user_stories(priority);
create index if not exists idx_user_stories_created_at on public.user_stories(created_at desc);

alter table public.user_stories enable row level security;

create policy "Anyone can insert user stories"
  on public.user_stories for insert
  with check (true);

create policy "Authenticated users can read user stories"
  on public.user_stories for select
  to authenticated
  using (true);

create policy "Authenticated users can update user stories"
  on public.user_stories for update
  to authenticated
  using (true);

create policy "Authenticated users can delete user stories"
  on public.user_stories for delete
  to authenticated
  using (true);
