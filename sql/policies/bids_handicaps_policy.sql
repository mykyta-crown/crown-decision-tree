-- Enable RLS
ALTER TABLE bids_handicaps ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting bids_handicaps
CREATE POLICY "Users can only insert handicaps for their own bids"
ON bids_handicaps
FOR INSERT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bids
    WHERE bids.id = bids_handicaps.bid_id
    AND bids.seller_id = auth.uid()
  )
);

-- Create policy for viewing bids_handicaps for auction buyers
CREATE POLICY "Auction buyers can view handicaps for their auctions"
ON bids_handicaps
FOR SELECT
TO authenticated
USING (
  private.is_admin()
  OR
  EXISTS (
    SELECT 1 FROM bids
    JOIN auctions ON bids.auction_id = auctions.id
    WHERE bids.id = bids_handicaps.bid_id
    AND auctions.buyer_id = auth.uid()
  )
);

-- Create policy for viewing bids_handicaps for sellers
CREATE POLICY "Users can view handicaps for their own bids"
ON bids_handicaps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bids
    WHERE bids.id = bids_handicaps.bid_id
    AND bids.seller_id = auth.uid()
  )
);
