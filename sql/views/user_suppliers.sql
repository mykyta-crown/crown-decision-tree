create or replace view public.user_suppliers_view as
select distinct
    a.buyer as user_id,
    as2.seller_email as supplier_email
from auctions a
join auctions_sellers as2 on a.id = as2.auction_id
where a.deleted = false;
