  ((EXISTS ( SELECT 1
   FROM bids
    WHERE ((bids.id = bid_id) AND (bids.seller_id = ( SELECT auth.uid() AS uid)))
  ))
  OR (private.is_buyer_v2((SELECT bids.auction_id
    FROM bids
    WHERE (bids.id = bid_id)))
    OR private.is_admin()
  ))
