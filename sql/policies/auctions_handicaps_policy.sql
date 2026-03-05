-- Enable RLS
ALTER TABLE auctions_handicaps ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing auctions_handicaps
CREATE POLICY "Users can view their own handicaps"
ON auctions_handicaps
FOR SELECT
TO authenticated
USING (
  seller_email = auth.jwt()->>'email'
);

-- Create policy for updating auctions_handicaps
-- The with check is completed by a auctions_handicaps_update_trigger.sql to prevent
-- changing supplier from changing anything else than selected status.
CREATE POLICY "Users can only update selected status of their own handicaps"
ON auctions_handicaps
FOR UPDATE
TO authenticated
USING (
  seller_email = auth.jwt()->>'email'
)
WITH CHECK (
  seller_email = auth.jwt()->>'email'
);
