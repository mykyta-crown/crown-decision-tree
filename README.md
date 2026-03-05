# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

########################################
eAuction Logs documentation

### Documentation for Auction Logs Composable

This Vue.js composable function is designed to handle auction logs, specifically for a Dutch auction system. The composable integrates various pieces of functionality, such as tracking rounds, bids, auction timers, and real-time logs, and is used to provide a dynamic and detailed activity log for an auction.

#### 1. **Dependencies**

- **useDutchRounds**: A custom composable handling Dutch auction rounds.
- **useUser**: A composable providing user information such as if he's an admin or not.
- **useUserAuctionBids**: A composable that retrieves the current user's bids within the auction.
- **useAuctionTimer**: A composable that manages the auction's start and end times, providing countdowns and status updates.

#### 2. **Input Parameters**

- **auctionId**: This parameter is passed when calling the composable. It represents the auction for which the logs will be generated and retrieved from the URL.

#### 3. **Reactive Properties**

- **localLogs (ref)**: This reactive array stores logs generated during the auction. It contains objects representing various auction events (e.g., new bids, rounds, auction status updates).

#### 4. **Generated Log Objects**

- **askPrebid**:
  - Type: `'PrebidRequest'`
  - Description: A log generated when a prebid request is triggered.
  - Example:
    ```javascript
    {
      type: 'PrebidRequest',
      timestamp: Date.now()
    }
    ```

- **ValidatedTerms**:
  - Type: `'ValidatedTerms'`
  - Description: Logged when a seller has accepted the auction terms. It’s used in the activity log to show that terms have been validated.
  - Example:
    ```javascript
    {
      type: 'ValidatedTerms',
      timestamp: Date.parse('04 Dec 1996 00:12:00 GMT'),
      text: auction.value?.lot_name
    }
    ```

- **AuctionPrebid**:
  - Type: `'AuctionPrebid'`
  - Description: This log is generated when the user places a prebid.
  - Example:
    ```javascript
    {
      type: 'AuctionPrebid',
      bid: bid,
      auction: auction,
      timestamp: +dayjs(bid.created_at)
    }
    ```

- **NewDutchRound**:
  - Type: `'NewDutchRound'`
  - Description: Logged when a new round starts in a Dutch auction.
  - Example:
    ```javascript
    {
      type: 'NewDutchRound',
      bid: activeRound.value,
      auction: auction,
      timestamp: Date.now(),
      currentRound: nbPassedRounds.value,
      rankColor: '#DEF7EC'
    }
    ```

- **AuctionBid**:
  - Type: `'AuctionBid'`
  - Description: Represents a standard auction bid.
  - Example:
    ```javascript
    {
      type: 'AuctionBid',
      bid: bid,
      auction: auction,
      timestamp: +dayjs(bid.created_at),
      rank: bid.rank,
      rankColor: colorsMap[bid?.profiles.companies.name].secondary
    }
    ```

- **RemainingTime**:
  - Type: `'RemainingTime'`
  - Description: This log shows the remaining time when the auction is active.
  - Example:
    ```javascript
    {
      type: 'RemaningTime',
      text: `${getMinute()}`,
      timestamp: Date.now()
    }
    ```

- **OvertimeTriggered**:
  - Type: `'OvertimeTriggered'`
  - Description: This log is generated when overtime is triggered in a reverse auction.
  - Example:
    ```javascript
    {
      type: 'OvertimeTriggered',
      timestamp: Date.now(),
      auction: auction
    }
    ```

- **OwnCeilingPrice**:
  - Type: `'OwnCeilingPrice'`
  - Description: Shows the owner’s ceiling price in the auction.
  - Example:
    ```javascript
    {
      type: 'OwnCeilingPrice',
      timestamp: Date.parse('04 Dec 1998 00:12:00 GMT'),
      auction: auction
    }
    ```

- **StartingPrice**:
  - Type: `'StartingPrice'`
  - Description: Indicates the starting price of the Dutch auction.
  - Example:
    ```javascript
    {
      type: 'StartingPrice',
      timestamp: Date.parse('04 Dec 1997 00:12:00 GMT'),
      auction: auction.value,
      price: startingPrice.value
    }
    ```

- **IncomingTime**:
  - Type: `'IncomingTime'`
  - Description: Generated when the auction is about to start, showing how much time is left before it begins.
  - Example:
    ```javascript
    {
      type: 'IncomingTime',
      timestamp: Date.parse('04 Dec 1995 00:12:00 GMT'),
      text: startInDuration,
      start: start
    }
    ```

- **AuctionStarted**:
  - Type: `'AuctionStarted'`
  - Description: Marks the time when the auction started.
  - Example:
    ```javascript
    {
      type: 'AuctionStarted',
      timestamp: dayjs(auction?.value.start_at)
    }
    ```

- **AuctionEnded**:
  - Type: `'AuctionEnded'`
  - Description: Marks the time when the auction ended.
  - Example:
    ```javascript
    {
      type: 'AuctionEnded',
      timestamp: dayjs(auction?.value.end_at).add(1, 's')
    }
    ```

- **EndingRank**:
  - Type: `'EndingRank'`
  - Description: Shows the ending rank of the user in the auction.
  - Example:
    ```javascript
    {
      type: 'EndingRank',
      timestamp: dayjs(auction?.value.end_at).add(2, 's'),
      rank: rank.value
    }
    ```

#### 5. **Watchers**

- **`watch(activeRound)`**: Watches for changes in the active auction round. If the new round price is higher than the old one (in a Dutch auction), it triggers the `newRoundHandler()` and logs a new round.
- **`watch(rank)`**: Watches for changes in the user's rank and logs the change if the rank improves.
- **`watch(end)`**: Watches for changes in the auction’s end time. If overtime is triggered, it logs the `OvertimeTriggered` event.

#### 6. **Interval for Remaining Time**

An interval (`setInterval`) is used to check the remaining time and log the time left when it decreases. This updates the `localLogs` array with `RemainingTime` logs until the auction is closed.

#### 7. **Cleanup**

On unmount (`onUnmounted`), the interval is cleared to prevent memory leaks.

#### 8. **Computed Property `logs`**

The computed `logs` property combines different log objects into a unified log array. This array is sorted by timestamp in descending order and displayed in the auction log interface. The logs can contain:

- Bids (prebids and regular bids)
- Auction round changes
- Remaining time updates
- Overtime triggers
- Auction start and end events

The `logs` property adapts its contents based on the auction’s current status (upcoming, active, closed) and the user’s role (buyer or admin). For instance, if the auction is closed, it adds `AuctionEnded` and `EndingRank` logs.

---

This composable is integral to managing real-time updates for auction events and displaying them within the auction’s activity log, making it essential for providing a transparent and responsive bidding experience.
