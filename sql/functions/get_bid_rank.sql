-- First create a materialized view to store bid prices
create materialized view if not exists bid_total_prices as
select
    b.id as bid_id,
    b.auction_id,
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
    end + coalesce(
        (select sum(ah.amount)
        from bids_handicaps bh
        join auctions_handicaps ah
            on bh.handicap_id = ah.id
        where bh.bid_id = b.id),
        0
    ) as total_price
from bids b;

-- Create indexes on the materialized view
create index if not exists idx_bid_total_prices_bid_id on bid_total_prices(bid_id);
create index if not exists idx_bid_total_prices_auction_id on bid_total_prices(auction_id);
create index if not exists idx_bid_total_prices_price_time on bid_total_prices(auction_id, total_price, created_at);

-- Create a function to refresh the materialized view for a specific auction
create or replace function refresh_bid_total_prices_for_auction(p_auction_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    -- Delete existing records for this auction
    delete from bid_total_prices where auction_id = p_auction_id;

    -- Insert new records for this auction
    insert into bid_total_prices
    select
        b.id as bid_id,
        b.auction_id,
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
        end + coalesce(
            (select sum(ah.amount)
            from bids_handicaps bh
            join auctions_handicaps ah
                on bh.handicap_id = ah.id
            where bh.bid_id = b.id),
            0
        ) as total_price
    from bids b
    where b.auction_id = p_auction_id;
end;
$$;

-- Create triggers to refresh only the affected auction
create or replace function refresh_bid_total_prices_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
    if TG_OP = 'INSERT' then
        perform refresh_bid_total_prices_for_auction(NEW.auction_id);
    elsif TG_OP = 'UPDATE' then
        if OLD.auction_id != NEW.auction_id then
            perform refresh_bid_total_prices_for_auction(OLD.auction_id);
            perform refresh_bid_total_prices_for_auction(NEW.auction_id);
        else
            perform refresh_bid_total_prices_for_auction(NEW.auction_id);
        end if;
    elsif TG_OP = 'DELETE' then
        perform refresh_bid_total_prices_for_auction(OLD.auction_id);
    end if;
    return null;
end;
$$;

create trigger refresh_bid_total_prices_trigger
    after insert or update or delete on bids
    for each row
    execute function refresh_bid_total_prices_trigger();

-- Create triggers for supplies and handicaps
create or replace function refresh_bid_total_prices_supplies_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
    perform refresh_bid_total_prices_for_auction(
        (select auction_id from bids where id =
            case
                when TG_OP = 'INSERT' then NEW.bid_id
                when TG_OP = 'UPDATE' then NEW.bid_id
                when TG_OP = 'DELETE' then OLD.bid_id
            end
        )
    );
    return null;
end;
$$;

create trigger refresh_bid_total_prices_supplies_trigger
    after insert or update or delete on bid_supplies
    for each row
    execute function refresh_bid_total_prices_supplies_trigger();

create or replace function refresh_bid_total_prices_handicaps_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
    perform refresh_bid_total_prices_for_auction(
        (select auction_id from bids where id =
            case
                when TG_OP = 'INSERT' then NEW.bid_id
                when TG_OP = 'UPDATE' then NEW.bid_id
                when TG_OP = 'DELETE' then OLD.bid_id
            end
        )
    );
    return null;
end;
$$;

create trigger refresh_bid_total_prices_handicaps_trigger
    after insert or update or delete on bids_handicaps
    for each row
    execute function refresh_bid_total_prices_handicaps_trigger();

-- Simplified rank calculation function
create or replace function public.get_bid_rank(p_bid_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
    v_rank integer;
begin
    select count(*) + 1
    into v_rank
    from bid_total_prices btp
    where btp.auction_id = (select auction_id from bids where id = p_bid_id)
    and (
        btp.total_price < (select total_price from bid_total_prices where bid_id = p_bid_id)
        or (
            btp.total_price = (select total_price from bid_total_prices where bid_id = p_bid_id)
            and btp.created_at < (select created_at from bid_total_prices where bid_id = p_bid_id)
        )
    );

    return v_rank;
end;
$$;
