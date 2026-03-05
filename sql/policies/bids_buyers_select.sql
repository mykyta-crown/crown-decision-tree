EXISTS (
  SELECT 1
  FROM auctions
  WHERE auctions.id = bids.auction_id
  AND auctions.buyer_id = auth.uid()
)