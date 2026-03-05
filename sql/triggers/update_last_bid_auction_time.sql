create or replace function update_last_bid_auction_time()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
DECLARE
idAuction uuid;
overtime float4;
endAtAuction timestamp;
startAtAuction timestamp;
minutesFromEnd float4;
addOvertime boolean := false;
minutes_interval interval;
typeAuction text;
v_rank integer;
BEGIN

SELECT id, overtime_range, end_at, start_at, type into idAuction, overtime, endAtAuction, startAtAuction, typeAuction
FROM auctions
WHERE id = NEW.auction_id;

-- Update the rank for the new bid
v_rank := get_seller_rank(NEW.auction_id, NEW.seller_id);
UPDATE bids SET rank = v_rank WHERE id = NEW.id;

RAISE LOG 'idAuction: %', idAuction;
RAISE LOG 'overtime: %', overtime;
minutes_interval := overtime * interval '1 minute';
RAISE LOG 'minutes_interval: %', minutes_interval;
minutesFromEnd := EXTRACT(EPOCH FROM (endAtAuction - NOW() - minutes_interval)) / 60;
RAISE LOG 'minutesFromEnd: %', minutesFromEnd;
IF minutesFromEnd <= 0 then
  addOvertime := true;
END IF;

-- Always update last_bid_time
UPDATE auctions
SET last_bid_time = NEW.created_at
WHERE id = NEW.auction_id;

IF typeAuction = 'reverse' then
  UPDATE auctions
  SET end_at = CASE WHEN addOvertime THEN
    NOW() + (overtime * INTERVAL '1 minute')
    ELSE endAtAuction
    END
  WHERE id = NEW.auction_id;
end if;

IF typeAuction = 'dutch' then
    if NEW.type = 'bid' then
    UPDATE auctions
    SET end_at = NEW.created_at
    WHERE id = NEW.auction_id;
    end if;
end if;

RETURN NEW;

END;
$$;

-- Add performance-optimizing indexes
create index if not exists idx_auctions_id_type on auctions(id, type);
create index if not exists idx_bids_auction_seller_created on bids(auction_id, seller_id, created_at);
create index if not exists idx_bids_id_rank on bids(id, rank);
