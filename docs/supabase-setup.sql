create table if not exists tasks (
  id text primary key,
  title text not null,
  status text not null,
  priority text not null,
  owner text not null,
  owner_email text,
  supplier text,
  competence text,
  due_date date,
  category text,
  type text,
  unit text,
  brand text,
  notes text,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks add column if not exists owner_email text;
alter table tasks add column if not exists created_by_email text;

create table if not exists activity_logs (
  id bigint generated always as identity primary key,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid,
  email text primary key,
  full_name text not null,
  role text not null default 'analyst',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists knowledge_documents (
  id bigint generated always as identity primary key,
  title text not null,
  category text not null,
  content text not null,
  created_by_email text not null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_files (
  id bigint generated always as identity primary key,
  title text not null,
  file_name text not null,
  file_path text not null,
  file_url text not null,
  mime_type text,
  created_by_email text not null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists routine_templates (
  id bigint generated always as identity primary key,
  name text not null,
  recurrence_rule text not null,
  sla text,
  created_by_email text not null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on tasks;
drop trigger if exists profiles_set_updated_at on profiles;
drop trigger if exists knowledge_documents_set_updated_at on knowledge_documents;
drop trigger if exists document_files_set_updated_at on document_files;
drop trigger if exists routine_templates_set_updated_at on routine_templates;

create trigger tasks_set_updated_at
before update on tasks
for each row
execute function set_updated_at();

create trigger profiles_set_updated_at
before update on profiles
for each row
execute function set_updated_at();

create trigger knowledge_documents_set_updated_at
before update on knowledge_documents
for each row
execute function set_updated_at();

create trigger document_files_set_updated_at
before update on document_files
for each row
execute function set_updated_at();

create trigger routine_templates_set_updated_at
before update on routine_templates
for each row
execute function set_updated_at();
