create or replace function public.get_seller_rank(p_auction_id uuid, p_seller_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
    v_rank integer;
    v_auction_start timestamp with time zone;
    v_lowest_price numeric;
    v_first_bid_time timestamp with time zone;
    v_max_rank_displayed integer;
begin
    -- Get auction start time and max_rank_displayed
    select start_at, max_rank_displayed
    into v_auction_start, v_max_rank_displayed
    from auctions
    where id = p_auction_id;

    RAISE LOG 'Auction ID: %, Seller ID: %, Auction Start: %, Max Rank Displayed: %', p_auction_id, p_seller_id, v_auction_start, v_max_rank_displayed;

    -- Check if auction exists
    if v_auction_start is null then
        RAISE LOG 'Auction not found';
        return -1;
    end if;

    -- Check if auction hasn't started
    if v_auction_start > now() then
        RAISE LOG 'Auction has not started yet';
        return -2;
    end if;

    -- Calculate rank using a window function
    with bid_prices as (
        select
            b.seller_id,
            b.id as bid_id,
            b.created_at,
            case
                when exists (select 1 from bid_supplies where bid_id = b.id) then
                    coalesce(
                        (select sum(
                            coalesce(
                                (bs.price + coalesce(ss.additive, 0)) * coalesce(ss.multiplicative, 1) * coalesce(s.quantity, 1),
                                bs.price * coalesce(s.quantity, 1)
                            )
                        )
                        from bid_supplies bs
                        left join supplies s
                            on bs.supply_id = s.id
                        left join supplies_sellers ss
                            on s.id = ss.supply_id
                            and ss.seller_email = (select email from profiles where id = b.seller_id)
                        where bs.bid_id = b.id),
                        0
                    )
                else b.price
            end as base_price,
            coalesce(
                (select sum(ah.amount)
                from bids_handicaps bh
                join auctions_handicaps ah
                    on bh.handicap_id = ah.id
                where bh.bid_id = b.id),
                0
            ) as handicap_amount
        from bids b
        where b.auction_id = p_auction_id
    ),
    seller_totals as (
        select
            seller_id,
            min(base_price + handicap_amount) as lowest_price
        from bid_prices
        group by seller_id
    ),
    seller_bid_time as (
        select distinct on (bp.seller_id)
            bp.seller_id,
            bp.created_at as first_bid_time
        from bid_prices bp
        join seller_totals st
            on bp.seller_id = st.seller_id
        where bp.base_price + bp.handicap_amount = st.lowest_price
        order by bp.seller_id, bp.created_at asc
    ),
    ranked_sellers as (
        select
            st.seller_id,
            st.lowest_price,
            sbt.first_bid_time,
            row_number() over (
                order by st.lowest_price asc, sbt.first_bid_time asc
            ) as rank
        from seller_totals st
        join seller_bid_time sbt
            on st.seller_id = sbt.seller_id
    )
    select rank, lowest_price, first_bid_time
    into v_rank, v_lowest_price, v_first_bid_time
    from ranked_sellers
    where seller_id = p_seller_id;

    RAISE LOG 'Final rank: %, Lowest price: %, First bid time: %', v_rank, v_lowest_price, v_first_bid_time;

    -- Return 0 when rank exceeds max_rank_displayed (hidden)
    -- This allows the frontend to show "nothing" like when auction hasn't started
    if v_rank is null then
        return -1;
    elsif v_max_rank_displayed is not null and v_max_rank_displayed > 0 and v_rank > v_max_rank_displayed then
        return 0;  -- Hidden rank
    else
        return v_rank;
    end if;
end;
$$;

-- Add indexes to improve performance
create index if not exists idx_bids_auction_seller on bids(auction_id, seller_id);
create index if not exists idx_bid_supplies_bid on bid_supplies(bid_id);
create index if not exists idx_supplies_sellers_supply on supplies_sellers(supply_id);
create index if not exists idx_bids_handicaps_bid on bids_handicaps(bid_id);
