(
  (auth.uid() = id)
  OR
  (
    email IN
    (
      SELECT auctions_sellers.seller_email
      FROM auctions
      JOIN auctions_sellers ON auctions.id = auctions_sellers.auction_id
      WHERE auctions.buyer_id = auth.uid()
    )
  )
)
