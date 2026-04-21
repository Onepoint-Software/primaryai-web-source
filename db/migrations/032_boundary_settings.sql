-- Boundary settings: working hours, lunch protection, nights off, suggestion tone
alter table user_profile_settings
  add column if not exists work_day_start      time    not null default '08:00',
  add column if not exists work_day_end        time    not null default '17:00',
  add column if not exists protect_lunch       boolean not null default false,
  add column if not exists lunch_start         time    not null default '12:00',
  add column if not exists lunch_end           time    not null default '13:00',
  add column if not exists nights_off          text[]  not null default '{}',
  add column if not exists suggestion_tone     text    not null default 'neutral',
  add column if not exists dyslexia_font       boolean not null default false,
  add column if not exists reduce_motion       boolean not null default false,
  add column if not exists countdown_mode      text    not null default 'days';

alter table user_profile_settings
  add constraint if not exists suggestion_tone_check
    check (suggestion_tone in ('direct','neutral','warm')),
  add constraint if not exists countdown_mode_check
    check (countdown_mode in ('days','sleeps','getups'));
