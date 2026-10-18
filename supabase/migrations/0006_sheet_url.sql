-- The person pastes a Google Sheet link. The desk stores that URL.
-- Members cannot update workspaces directly, so this function is the only write.

alter table public.workspaces
  add column if not exists sheet_url text;

alter table public.workspaces
  drop constraint if exists workspaces_sheet_url_check;

alter table public.workspaces
  add constraint workspaces_sheet_url_check
  check (
    sheet_url is null
    or (
      char_length(sheet_url) <= 500
      and sheet_url ~ '^https://docs\.google\.com/spreadsheets/d/[a-zA-Z0-9_-]+'
    )
  );

create or replace function public.set_workspace_sheet(next_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  cleaned text := nullif(btrim(coalesce(next_url, '')), '');
begin
  if actor is null then
    raise exception 'Sign in before saving a sheet.';
  end if;
  if cleaned is not null and (
    char_length(cleaned) > 500
    or cleaned !~ '^https://docs\.google\.com/spreadsheets/d/[a-zA-Z0-9_-]+'
  ) then
    raise exception 'Paste a Google Sheet link.';
  end if;

  update public.workspaces
  set sheet_url = cleaned
  where id = (
    select workspace_id from public.profiles where id = actor
  );
end;
$$;

revoke all on function public.set_workspace_sheet(text) from public;
grant execute on function public.set_workspace_sheet(text) to authenticated;
