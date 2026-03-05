create or replace function private.is_buyer_v2(auction_id uuid)
returns boolean
language plpgsql
security definer -- will run as the creator
as $$
begin
  return (
    exists (
      select 1
      from auctions
      where auctions.id = auction_id
      and (
        auctions.buyer_id = (select auth.uid())
        or exists (
          select 1 from profiles
          where profiles.id = (select auth.uid())
          and profiles.role = 'super_buyer'
          and profiles.company_id = auctions.company_id
        )
      )
    )
  );
end;
$$;

create or replace function private.is_super_buyer_of_same_company(buyer_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  buyer_company_id uuid;
  current_user_company_id uuid;
  current_user_role text;
begin
  -- Get the company_id of the buyer profile
  select company_id into buyer_company_id
  from profiles
  where id = buyer_id;

  -- Get the company_id and role of the current user
  select company_id, role into current_user_company_id, current_user_role
  from profiles
  where id = auth.uid();

  -- Return true if current user is super_buyer and in the same company
  return current_user_role = 'super_buyer' and current_user_company_id = buyer_company_id;
end;
$$;

-- On auctions table
CREATE INDEX IF NOT EXISTS idx_auctions_id ON auctions(id);
CREATE INDEX IF NOT EXISTS idx_auctions_buyer_id ON auctions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_auctions_company_id ON auctions(company_id);

-- On profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_company_id ON profiles(role, company_id);
