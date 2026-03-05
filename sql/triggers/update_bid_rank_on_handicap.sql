create or replace function public.update_bid_rank_on_handicap()
returns trigger
language plpgsql
security definer
as $$
declare
    v_rank integer;
begin
    -- Get the bid's rank with the new handicap
    v_rank := get_seller_rank(
        (select auction_id from bids where id = NEW.bid_id),
        (select seller_id from bids where id = NEW.bid_id)
    );

    -- Update the bid's rank
    UPDATE bids SET rank = v_rank WHERE id = NEW.bid_id;

    return NEW;
end;
$$;

-- Create the trigger
create trigger tr_update_bid_rank_on_handicap
    after insert on bids_handicaps
    for each row
    execute function public.update_bid_rank_on_handicap();
