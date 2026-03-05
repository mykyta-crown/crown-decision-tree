create or replace function private.is_supplier(auction_id uuid)
returns boolean
language plpgsql
security definer -- will run as the creator
as $$
begin
  return (
    exists (
      select 1
      from auctions_sellers
      where auctions_sellers.seller_email = (( SELECT auth.jwt() AS jwt) ->> 'email'::text) and auctions_sellers.auction_id = is_supplier.auction_id
    )
  );
end;
$$;
