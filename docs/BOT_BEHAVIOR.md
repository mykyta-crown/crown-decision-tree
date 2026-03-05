# Bot Behavior Documentation

This document describes the automated bot behavior for different auction types in training and test auctions.

## Overview

Bots are automated participants that simulate real user behavior in training and test auctions. They use predefined email addresses:

- `bot-1@crown-procurement.com`
- `bot-2@crown-procurement.com`
- `bot-3@crown-procurement.com`
- `bot-4@crown-procurement.com`
- `bot-5@crown-procurement.com`

## Setup: Creating Test/Training Auctions with Bots

### Step 1: Create Bot Profiles (First Time Only)

Bot profiles must exist in the database before they can participate in auctions. You need to:

1. **Sign up 5 bot accounts** in the application:
   - Go to the signup page
   - Create accounts with the bot emails listed above
   - Use dummy passwords (e.g., `BotPassword123!`)
   - Complete the profile creation

2. **Verify bot profiles exist**:
   ```bash
   # Check if bot profiles are created
   /opt/homebrew/opt/libpq/bin/psql "$PG_URL" -c "SELECT email, id FROM profiles WHERE email LIKE 'bot-%@crown-procurement.com' ORDER BY email;"
   ```

### Step 2: Invite Bots to Your Auction

When creating a training or test auction:

1. **Set auction usage** to `training` or `test` (not `real`)
2. **In the suppliers step**, invite the bot emails:
   - `bot-1@crown-procurement.com`
   - `bot-2@crown-procurement.com`
   - `bot-3@crown-procurement.com`
   - (Optional: bot-4 and bot-5 for more competition)
3. **Save and publish** the auction

### Step 3: Bot Behavior - Automatic Activation

**Bots now react automatically!** No need to click the Training button.

**How it works:**

1. **User places a bid** in a training/test auction
2. **Webhook triggers** automatically (`/api/v1/webhooks/bids/insert`)
3. **System checks** if user is Rank 1
4. **Bots react** according to the competition round rules

**Manual trigger (optional):**

You can still manually trigger bots via:

- **UI**: Click the "Training" button during the auction
- **API**: `curl -X POST "http://localhost:3000/api/v1/auctions/{auctionId}/training"`

**Requirements for automatic activation:**

- Auction must have `usage: 'training'` or `usage: 'test'`
- Webhook must be configured in Supabase Dashboard (see migration 20251210090000)
- `WEBHOOK_BEARER_TOKEN` must be set in environment variables

## Auction Types and Bot Behavior

### 1. Dutch Auctions (including Preferred Dutch)

**Behavior**: ALL invited bots place prebids at round 10, but only Bot 1 places a live bid at round 5

**Logic**:

**Step 1: Initial Prebids (First training button click)**

- Only activates if the auction has more than 10 rounds
- Calculates the maximum number of rounds: `Math.ceil(auction.duration / auction.overtime_range)`
- **ALL invited bots** place a **prebid** at round 10 (0-based index 9)
- Price: `maxPrice - (maxNbRounds - 9 - 1) * auction.min_bid_decr`

**Step 2: Live Bid at Round 5 (Subsequent training button clicks)**

- When auction reaches round 5 (0-based index 4)
- **Only Bot 1** places a live bid
- **Waits 5 seconds** before placing the bid
- Places a **live bid** (type: 'bid') at the current round 5 price
- Only places the live bid once (checks if bot already has a live bid)

**Important Notes**:

- The user must click "Training" button at least twice:
  1. First click: ALL bots place prebids at round 10
  2. Second click (during round 5): Only Bot 1 places live bid after 5 seconds
- No further bot actions after the live bid is placed
- Other bots (2-5) only have prebids, simulating sellers who set a price but don't actively bid

**Purpose**: Simulates realistic competition where multiple suppliers set prebids, but only one actively places a live bid during the auction.

### 2. Japanese Auctions

**Behavior**: Each bot places ONE prebid at their exit price (threshold), simulating real suppliers setting their minimum acceptable price

**Important**: Japanese auctions have **DESCENDING prices** (like reverse/English auctions), not ascending.

**Logic**:

- **Waits for user to place first bid** before bots react
- **Waits 3 seconds** after user bid before placing bot prebids (realistic timing)
- Each bot (up to 5) places a **single prebid** at their exit price
- **Bot 1** exits **2 rounds BELOW** user's best price (more competitive)
- **Bot 2** exits **4 rounds BELOW** user's best price (more competitive)
- **Bot 3** exits **6 rounds BELOW** user's best price (more competitive)
- **Bot 4** exits **8 rounds BELOW** user's best price (more competitive)
- **Bot 5** exits **10 rounds BELOW** user's best price (most competitive)
- Exit price calculation: `userBestPrice - (exitRounds * auction.min_bid_decr)`
- Only places prebids once (checks if `bestBotsPrice` exists)
- Bots only place prebid if their exit price is above 0

**Example**:

- Starting price (max_bid_decr): 1000
- Min bid decrement: 20
- User bids at price 860
- **Bot 1**: Places ONE prebid at 820 (2 rounds = 40 below user)
- **Bot 2**: Places ONE prebid at 780 (4 rounds = 80 below user)
- **Bot 3**: Places ONE prebid at 740 (6 rounds = 120 below user)
- **Bot 4**: Places ONE prebid at 700 (8 rounds = 160 below user)
- **Bot 5**: Places ONE prebid at 660 (10 rounds = 200 below user = most competitive)

**Natural Behavior**:

Each bot places a single prebid at their exit threshold. This simulates real suppliers who:

1. Set their minimum acceptable price upfront (can't go lower)
2. Stay in the auction as the price descends from 1000 → 980 → 960 → ...
3. Are eliminated when the price goes below their threshold
4. User can win by making live-bids at each round to go lower than the bots
5. Bot 1 exits at 820
6. Bot 2 exits at 780
7. Bot 3 exits at 740
8. Bot 4 exits at 700
9. Bot 5 at 660 is the most competitive - user must bid below 660 to beat all bots

**Purpose**: Creates realistic competition where bots have different minimum price thresholds, and the user must bid LOW enough to beat all bots by making live-bids at each round. User can win if they continue bidding to lower prices.

### 3. Reverse Auctions (English)

**Behavior**: Bots compete in structured rounds, reacting when user achieves Rank 1 or ties with bots

#### Overview

Bots follow a 3-round competition structure:

1. **Round 1**: All bots (1-5) react when user first becomes Rank 1 or ties
2. **Round 2**: Bots 1-3 react when user becomes Rank 1 or ties again
3. **Round 3 (Overtime)**: Bots 1-2 react when user becomes Rank 1 or ties in overtime

#### Step 1: Prebids at Ceiling

**Trigger**: First training button click (can happen before auction starts)

**Logic**:

- Each bot places a **prebid** at their ceiling price
- This simulates suppliers entering their maximum price
- Only happens once per bot

**Ceiling Price Fallback**:

If `supplies_sellers.ceiling` is NULL or 0 (misconfigured auction):

1. Use `auction.max_bid_decr` if available
2. Default to 1000 as last resort

This ensures bots never bid at 0€ in misconfigured auctions.

#### Step 2: Wait for Auction Start

**Logic**:

- Bots will NOT place live bids until the auction has started
- If triggered before `auction.start_at`, bots return "waiting" status
- This ensures realistic behavior where live bidding only happens during the auction

#### Step 3: Round 1 - First Competition

**Trigger**: User becomes Rank 1 or ties (user's price <= all bot prices) AND auction has started

**Conditions**:

- `minBotBidCount === 0` (bots have not yet placed live bids)
- **NEW**: Only bots with 0 live bids are activated (prevents double bidding)

**Logic**:

- All 5 bots react with 0.1%-0.3% lower price than current lowest bid
- Each bot waits a specific delay before bidding (minimum 5 sec for natural behavior):
  - Bot 1: 6 seconds
  - Bot 2: 5 seconds
  - Bot 3: 7 seconds
  - Bot 4: 5 seconds
  - Bot 5: 6 seconds
- **Filter**: Only bots with `botBidCounts[botIndex] === 0` are activated
- This ensures each bot places **exactly 1 bid** in Round 1

**Price Calculation**:

- Each bot fetches the **current lowest bid** (user or bot) before bidding
- All bots use: `lowest_price * (1 - random(0.1% to 0.3%))` for realism
- Example: If lowest bid is 50000, bot bids between 49850 and 49950
- Since bots bid sequentially with delays, each bot undercuts the previous lowest

**Bug Fix (2026-01-05)**:

Previously, bots could be reactivated during Round 1 if webhooks triggered multiple times, causing each bot to place 2 bids consecutively. The filter `botBidCounts[bot.botIndex] === 0` prevents this.

#### Step 4: Round 2+ - Sustained Competition

**Trigger**: User becomes Rank 1 or ties again (after Round 1)

**Conditions**:

- `minBotBidCount >= 1 && minBotBidCount < 3` (bots have 1-2 bids each)
- NOT in overtime yet
- **NEW**: Repeatable - triggers EVERY time user becomes Rank 1

**Logic**:

- Only bots 1-3 react with 0.1%-0.3% lower price
- Delays:
  - Bot 1: 5 seconds
  - Bot 2: 5 seconds
  - Bot 3: 3 seconds
- **Filter**: Only bots with `botBidCounts[botIndex] < 3` are activated
- Round 2 now **repeats** until bots reach 3 bids OR overtime begins

**Important Change**:

Previously, Round 2 only triggered when `minBotBidCount === 1` (exactly 1 bid). This caused a gap where bots wouldn't react if they all had 2+ bids. Now Round 2 continues as long as `minBotBidCount < 3`, maintaining competition throughout the auction.

#### Step 5: Round 3 - Overtime Competition

**Trigger**: User becomes Rank 1 or ties in overtime period

**Conditions**:

- Auction is in overtime (within 70% of overtime range from end)
- `minBotBidCount >= 1`
- `maxBotBidCount < 3` (at least one bot has fewer than 3 bids)

**Logic**:

- Only bots 1-2 react with 0.1%-0.3% lower price
- Delays:
  - Bot 1: 5 seconds
  - Bot 2: 3 seconds
- **Filter**: Only bots with `botBidCounts[botIndex] < 3` are activated
- Limited to max 3 bids per bot in overtime

#### Important Notes

- **"Rank 1 or Tied" Detection**: User triggers bots when their best bid is lower than OR equal to all bot bids
- **No Action if Lower**: Bots wait for user to become Rank 1 or tie before reacting
- **Dynamic Price Reduction**: Each bot bids 0.1%-0.3% lower (random) than the current lowest bid (user or bot)
- **Round Tracking**: System tracks bot bid counts to determine which round to activate
- **Overtime Detection**: Overtime starts when time remaining < 70% of `overtime_range`

## Key Features

1. **Realistic Competition**: Bots provide consistent competition without being too aggressive
2. **Strategic Timing**: Different timing strategies for different auction types
3. **Price Intelligence**: Bots adjust their bids based on user behavior and auction state
4. **Overtime Management**: Special behavior during auction overtime periods
5. **Multiple Bot Coordination**: Up to 5 bots can participate with different strategies

## Technical Notes

- Bots only activate for auctions with `usage === 'training'` or `usage === 'test'`
- All bot actions are logged and return success/failure messages
- Bot profiles are fetched from the database using their email addresses
- The system handles cases where bots may not have seller IDs properly
