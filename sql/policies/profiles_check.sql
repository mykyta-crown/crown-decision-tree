create or replace function private.profiles_check_v2(profile_id uuid, profile_email text)
returns boolean
language plpgsql
security definer -- will run as the creator
as $$
begin
  return (
    private.is_admin() OR
    (select auth.uid()) = profile_id
    OR EXISTS (
      SELECT 1
      FROM auctions a
      JOIN auctions_sellers s ON a.id = s.auction_id
      WHERE (
        (private.is_buyer_v2(a.id) AND s.seller_email = profile_email)
        OR
        (s.seller_email = auth.jwt()->>'email' AND a.buyer_id = profile_id)
      )
    )
  );
end;
$$;

-- Add indexes if they don't exist
create index if not exists idx_auctions_buyer_id on auctions(buyer_id);
create index if not exists idx_auctions_sellers_auction_id on auctions_sellers(auction_id);
create index if not exists idx_auctions_sellers_seller_email on auctions_sellers(seller_email);