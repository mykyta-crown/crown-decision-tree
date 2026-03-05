# SQL Reference

This document describes the SQL files in the `/sql/` directory - functions, triggers, policies, views, and migrations.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Functions](#functions)
3. [Triggers](#triggers)
4. [Policies](#policies)
5. [Views & Indexes](#views--indexes)
6. [Migrations](#migrations)
7. [Auction Creation Templates](#auction-creation-templates)

---

## Directory Structure

```
sql/
├── functions/           # PostgreSQL functions (business logic)
├── triggers/            # Database triggers (realtime, rank updates)
├── policies/            # RLS policies and helper functions
├── views/               # Materialized views
├── indexes/             # Performance indexes
├── migrations/          # Schema migrations
└── create_auctions/     # Auction creation templates
```

---

## Functions

Located in `/sql/functions/`.

### Core Business Logic

#### `insert_bid`

**Purpose**: Insert a bid with supplies and handicaps in a single transaction.

**Signature**:

```sql
insert_bid(
    p_auction_id uuid,
    p_seller_id uuid,
    p_supplies jsonb,      -- [{supply_id, price, quantity}]
    p_bid_type text,       -- 'prebid' or 'bid'
    p_handicaps jsonb      -- [{id}]
) RETURNS jsonb
```

**Logic**:

1. Calculate total amount from supplies (price × quantity)
2. Insert main bid record
3. Insert `bid_supplies` for each supply
4. Insert `bids_handicaps` for each handicap
5. Reset seller's `auctions_handicaps.selected` to false
6. Set selected handicaps to true
7. Return success/error JSON

**Returns**:

```json
{
  "success": true,
  "bid": {...},
  "inserted_handicaps": [...],
  "total_amount": 1234.56
}
```

---

#### `get_seller_rank`

**Purpose**: Calculate a seller's global rank in an auction based on total bid price.

**Signature**:

```sql
get_seller_rank(p_auction_id uuid, p_seller_id uuid) RETURNS integer
```

**Return values**:
| Value | Meaning |
|-------|---------|
| `-1` | Auction not found OR seller has no bids |
| `-2` | Auction hasn't started yet |
| `0` | Rank is hidden (exceeds `max_rank_displayed`) |
| `1-N` | Actual rank |

**Logic**:

1. Get auction's `start_at` and `max_rank_displayed`
2. Return -1 if auction not found
3. Return -2 if auction hasn't started
4. Calculate total price per seller:
   - Sum of `(bid_supply.price + additive) × multiplicative × quantity`
   - Plus sum of handicap amounts
5. Rank by lowest price, then earliest bid time
6. Return `0` if rank > `max_rank_displayed` (hidden rank)

**Price Calculation**:

```
total_price = Σ((supply_price + additive) × multiplicative × quantity) + Σ(handicap_amount)
```

---

#### `get_supply_rank`

**Purpose**: Calculate a seller's rank for a specific supply/line item.

**Signature**:

```sql
get_supply_rank(p_auction_id uuid, p_seller_id uuid, p_supply_id uuid) RETURNS integer
```

**Return values**:
| Value | Meaning |
|-------|---------|
| `-1` | Auction not found OR seller has no bids for this supply |
| `1-N` | Actual rank for this supply |

**Logic**: Same as `get_seller_rank` but filters by `supply_id`.

**Important**: When `rank_per_line_item = true`, this function returns the **actual rank** without applying `max_rank_displayed` limitation. The limitation only applies to the global rank.

**Used for**: `rank_per_line_item` mode where each supply has independent ranking.

---

#### Max Rank Display Behavior

The `max_rank_displayed` setting controls rank visibility for sellers:

| Setting                      | Global Rank (`get_seller_rank`)  | Per-Line-Item Rank (`get_supply_rank`) |
| ---------------------------- | -------------------------------- | -------------------------------------- |
| `rank_per_line_item = false` | Hidden if rank > max (returns 0) | Hidden if rank > max (returns 0)       |
| `rank_per_line_item = true`  | Hidden if rank > max (returns 0) | **Always shows actual rank**           |

**Frontend handling** (in `RankCard.vue`):

- `rank = 0` → Shows `Without_rank.svg` image
- `rank >= 1` → Shows `Rank_X.svg` podium image
- `rank > 10` → Shows `auction-loser.svg`
- `rank = -1` → Shows `auction-loser.svg`

---

#### `get_bid_rank`

**Purpose**: Get rank of a specific bid.

**Signature**:

```sql
get_bid_rank(p_bid_id uuid) RETURNS integer
```

**Uses**: `bid_total_prices` materialized view for performance.

---

### Analytics Functions

#### `get_auctions_savings`

**Purpose**: Calculate savings for auctions (baseline - winning_price).

#### `get_total_savings`

**Purpose**: Get total savings across all auctions for a buyer.

#### `get_total_baseline`

**Purpose**: Get total baseline value across auctions.

#### `get_files_count`

**Purpose**: Count files/documents for an entity.

#### `get_user_suppliers`

**Purpose**: Get list of suppliers associated with a user.

---

## Triggers

Located in `/sql/triggers/`.

### Realtime Broadcast Triggers

#### `bids_changes`

**Purpose**: Broadcast bid changes to Supabase Realtime.

**Topic**: `broadcast_bids_auction_id=eq.{auction_id}`

```sql
CREATE TRIGGER bids_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION bids_changes();
```

**Used by**: `useRealtime` composable for live bid updates.

---

#### `auctions_changes`

**Purpose**: Broadcast auction changes to Supabase Realtime.

**Topic**: `broadcast_auctions_id=eq.{auction_id}`

```sql
CREATE TRIGGER auctions_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION auctions_changes();
```

---

### Rank Update Triggers

#### `update_bid_rank_on_supplies`

**Purpose**: Update bid ranks when `bid_supplies` changes.

#### `update_bid_rank_on_handicap`

**Purpose**: Update bid ranks when `bids_handicaps` changes.

#### `refresh_bid_total_prices_trigger`

**Purpose**: Refresh `bid_total_prices` materialized view on bid changes.

**Triggered by**: INSERT/UPDATE/DELETE on `bids`, `bid_supplies`, `bids_handicaps`

---

### Other Triggers

#### `update_last_bid_auction_time`

**Purpose**: Update auction's `last_bid_at` timestamp when a bid is placed.

#### `auctions_handicaps_trigger`

**Purpose**: Handle handicap selection changes.

---

## Policies

Located in `/sql/policies/`.

### Helper Functions

#### `is_admin()`

**Location**: `private` schema

```sql
CREATE FUNCTION private.is_admin() RETURNS boolean
-- Returns true if current user has admin=true in profiles
```

#### `is_buyer()`

```sql
CREATE FUNCTION private.is_buyer() RETURNS boolean
-- Returns true if current user has role='buyer' or role='admin'
```

#### `is_supplier()`

```sql
CREATE FUNCTION private.is_supplier() RETURNS boolean
-- Returns true if current user has role='supplier'
```

---

### Policy Files

| File                            | Table(s)              | Purpose                                   |
| ------------------------------- | --------------------- | ----------------------------------------- |
| `auctions_policies.sql`         | auctions              | CRUD policies for auctions                |
| `auction_all.sql`               | auctions              | All-access policy for admins              |
| `auctions.select.sql`           | auctions              | SELECT policies by role                   |
| `bids_buyers_select.sql`        | bids                  | Buyers can see all bids in their auctions |
| `read_bid_data.sql`             | bids, bid_supplies    | Read access for bid data                  |
| `bids_handicaps_policy.sql`     | bids_handicaps        | Handicap bid junction policies            |
| `auctions_handicaps_policy.sql` | auctions_handicaps    | Auction handicap policies                 |
| `buyers_auctions_handicaps.sql` | auctions_handicaps    | Buyer-specific handicap access            |
| `profiles.select.sql`           | profiles              | Profile read access                       |
| `profiles_check.sql`            | profiles              | Profile validation                        |
| `trainings.select.sql`          | trainings             | Training auction access                   |
| `users_auctions_status.all.sql` | users_auctions_status | User auction status access                |
| `realtime_auctions_access.sql`  | -                     | Realtime subscription access              |
| `conversations_soft_delete.sql` | conversations         | Soft delete for conversations             |
| `gpts_policies.sql`             | gpts                  | GPT assistant access                      |

---

## Views & Indexes

### Materialized Views

#### `bid_total_prices`

**Location**: `/sql/functions/get_bid_rank.sql`

**Purpose**: Pre-calculate total prices for all bids for fast ranking.

```sql
CREATE MATERIALIZED VIEW bid_total_prices AS
SELECT
    b.id as bid_id,
    b.auction_id,
    b.created_at,
    -- Total price calculation with supplies, handicaps, multiplicative/additive
    total_price
FROM bids b;
```

**Indexes**:

- `idx_bid_total_prices_bid_id`
- `idx_bid_total_prices_auction_id`
- `idx_bid_total_prices_price_time`

**Refreshed by**: Triggers on `bids`, `bid_supplies`, `bids_handicaps`

---

### Regular Views

#### `user_suppliers`

**Location**: `/sql/views/user_suppliers.sql`

**Purpose**: Get suppliers associated with a user.

---

### Indexes

**Location**: `/sql/indexes/bids_policy_indexes.sql`

| Index                         | Table            | Columns                 | Purpose              |
| ----------------------------- | ---------------- | ----------------------- | -------------------- |
| `idx_bids_auction_seller`     | bids             | (auction_id, seller_id) | Fast bid lookup      |
| `idx_bid_supplies_bid`        | bid_supplies     | (bid_id)                | FK lookup            |
| `idx_bid_supplies_supply`     | bid_supplies     | (supply_id)             | Supply filtering     |
| `idx_bid_supplies_bid_supply` | bid_supplies     | (bid_id, supply_id)     | Composite lookup     |
| `idx_supplies_sellers_supply` | supplies_sellers | (supply_id)             | Handicap calculation |
| `idx_bids_handicaps_bid`      | bids_handicaps   | (bid_id)                | Handicap lookup      |

---

## Migrations

Located in `/sql/migrations/`.

| Migration                                   | Date       | Purpose                        |
| ------------------------------------------- | ---------- | ------------------------------ |
| `20240321000000_add_bid_rank.sql`           | 2024-03-21 | Add bid ranking system         |
| `20241124000000_add_rank_per_line_item.sql` | 2024-11-24 | Add per-supply ranking feature |

---

## Auction Creation Templates

Located in `/sql/create_auctions/`.

### Version History

| File       | Features                   |
| ---------- | -------------------------- |
| `v5_0.sql` | Base auction creation      |
| `v5_1.sql` | Enhanced supplies handling |
| `v5_2.sql` | Multi-lot support          |

These are SQL templates used by scripts to create test auctions with predefined configurations.

---

## Key Concepts

### Price Calculation

Total bid price includes:

1. **Base price**: Sum of (supply_price × quantity)
2. **Additive handicap**: Per-supply addition from `supplies_sellers.additive`
3. **Multiplicative handicap**: Per-supply multiplier from `supplies_sellers.multiplicative`
4. **Fixed handicaps**: Sum of `auctions_handicaps.amount` for selected handicaps

```
final_price = Σ((base_price + additive) × multiplicative × quantity) + Σ(handicap_amounts)
```

### Rank Calculation

1. Calculate total price per seller (lowest bid wins)
2. If prices equal, earlier bid time wins
3. Cap displayed rank at `auctions.max_rank_displayed`
4. Return codes:
   - `-1`: Auction not found or no bids
   - `-2`: Auction hasn't started
   - `1-N`: Actual rank
   - `max_rank_displayed`: Capped rank

### Realtime Broadcasting

Triggers use Supabase's `realtime.broadcast_changes()` to push updates:

- **Bids**: Topic `broadcast_bids_auction_id=eq.{id}`
- **Auctions**: Topic `broadcast_auctions_id=eq.{id}`

Frontend subscribes via `useRealtime` composable.

---

## Security Model

- All functions use `SECURITY DEFINER` to run with creator's permissions
- RLS policies use helper functions (`is_admin()`, `is_buyer()`, `is_supplier()`)
- Sensitive functions require `authenticated` role
- Admin functions check `profiles.admin` or `profiles.role`
