(
  (auth.uid() = buyer_id)
  OR
  (
    (
      auth.email() IN
      (
        SELECT auctions_sellers.seller_email
        FROM auctions_sellers
        WHERE (auctions_sellers.auction_id = auctions.id)
      )
    ) AND published = true
  )
)
