-- Create a function to check if only the selected field has changed
CREATE OR REPLACE FUNCTION check_auctions_handicaps_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply restrictions if the user is the seller
  IF auth.jwt()->>'email' = OLD.seller_email THEN
    -- Check if any field other than 'selected' has changed
    IF (OLD.id IS DISTINCT FROM NEW.id) OR
       (OLD.auction_id IS DISTINCT FROM NEW.auction_id) OR
       (OLD.group_name IS DISTINCT FROM NEW.group_name) OR
       (OLD.option_name IS DISTINCT FROM NEW.option_name) OR
       (OLD.amount IS DISTINCT FROM NEW.amount) OR
       (OLD.seller_email IS DISTINCT FROM NEW.seller_email) THEN
      RAISE EXCEPTION 'Only the selected field can be updated in auctions_handicaps';
    END IF;

    -- Ensure selected is not null
    IF NEW.selected IS NULL THEN
      RAISE EXCEPTION 'The selected field cannot be set to NULL';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auctions_handicaps_update_trigger ON auctions_handicaps;
CREATE TRIGGER auctions_handicaps_update_trigger
BEFORE UPDATE ON auctions_handicaps
FOR EACH ROW
EXECUTE FUNCTION check_auctions_handicaps_update();
