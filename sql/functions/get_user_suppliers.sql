create or replace function public.get_user_suppliers(
    p_user_id uuid
)
returns table (
    supplier_email text
)
language plpgsql
security definer
as $$
begin
    return query
    select distinct as2.seller_email
    from auctions a
    join auctions_sellers as2 on a.id = as2.auction_id
    where a.buyer = p_user_id
    and a.deleted = false;
end;
$$;
