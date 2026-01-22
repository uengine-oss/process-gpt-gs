-- table configuration
drop table configuration;
create table configuration (
  key text primary key,
  value jsonb
);
insert into configuration (key, value) values ('proc_map', '{}');
insert into configuration (key, value) values ('organization', '{}');

-- table proc_map_history
drop table public.proc_map_history;
create table public.proc_map_history (
    value jsonb not null,
    created_at timestamp with time zone not null default now(),
    constraint proc_map_history_pkey primary key (created_at)
) tablespace pg_default;

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.save_previous_proc_map()
RETURNS TRIGGER AS $$
BEGIN
    -- 'proc_map' 키의 이전 value 값을 proc_map_history 테이블에 저장
    IF OLD.key = 'proc_map' THEN
        INSERT INTO public.proc_map_history(value, created_at)
        VALUES (OLD.value, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_save_previous_proc_map
BEFORE UPDATE ON configuration
FOR EACH ROW
WHEN (OLD.key = 'proc_map' AND NEW.value IS DISTINCT FROM OLD.value)
EXECUTE PROCEDURE public.save_previous_proc_map();

-- table todolist
drop table todolist;
create table todolist (
    id uuid primary key,
    user_id text,
    proc_inst_id text,
    proc_def_id text,
    activity_id text,
    activity_name text,
    start_date timestamp,
    end_date timestamp,
    status text,
    description text,
    tool text
);

-- table users
drop table public.users;
create table public.users (
    id uuid not null primary key,
    username text null,
    profile text null default '/src/assets/images/profile/defaultUser.png'::text,
    email text null,
    is_admin boolean not null default false,
    notifications jsonb null,
    role text null
);
-- trigger the function every time a auts.users is created
create or replace function public.handle_new_user() 
returns trigger as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email);
      return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- trigger the function every time a public.users is deleted
create or replace function public.handle_delete_user() 
returns trigger as $$
begin
    delete from auth.users where id = old.id;
    return old;
end;
$$ language plpgsql security definer;

create trigger on_public_user_deleted
    after delete on public.users
    for each row execute procedure public.handle_delete_user();


-- table proc_def
drop table proc_def;
create table proc_def (
  id text primary key,
  name text,
  definition jsonb,
  bpmn text
);

ALTER TABLE proc_def ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for authenticated users only" ON "public"."proc_def"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ((EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));

CREATE POLICY "Enable read access for all users" ON "public"."proc_def"
AS PERMISSIVE FOR SELECT
TO public
USING (true);


-- table proc_inst
drop table proc_inst;
create table
  public.proc_inst (
    id text not null,
    name text null,
    user_ids text[] null,
    messages jsonb null,
    agent_messages jsonb null,
    status text null,
    constraint proc_inst_pkey primary key (id)
  ) tablespace pg_default;


create table public.chats (
    uuid text not null,
    id text not null,
    messages jsonb null,
    constraint chats_pkey primary key (uuid)
) tablespace pg_default;

create table public.calendar (
  uid text not null,
  data jsonb null,
  constraint calendar_pkey primary key (uid)
) tablespace pg_default;

create table public.chat_rooms (
  id text not null,
  participants jsonb not null,
  message jsonb null,
  name text null,
  constraint chat_rooms_pkey primary key (id)
) tablespace pg_default;

create table
  public.proc_def_arcv (
    arcv_id text not null,
    proc_def_id text not null,
    version text not null,
    snapshot text null,
    "timeStamp" timestamp without time zone null default current_timestamp,
    diff text null,
    constraint proc_def_arcv_pkey primary key (arcv_id)
  ) tablespace pg_default;

create table
  public.lock (
    id text not null,
    user_id text null,
    constraint lock_pkey primary key (id)
  ) tablespace pg_default;


-- 폼 UI 정보 저장을 위해서 사용되는 테이블
drop table if exists form_def;
create table form_def (
  id text primary key,
  html text not null
) tablespace pg_default;