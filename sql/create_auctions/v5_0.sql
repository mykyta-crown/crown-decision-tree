-- 5_0 added dynamic handicaps
CREATE OR REPLACE FUNCTION create_auction_v5_0 (auction jsonb) RETURNS UUID AS $$

DECLARE
    item jsonb;
    lot jsonb;
    supplier jsonb;
    supplier_price jsonb;
    line_item jsonb;
    supplier_exists jsonb;
    new_lot_id uuid;
    first_new_lot_id uuid;
    new_bid_id uuid;
    new_supply_id uuid;
    handicaps jsonb;
BEGIN
  first_new_lot_id = NULL;

  FOR lot IN
    SELECT jsonb_array_elements(auction->'lots')
  LOOP
  INSERT INTO auctions (
      id,
      name,
      start_at,
      end_at,
      description,
      log_visibility,
      currency,
      timezone,
      type,
      test,
      company_id,
      buyer_id,
      overtime_range,
      baseline,
      attachments,
      commercials_terms,
      general_terms,
      max_bid_decr,
      max_bid_decr_type,
      min_bid_decr,
      min_bid_decr_type,
      duration,
      lot_name,
      lot_number,
      auctions_group_settings_id,
      awarding_principles,
      published,
      usage,
      dutch_prebid_enabled
    )
    VALUES (
      COALESCE((lot->>'id')::uuid, uuid_generate_v4()),
      auction->>'name',
      (lot->>'start_at')::timestamptz,
      (lot->>'end_at')::timestamptz,
      auction->>'description',
      auction->>'log_visibility',
      auction->>'currency',
      auction->>'timezone',
      auction->>'type',
      true,
      --auction->>'test'::boolean,
      UUID(auction->>'company_id'),
      UUID(auction->>'buyer_id'),
      (lot->>'overtime_range')::float8,
      (lot->>'baseline')::int8,
      (lot->>'attachments')::jsonb,
      lot->>'commercials_terms',
      lot->>'general_terms',
      (lot->>'max_bid_decr')::float8,
      lot->>'max_bid_decr_type',
      (lot->>'min_bid_decr')::float8,
      lot->>'min_bid_decr_type',
      (lot->>'duration')::int2,
      lot->>'name',
      (lot->>'lot_number')::int2,
      UUID(auction->>'group_id'),
      lot->>'awarding_principles',
      (auction->>'published')::boolean,
      auction->>'usage',
      (lot->>'dutch_prebid_enabled')::boolean
      )
      ON CONFLICT (id) DO UPDATE
      SET
        name = excluded.name,
        start_at = excluded.start_at,
        end_at = excluded.end_at,
        description = excluded.description,
        log_visibility = excluded.log_visibility,
        currency = excluded.currency,
        timezone = excluded.timezone,
        type = excluded.type,
        test = excluded.test,
        company_id = excluded.company_id,
        buyer_id = excluded.buyer_id,
        overtime_range = excluded.overtime_range,
        baseline = excluded.baseline,
        attachments = excluded.attachments,
        commercials_terms = excluded.commercials_terms,
        general_terms = excluded.general_terms,
        max_bid_decr = excluded.max_bid_decr,
        max_bid_decr_type = excluded.max_bid_decr_type,
        min_bid_decr = excluded.min_bid_decr,
        min_bid_decr_type = excluded.min_bid_decr_type,
        duration = excluded.duration,
        lot_name = excluded.lot_name,
        awarding_principles = excluded.awarding_principles,
        published = excluded.published,
        usage = excluded.usage,
        dutch_prebid_enabled = excluded.dutch_prebid_enabled
      returning id into new_lot_id;

      IF first_new_lot_id IS NULL THEN
            first_new_lot_id = new_lot_id;
        END IF;

    RAISE LOG 'TESTADD: %', new_lot_id;

    -- Delete all previous handicaps for the current lot
    DELETE FROM auctions_handicaps WHERE auction_id = new_lot_id;

    -- Insert new handicaps for the current lot
    FOR handicaps IN
      SELECT jsonb_array_elements(lot->'handicaps')
    LOOP
      INSERT INTO auctions_handicaps (
        auction_id,
        group_name,
        option_name,
        seller_email,
        amount
      ) VALUES (
        new_lot_id,
        handicaps->>'name',
        handicaps->>'option',
        handicaps->>'supplier',
        (handicaps->>'amount')::float8
      );
      RAISE LOG 'TESTADD: %', handicaps;
    END LOOP;

    FOR supplier_price IN
        SELECT jsonb_array_elements(lot->'suppliers_prices')
    LOOP
    --TODO: Faire le delete si (auction_id, seller_email) est present dans auctions_sellers mais pas
          INSERT INTO auctions_sellers (
            auction_id,
            seller_email,
            seller_phone,
            terms_accepted
          )
          VALUES (
            new_lot_id,
            supplier_price->'supplier'->>'email',
            supplier_price->'supplier'->>'phone',
            false
          )
          ON CONFLICT (auction_id, seller_email) DO NOTHING;
        RAISE LOG 'ADD auctions_sellers';
        --Pour chaque line_item de chaque suppliers
        FOR line_item IN
          SELECT jsonb_array_elements(supplier_price->'lines_items')
        LOOP

          -- Adding supplies
          IF jsonb_exists(line_item, 'id') then
            UPDATE supplies
            SET
              name = line_item->>'line_item',
              unit = line_item->>'unit',
              quantity = (line_item->>'quantity')::int4,
              index = (line_item->>'index')::int2
            WHERE id = (line_item->>'id')::uuid
            returning id into new_supply_id;
          else
              INSERT INTO supplies (id, name, unit, quantity, index, auction_id)
              VALUES (
                uuid_generate_v4(),
                line_item->>'line_item',
                line_item->>'unit',
                (line_item->>'quantity')::int4,
                (line_item->>'index')::int2,
                new_lot_id
              )
              ON CONFLICT (name, auction_id) DO UPDATE
              SET
              name = excluded.name,
              unit = excluded.unit,
              quantity = excluded.quantity,
              index = excluded.index
              returning id into new_supply_id;
          end if;
          INSERT INTO supplies_sellers (supply_id, seller_email, ceiling, additive, multiplicative, multiplier)
          VALUES (
            new_supply_id,
            supplier_price->'supplier'->>'email',
            (line_item->>'ceiling')::float8,
            (line_item->>'additive')::float8,
            (line_item->>'multiplicative')::float8,
            (line_item->>'multiplier')::float4)
          ON CONFLICT (supply_id, seller_email) DO UPDATE
          SET
            ceiling = excluded.ceiling,
            additive = excluded.additive,
            multiplicative = excluded.multiplicative,
            multiplier = excluded.multiplier;
        END LOOP;
    END LOOP;
  END LOOP;
  RETURN first_new_lot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
