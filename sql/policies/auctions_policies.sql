create or replace function private.suppliers_auctions_select(user_email text, p_auction_id uuid)
returns boolean
language plpgsql
security definer -- will run as the creator
as $$
begin
    return exists (
        select 1
        from public.auctions_sellers
        where public.auctions_sellers.auction_id = p_auction_id
        and public.auctions_sellers.seller_email = user_email
    );
end;
$$;