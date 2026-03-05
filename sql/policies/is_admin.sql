create or replace function private.is_admin()
returns boolean
language plpgsql
security definer -- will run as the creator
as $$
begin
  return (
    select profiles.admin
    from profiles
    where profiles.id = (select auth.uid())
  );
end;
$$;
