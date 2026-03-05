-- Function to insert a bid with supplies and handicaps
-- This function replicates the insertBid functionality from useBids.js
CREATE OR REPLACE FUNCTION insert_bid(
    p_auction_id uuid,
    p_seller_id uuid,
    p_supplies jsonb, -- Array of objects with supply_id, price, quantity
    p_bid_type text, -- Bid type (prebid or bid)
    p_handicaps jsonb DEFAULT '[]' -- Array of handicap objects with id
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bid_id uuid;
    v_total_amount numeric;
    v_supply record;
    v_handicap record;
    v_inserted_bid jsonb;
    v_inserted_handicaps jsonb;
    v_result jsonb;
    v_error text;
BEGIN
    -- Start transaction
    BEGIN
        -- Calculate total amount from supplies
        v_total_amount := 0;
        FOR v_supply IN SELECT * FROM jsonb_array_elements(p_supplies)
        LOOP
            v_total_amount := v_total_amount +
                ((v_supply.value->>'price')::numeric *
                 COALESCE((v_supply.value->>'quantity')::numeric, 1));
        END LOOP;

        -- Insert the main bid
        INSERT INTO bids (
            price,
            seller_id,
            auction_id,
            type,
            created_at
        )
        VALUES (
            v_total_amount,
            p_seller_id,
            p_auction_id,
            p_bid_type,
            NOW()
        )
        RETURNING to_jsonb(bids.*) INTO v_inserted_bid;

        v_bid_id := v_inserted_bid->>'id';

        -- Insert bid supplies
        FOR v_supply IN SELECT * FROM jsonb_array_elements(p_supplies)
        LOOP
            INSERT INTO bid_supplies (
                supply_id,
                price,
                bid_id,
                created_at
            )
            VALUES (
                (v_supply.value->>'supply_id')::uuid,
                (v_supply.value->>'price')::numeric,
                v_bid_id,
                NOW()
            );
        END LOOP;

        -- Insert bid handicaps
        v_inserted_handicaps := '[]'::jsonb;
        FOR v_handicap IN SELECT * FROM jsonb_array_elements(p_handicaps)
        LOOP
            INSERT INTO bids_handicaps (
                bid_id,
                handicap_id,
                created_at
            )
            VALUES (
                v_bid_id,
                (v_handicap.value->>'id')::uuid,
                NOW()
            );

            -- Collect inserted handicap info
            v_inserted_handicaps := v_inserted_handicaps ||
                jsonb_build_object(
                    'bid_id', v_bid_id,
                    'handicap_id', (v_handicap.value->>'id')::uuid
                );
        END LOOP;

        -- Set all handicaps to selected false for this auction and seller
        UPDATE auctions_handicaps
        SET selected = false
        WHERE auction_id = p_auction_id
        AND seller_email = (SELECT email FROM profiles WHERE id = p_seller_id);

        -- Set the inserted handicaps to selected true
        FOR v_handicap IN SELECT * FROM jsonb_array_elements(p_handicaps)
        LOOP
            UPDATE auctions_handicaps
            SET selected = true
            WHERE id = (v_handicap.value->>'id')::uuid;
        END LOOP;

        -- Return success result
        v_result := jsonb_build_object(
            'success', true,
            'bid', v_inserted_bid,
            'inserted_handicaps', v_inserted_handicaps,
            'total_amount', v_total_amount
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction on error
            v_error := SQLERRM;

            v_result := jsonb_build_object(
                'success', false,
                'error', v_error,
                'error_code', SQLSTATE
            );

            RETURN v_result;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_bid TO authenticated;

-- Create a comment for the function
COMMENT ON FUNCTION insert_bid IS 'Inserts a bid with supplies and handicaps, updating auction handicap selections. Returns success status and inserted data or error information.';
