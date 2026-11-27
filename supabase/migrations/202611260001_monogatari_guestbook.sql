begin;

create schema if not exists monogatari_guestbook;
revoke all on schema monogatari_guestbook from public, anon, authenticated;

create table if not exists monogatari_guestbook.messages (
  id uuid primary key,
  nickname text not null check (char_length(nickname) between 1 and 24),
  message text not null check (char_length(message) between 1 and 360),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

alter table monogatari_guestbook.messages enable row level security;
revoke all on table monogatari_guestbook.messages from public, anon, authenticated;
create index if not exists messages_created_at_idx
  on monogatari_guestbook.messages (created_at desc);
create index if not exists messages_published_at_idx
  on monogatari_guestbook.messages (published_at desc)
  where published_at is not null;

create or replace function public.monogatari_guestbook_read()
returns table (nickname text, message text, published_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select m.nickname, m.message, m.published_at
  from monogatari_guestbook.messages as m
  where m.published_at is not null
  order by m.published_at desc, m.id desc
  limit 30;
$$;

create or replace function public.monogatari_guestbook_submit(
  p_id uuid, p_nickname text, p_message text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  clean_nickname text := pg_catalog.regexp_replace(p_nickname, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  clean_message text := pg_catalog.regexp_replace(p_message, '^[[:space:]]+|[[:space:]]+$', '', 'g');
begin
  if p_id is null or clean_nickname is null or clean_message is null
     or pg_catalog.char_length(clean_nickname) not between 1 and 24
     or pg_catalog.char_length(clean_message) not between 1 and 360 then
    raise exception using errcode = '22023', message = 'Invalid guestbook submission';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('monogatari_guestbook_submit', 0));
  if exists (select 1 from monogatari_guestbook.messages as m where m.id = p_id) then
    return;
  end if;
  if (select count(*) from monogatari_guestbook.messages as m
      where m.created_at >= pg_catalog.now() - interval '10 minutes') >= 40 then
    raise exception using errcode = 'PT429', message = 'Guestbook busy';
  end if;
  if (select count(*) from monogatari_guestbook.messages as m
      where m.created_at >= pg_catalog.now() - interval '1 day') >= 300 then
    raise exception using errcode = 'PT429', message = 'Guestbook busy';
  end if;

  insert into monogatari_guestbook.messages (id, nickname, message)
    values (p_id, clean_nickname, clean_message);
end;
$$;

revoke all on function public.monogatari_guestbook_read() from public, anon, authenticated;
revoke all on function public.monogatari_guestbook_submit(uuid, text, text) from public, anon, authenticated;
grant execute on function public.monogatari_guestbook_read() to anon, authenticated;
grant execute on function public.monogatari_guestbook_submit(uuid, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
