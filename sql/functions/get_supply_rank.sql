-- Function to calculate supplier rank for a specific supply/line item
-- Similar to get_seller_rank but calculates rank per supply instead of overall

CREATE OR REPLACE FUNCTION public.get_supply_rank(
    p_auction_id UUID,
    p_seller_id UUID,
    p_supply_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rank INTEGER;
    v_auction_start TIMESTAMP WITH TIME ZONE;
    v_lowest_price NUMERIC;
    v_first_bid_time TIMESTAMP WITH TIME ZONE;
    v_max_rank_displayed INTEGER;
BEGIN
    -- Get auction start time and max_rank_displayed
    SELECT start_at, max_rank_displayed
    INTO v_auction_start, v_max_rank_displayed
    FROM auctions
    WHERE id = p_auction_id;

    RAISE LOG 'Supply Rank - Auction ID: %, Seller ID: %, Supply ID: %, Max Rank: %', 
        p_auction_id, p_seller_id, p_supply_id, v_max_rank_displayed;

    -- Check if auction exists
    IF v_auction_start IS NULL THEN
        RAISE LOG 'Auction not found';
        RETURN -1;
    END IF;

    -- Check if auction hasn't started
    -- IF v_auction_start > NOW() THEN
    --    RAISE LOG 'Auction has not started yet';
    --    RETURN -2;
    -- END IF;

    -- Calculate rank for this specific supply using a window function
    WITH bid_supply_prices AS (
        SELECT
            b.seller_id,
            b.id AS bid_id,
            b.created_at,
            bs.supply_id,
            -- Calculate price for this supply with handicaps and quantity
            COALESCE(
                (bs.price + COALESCE(ss.additive, 0)) * COALESCE(ss.multiplicative, 1) * COALESCE(s.quantity, 1),
                bs.price * COALESCE(s.quantity, 1)
            ) AS supply_total_price
        FROM bids b
        JOIN bid_supplies bs ON bs.bid_id = b.id
        LEFT JOIN supplies s ON bs.supply_id = s.id
        LEFT JOIN supplies_sellers ss 
            ON s.id = ss.supply_id 
            AND ss.seller_email = (SELECT email FROM profiles WHERE id = b.seller_id)
        WHERE b.auction_id = p_auction_id
            AND bs.supply_id = p_supply_id
    ),
    seller_best_supply_price AS (
        SELECT
            seller_id,
            MIN(supply_total_price) AS lowest_price
        FROM bid_supply_prices
        GROUP BY seller_id
    ),
    seller_best_bid_time AS (
        SELECT DISTINCT ON (bsp.seller_id)
            bsp.seller_id,
            bsp.created_at AS first_bid_time
        FROM bid_supply_prices bsp
        JOIN seller_best_supply_price sbsp
            ON bsp.seller_id = sbsp.seller_id
        WHERE bsp.supply_total_price = sbsp.lowest_price
        ORDER BY bsp.seller_id, bsp.created_at ASC
    ),
    ranked_sellers AS (
        SELECT
            sbsp.seller_id,
            sbsp.lowest_price,
            sbbt.first_bid_time,
            ROW_NUMBER() OVER (
                ORDER BY sbsp.lowest_price ASC, sbbt.first_bid_time ASC
            ) AS rank
        FROM seller_best_supply_price sbsp
        JOIN seller_best_bid_time sbbt
            ON sbsp.seller_id = sbbt.seller_id
    )
    SELECT rank, lowest_price, first_bid_time
    INTO v_rank, v_lowest_price, v_first_bid_time
    FROM ranked_sellers
    WHERE seller_id = p_seller_id;

    RAISE LOG 'Supply Rank - Final rank: %, Lowest price: %, First bid time: %', 
        v_rank, v_lowest_price, v_first_bid_time;

    -- Apply max_rank_displayed limit (same logic as global rank)
    IF v_rank IS NULL THEN
        RETURN -1;
    ELSIF v_rank >= v_max_rank_displayed THEN
        RETURN v_max_rank_displayed;
    ELSE
        RETURN v_rank;
    END IF;
END;
$$;

-- Add indexes to improve performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_bid_supplies_supply ON bid_supplies(supply_id);
CREATE INDEX IF NOT EXISTS idx_bid_supplies_bid_supply ON bid_supplies(bid_id, supply_id);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_supply_rank(UUID, UUID, UUID) TO authenticated;


