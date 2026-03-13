alter table lesson_schedule
  add column if not exists linked_document_id uuid references library_documents(id) on delete set null,
  add column if not exists linked_document_name text;

create index if not exists lesson_schedule_linked_document_id_idx
  on lesson_schedule(user_id, linked_document_id)
  where linked_document_id is not null;
