alter table teacher_profiles
  add column if not exists class_notes text,
  add column if not exists teaching_approach text,
  add column if not exists ability_mix text;
