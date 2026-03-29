# Analyzer — Supplier Behavior Analysis

## Context

We have a B2B e-auction platform (Crown) where buyers (companies like Bonduelle, Kiabi, etc.) run procurement auctions to purchase goods from suppliers. We want to build a supplier analytics module that helps buyers understand supplier behavior patterns, predict future performance, and optimize auction design.

## Auction Types

### English (Reverse) Auction
- Price **descends** through competitive bidding
- Multiple rounds, suppliers can bid as many times as they want
- Each bid must be lower than the supplier's previous bid
- Suppliers see their **rank** (1st, 2nd, 3rd...) but not others' prices
- Supports overtime extensions when bids are placed near the end
- Duration: typically 10-20 minutes

### Dutch Auction
- Price starts low and **ascends** automatically over time
- First supplier to accept the current price wins — auction stops immediately
- Only one winner possible
- Supports **prebids**: supplier pre-sets an acceptance threshold; the system auto-accepts when the ascending price reaches it
- Duration: typically 10-15 minutes

### Japanese Auction
- Price **descends** each round (e.g., 100 → 99 → 98...)
- Suppliers must confirm each round or exit
- Last supplier standing wins
- Supports prebids (auto-confirm above a floor price)

## Data Available

### Per Auction (Lot)
- `baseline`: reference price set by the buyer before the auction
- `best_price`: the winning price (lowest bid in English, accepted price in Dutch)
- `saving_pct`: (baseline - best_price) / baseline × 100
- `type`: dutch / reverse / japanese / sealed-bid
- `start_at`, `end_at`, `duration`
- `bid_count`, `prebid_count`, `sellers_invited`
- `bids_per_minute`: competition intensity

### Per Bid
- `seller_id`: identifies the supplier
- `price`: bid amount
- `type`: "bid" (live) or "prebid" (pre-set)
- `created_at`: timestamp
- `rank`: supplier's position after this bid (English only)
- `cloud_task`: if not null, this bid was auto-executed from a prebid

### Per Supplier (aggregated)
- `lots_invited`: how many lots they were invited to
- `lots_bid`: how many they actually participated in
- `lots_won`: how many they won (had the best price)
- `win_rate`: lots_won / lots_bid × 100
- `spend_won`: total value of lots they won
- `total_bids`: total number of bids across all English auctions
- `avg_compression`: average % drop from their first to last bid
- `avg_reaction_min`: average time before their first bid after auction starts
- `total_prebids`: number of prebids submitted (Dutch/Japanese)

## Real Data Examples

### English Auction Bid Patterns (per supplier per auction)

```
Supplier                   | Start %BL | Best %BL | Compression | React  | Bids
irene.caballero@toybe.es   | 101.2%    | 79.9%    | 21.1%       | 0.2min | 55
patrick@paperplast.com     | 89.2%     | 79.6%    | 10.8%       | 3.4min | 49
benjaminlolivier@sepal.fr  | 94.8%     | 88.6%    | 6.6%        | 1.0min | 40
info@caxa.it               | 106.1%    | 90.4%    | 14.8%       | 0.6min | 35
f.baudoin@dodyplast.com    | 114.8%    | 79.7%    | 30.6%       | 2.0min | 30
fabio.mazzagallo@          | 94.3%     | 73.8%    | 21.7%       | 0.4min | 30
p.curie@panierprovencal.   | 100.4%    | 96.3%    | 4.1%        | 3.7min | 29
logghe.dejonghe@           | 110.5%    | 90.6%    | 18.0%       | 0.4min | 22
roberta.stefani@carpadspa  | 109.3%    | 75.9%    | 30.6%       | 1.4min | 20
```

**Definitions:**
- **Start %BL**: First bid price as % of baseline (>100% = started above baseline)
- **Best %BL**: Best (lowest) bid as % of baseline
- **Compression**: % drop from first to last bid
- **React**: Time before first bid after auction starts

### Supplier Consistency Across Multiple Auctions

```
Supplier                    | Auctions | Avg Compr | StdDev | Avg Start | Avg Best | Bids/Lot
illan.cherki@ciacam.fr      | 7        | 8.3%      | ±2.2   | 96.4%     | 88.4%    | 14
pe.pauck@igp-etiquette.com  | 7        | 2.2%      | ±0.9   | 99.4%     | 97.2%    | 4
thomas.korber@mcclabel.com  | 6        | 6.0%      | ±3.6   | 106.1%    | 99.6%    | 9
nicole@rudyagro.ca          | 6        | 5.9%      | ±0.7   | 94.0%     | 88.4%    | 10
fmarginet@sudespa.com       | 5        | 9.1%      | ±1.6   | 101.1%    | 92.0%    | 15
p.curie@panierprovencal.com | 5        | 4.0%      | ±0.3   | 100.2%    | 96.2%    | 16
info@caxa.it                | 4        | 11.0%     | ±2.6   | 101.3%    | 90.1%    | 23
```

**Observations:**
- `pe.pauck` is extremely consistent (±0.9) — always enters near baseline, barely moves
- `p.curie` has the tightest stddev (±0.3) — most predictable supplier
- `info@caxa.it` enters high and drops significantly — wide spread but consistent pattern
- `thomas.korber` starts 6% above baseline but ends at 99.6% — barely goes below baseline

### Win Rate vs Behavior

```
Supplier                    | Bid | Won | Win% | Compr | Start → Best
illan.cherki@ciacam.fr      | 15  | 12  | 80%  | 3.9%  | 93.5% → 89.8%
vicky.sun@shanyoung.cn      | 12  | 12  | 100% | 0.0%  | 89.2% → 89.2%
pe.pauck@igp-etiquette.com  | 8   | 0   | 0%   | 2.0%  | 99.2% → 97.2%
benjaminlolivier@sepal.fr   | 7   | 5   | 71%  | 2.2%  | 91.4% → 89.3%
thomas.korber@mcclabel.com  | 7   | 0   | 0%   | 5.2%  | 104.3% → 98.7%
fatiha.kadi@proserve-dasri  | 6   | 6   | 100% | 0.0%  | 82.9% → 82.9%
safaa.tabet@maersk.com      | 4   | 4   | 100% | 0.0%  | 66.5% → 66.5%
f.baudoin@dodyplast.com     | 1   | 0   | 0%   | 30.6% | 114.8% → 79.7%
```

**Key findings:**
- Suppliers with 0% compression AND 100% win rate (vicky.sun, fatiha.kadi, safaa.tabet) = they submit exactly one price and always win. These are typically Dutch/Japanese prebid winners who know their market perfectly.
- `pe.pauck` participates in 8 lots, always enters near 99% of baseline, drops only 2%, and **never wins** — too expensive.
- `thomas.korber` enters 4-6% above baseline and ends at 98-99% — barely competitive, never wins.
- `illan.cherki` enters at 93.5%, drops 3.9% to 89.8%, wins 80% of the time — the ideal "strategic player".

### Competition Pairs (suppliers who compete on same lots)

```
illan.cherki@ciacam.fr   ↔ nele@casibeans.com              | 14 lots together
guilhermemaia@            ↔ illan.cherki@ciacam.fr          | 13 lots
illan.cherki@ciacam.fr   ↔ mattia.pedon@pedongroup.com     | 12 lots
allbestdisplay@163.com   ↔ vicky.sun@shanyoung.cn          | 9 lots
g.lefrancq@lefrancq.fr  ↔ pe.pauck@igp-etiquette.com      | 8 lots
```

### Overall Stats
- **162 completed lots** across 64 events
- **105 unique suppliers**, 402 total invitations
- **8 buyer companies** (Bonduelle 90, Kiabi 35, Inovie 18, Welding Alloys 10, etc.)
- **Auction types**: 126 Dutch, 31 English, 4 Japanese, 1 Sealed Bid
- **Average saving**: 13.2%
- **Success rate**: 94% (153/162 lots got bids)

## Game Theory Concepts That Could Apply

### 1. Nash Equilibrium
In repeated auctions, some suppliers seem to have found their "equilibrium" price — they consistently bid at the same % of baseline. For example, `p.curie` always ends at ~96% of baseline (±0.3%). This is their Nash equilibrium: the price where they can't improve without risking losing.

### 2. Signaling Theory
Entry price signals information:
- **Above baseline** (>100%): "I'm not desperate" — could be bluffing or genuinely expensive
- **Below baseline** (<90%): "I'm very competitive" — either genuinely cheap or trying to scare competitors away

### 3. Winner's Curse
Suppliers who win at very low prices (safaa.tabet at 66.5% of baseline) may be experiencing the winner's curse — winning because nobody else would go that low. Or they may genuinely have a cost advantage.

### 4. Tit-for-Tat / Responsive Strategies
Some suppliers change their compression based on competition intensity. With 2 competitors, they drop 5%. With 5 competitors, they drop 12%. These are "responsive" players.

### 5. Mechanism Design
The buyer chooses the auction type. Our data shows:
- **Dutch avg saving: 14.0%** on 126 lots
- **English avg saving: 10.8%** on 31 lots
- Dutch produces better savings with fewer suppliers (avg 2.1 per lot)
- English produces more competition intensity but needs 4+ suppliers

## What We Want to Build

An interactive supplier analytics dashboard that helps buyers:

1. **Understand each supplier's behavioral profile** — are they aggressive, conservative, predictable?
2. **Predict how a supplier will behave** in a future auction based on historical patterns
3. **Recommend optimal auction design** — which suppliers to invite, which auction type to use
4. **Identify risk factors** — ghost suppliers, bluffers, over-dependent on one winner
5. **Score supplier reliability** — consistency, participation rate, price competitiveness

## Questions for You

1. What visual representation would best show supplier behavioral profiles? (radar charts, scatter plots, matrices?)
2. How would you classify suppliers beyond the basic profiles I described?
3. What game theory insights could we apply to predict auction outcomes?
4. How would you design a "matchup simulator" that predicts savings based on which suppliers are invited?
5. What additional KPIs or metrics would be valuable for procurement analysts?
6. How should we visualize the relationship between competition intensity and savings?
7. Any ideas for identifying collusion or anti-competitive patterns in the data?
