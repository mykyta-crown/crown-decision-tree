-- Fix: Japanese auctions store total price in bid_supplies.price (not per-unit)
-- The formula bs.price * s.quantity double-multiplies for Japanese auctions
-- Solution: use bids.price directly for Japanese auctions

-- Fix get_auctions_savings_data
create or replace function public.get_auctions_savings_data(
    p_date timestamp with time zone default null,
    p_company_id uuid default null
)
returns table (
    auction_id uuid,
    baseline_price int8,
    lowest_price float8
)
language plpgsql
security definer
as $$
declare
    v_user_role text;
    v_user_id uuid;
begin
    -- Get current user's role and id
    select role, id into v_user_role, v_user_id
    from profiles
    where id = auth.uid();

    return query
    with filtered_auctions as (
        select a.id, a.baseline, a.type from auctions a
        where (p_date is null or date_trunc('month', a.start_at) = date_trunc('month', p_date))
          and (p_company_id is null or a.company_id = p_company_id)
          and a.baseline is not null
          and a.usage = 'real'
          and a.published = TRUE
          and a.deleted = FALSE
          and (
              v_user_role = 'admin'
              or v_user_role = 'super_buyer'
              or (v_user_role = 'buyer' and a.buyer_id = v_user_id)
          )
        order by a.start_at desc
    ),
    bid_prices as (
        select
            b.auction_id,
            b.seller_id,
            b.id as bid_id,
            case
                -- Japanese auctions: bid_supplies.price is already total, use bids.price directly
                when fa.type = 'japanese' then b.price
                when exists (select 1 from bid_supplies where bid_id = b.id) then
                    coalesce(
                        (select sum(
                            coalesce(
                                (bs.price + coalesce(ss.additive, 0)) * coalesce(ss.multiplicative, 1) * coalesce(s.quantity, 1),
                                bs.price * coalesce(s.quantity, 1)
                            )
                        )
                        from bid_supplies bs
                        left join supplies s on bs.supply_id = s.id
                        left join supplies_sellers ss on s.id = ss.supply_id
                            and ss.seller_email = (select email from profiles where id = b.seller_id)
                        where bs.bid_id = b.id),
                        0
                    )
                else b.price
            end as base_price,
            coalesce(
                (select sum(ah.amount)
                 from bids_handicaps bh
                 join auctions_handicaps ah on bh.handicap_id = ah.id
                 where bh.bid_id = b.id),
                0
            ) as handicap_amount
        from bids b
        join filtered_auctions fa on fa.id = b.auction_id
    ),
    auction_lowest as (
        select
            fa.id as auction_id,
            fa.baseline as baseline_price,
            min(bp.base_price + bp.handicap_amount) as lowest_price
        from filtered_auctions fa
        left join bid_prices bp on fa.id = bp.auction_id
        group by fa.id, fa.baseline
    )
    select al.auction_id, al.baseline_price, al.lowest_price
    from auction_lowest al;
end;
$$;

-- Fix get_total_savings (same issue)
create or replace function public.get_total_savings(
    p_date timestamp with time zone default null,
    p_company_id uuid default null
)
returns numeric
language plpgsql
security definer
as $$
declare
    v_total_savings numeric := 0;
    v_user_role text;
    v_user_id uuid;
begin
    -- Get current user's role and id
    select role, id into v_user_role, v_user_id
    from profiles
    where id = auth.uid();

    with filtered_auctions as (
        select a.id, a.baseline, a.type from auctions a
        where (p_date is null or date_trunc('month', a.start_at) = date_trunc('month', p_date))
          and (p_company_id is null or a.company_id = p_company_id)
          and a.baseline is not null
          and a.usage = 'real'
          and a.published = TRUE
          and a.deleted = FALSE
          and (
              v_user_role = 'admin'
              or v_user_role = 'super_buyer'
              or (v_user_role = 'buyer' and a.buyer_id = v_user_id)
          )
        order by a.start_at desc
    ),
    bid_prices as (
        select
            b.auction_id,
            b.seller_id,
            b.id as bid_id,
            case
                -- Japanese auctions: bid_supplies.price is already total, use bids.price directly
                when fa.type = 'japanese' then b.price
                when exists (select 1 from bid_supplies where bid_id = b.id) then
                    coalesce(
                        (select sum(
                            coalesce(
                                (bs.price + coalesce(ss.additive, 0)) * coalesce(ss.multiplicative, 1) * coalesce(s.quantity, 1),
                                bs.price * coalesce(s.quantity, 1)
                            )
                        )
                        from bid_supplies bs
                        left join supplies s on bs.supply_id = s.id
                        left join supplies_sellers ss on s.id = ss.supply_id
                            and ss.seller_email = (select email from profiles where id = b.seller_id)
                        where bs.bid_id = b.id),
                        0
                    )
                else b.price
            end as base_price,
            coalesce(
                (select sum(ah.amount)
                 from bids_handicaps bh
                 join auctions_handicaps ah on bh.handicap_id = ah.id
                 where bh.bid_id = b.id),
                0
            ) as handicap_amount
        from bids b
        join filtered_auctions fa on fa.id = b.auction_id
    ),
    auction_lowest as (
        select
            fa.id as auction_id,
            fa.baseline as baseline_price,
            min(bp.base_price + bp.handicap_amount) as lowest_price
        from filtered_auctions fa
        left join bid_prices bp on fa.id = bp.auction_id
        group by fa.id, fa.baseline
    )
    select coalesce(sum(
        case when baseline_price is not null and lowest_price is not null and baseline_price > lowest_price
            then baseline_price - lowest_price
            else 0 end
    ), 0) into v_total_savings
    from auction_lowest;

    return coalesce(v_total_savings, 0);
end;
$$;
