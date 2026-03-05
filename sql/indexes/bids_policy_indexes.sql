-- Indexes to optimize bids table reads based on the policy:
-- ((( SELECT auth.uid() AS uid) = seller_id) OR private.is_buyer_v2(auction_id) OR private.is_admin())

-- Index for seller_id lookups (first condition in OR clause)
-- This allows fast lookups when auth.uid() = seller_id
CREATE INDEX IF NOT EXISTS idx_bids_seller_id ON bids(seller_id);

-- Index for auction_id lookups (used in is_buyer_v2 function)
-- This allows fast lookups when checking if user is buyer of the auction
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);

-- Composite index for seller_id and auction_id
-- This optimizes queries that filter by both conditions
CREATE INDEX IF NOT EXISTS idx_bids_seller_auction ON bids(seller_id, auction_id);

-- Index for profiles.admin lookups (used in is_admin function)
-- This allows fast admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(admin) WHERE admin = true;

-- Additional indexes that may be beneficial for related queries:

-- Index for auction_id and created_at (common ordering pattern)
CREATE INDEX IF NOT EXISTS idx_bids_auction_created ON bids(auction_id, created_at DESC);

-- Index for seller_id and created_at (for seller's bid history)
CREATE INDEX IF NOT EXISTS idx_bids_seller_created ON bids(seller_id, created_at DESC);

-- Index for auction_id, seller_id, and created_at (comprehensive coverage)
CREATE INDEX IF NOT EXISTS idx_bids_auction_seller_created ON bids(auction_id, seller_id, created_at DESC);

-- Note: The following indexes already exist based on the codebase analysis:
-- - idx_bids_rank on bids(bid_rank)
-- - idx_bids_auction_seller on bids(auction_id, seller_id)
-- - idx_bids_auction_seller_created on bids(auction_id, seller_id, created_at)
-- - idx_bids_id_rank on bids(id, rank)
-- - idx_auctions_id on auctions(id)
-- - idx_auctions_buyer_id on auctions(buyer_id)
-- - idx_auctions_company_id on auctions(company_id)
-- - idx_profiles_id on profiles(id)
-- - idx_profiles_company_id on profiles(company_id)
-- - idx_profiles_role_company_id on profiles(role, company_id)

