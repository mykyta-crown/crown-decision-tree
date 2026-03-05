# Frontend Architecture

This document describes the Vue composables and component structure for the Crown e-auction platform.

## Table of Contents

1. [Dependencies & Scripts](#dependencies--scripts)
2. [Middleware](#middleware)
3. [Composables](#composables)
4. [Components Structure](#components-structure)
5. [Key Components](#key-components)
6. [Data Flow](#data-flow)

---

## Dependencies & Scripts

### NPM Scripts

| Script        | Command          | Purpose                    |
| ------------- | ---------------- | -------------------------- |
| `dev`         | `nuxt dev`       | Start development server   |
| `build`       | `nuxt build`     | Build for production       |
| `generate`    | `nuxt generate`  | Generate static site       |
| `preview`     | `nuxt preview`   | Preview production build   |
| `lint`        | `eslint .`       | Run ESLint                 |
| `lint:fix`    | `eslint . --fix` | Auto-fix ESLint issues     |
| `postinstall` | `nuxt prepare`   | Prepare Nuxt after install |

#### Test Scripts

| Script                        | Purpose                        |
| ----------------------------- | ------------------------------ |
| `test-engine`                 | Test auction engine            |
| `test_jap_plan`               | Test Japanese auction planning |
| `test_jap_bider`              | Emulate Japanese auction bids  |
| `test_jap_round`              | Emulate Japanese round handler |
| `test_dutch_ender`            | Test Dutch prebid execution    |
| `test_task_enqueue`           | Test Cloud Tasks creation      |
| `test_auction_update_prebids` | Test Dutch prebid updates      |

### Dependencies

#### Core Framework

| Package               | Version | Purpose              |
| --------------------- | ------- | -------------------- |
| `nuxt`                | 3.15.4  | Framework            |
| `vue`                 | ^3.5.6  | UI Framework         |
| `vue-router`          | ^4.4.5  | Routing              |
| `vuetify`             | ^3.7.8  | UI Component Library |
| `vuetify-nuxt-module` | ^0.18.3 | Vuetify integration  |

#### Supabase & Database

| Package                 | Version | Purpose              |
| ----------------------- | ------- | -------------------- |
| `@nuxtjs/supabase`      | ^2.0.1  | Supabase Nuxt module |
| `@supabase/supabase-js` | ^2.57.2 | Supabase client      |
| `pg`                    | ^8.13.3 | PostgreSQL client    |

#### Google Cloud

| Package               | Version | Purpose                           |
| --------------------- | ------- | --------------------------------- |
| `@google-cloud/tasks` | 4.0.1   | Cloud Tasks for prebid scheduling |

#### Charts & Visualization

| Package                   | Version | Purpose                    |
| ------------------------- | ------- | -------------------------- |
| `chart.js`                | ^4.4.4  | Chart library              |
| `vue-chartjs`             | ^5.3.1  | Vue Chart.js wrapper       |
| `chartjs-adapter-dayjs-4` | ^1.0.4  | Dayjs adapter for Chart.js |
| `d3`                      | ^7.9.0  | Data visualization         |

#### Date & Time

| Package          | Version  | Purpose           |
| ---------------- | -------- | ----------------- |
| `dayjs`          | ^1.11.13 | Date manipulation |
| `@date-io/dayjs` | ^3.0.0   | Date adapter      |

#### Utilities

| Package              | Version  | Purpose                  |
| -------------------- | -------- | ------------------------ |
| `lodash`             | ^4.17.21 | Utility functions        |
| `zod`                | ^3.23.8  | Schema validation        |
| `@vueuse/core`       | ^11.1.0  | Vue composable utilities |
| `@vueuse/components` | ^11.1.0  | VueUse components        |
| `@vueuse/sound`      | ^2.0.1   | Audio composables        |
| `jsonwebtoken`       | ^9.0.2   | JWT handling             |

#### Content & Rich Text

| Package            | Version | Purpose                 |
| ------------------ | ------- | ----------------------- |
| `@vueup/vue-quill` | ^1.2.0  | Rich text editor        |
| `marked`           | ^15.0.7 | Markdown parser         |
| `dompurify`        | ^3.3.0  | HTML sanitization       |
| `mammoth`          | ^1.11.0 | DOCX to HTML conversion |
| `unpdf`            | ^1.4.0  | PDF parsing             |

#### PDF & Screenshots

| Package               | Version  | Purpose                       |
| --------------------- | -------- | ----------------------------- |
| `puppeteer-core`      | ^24.28.0 | Headless browser (production) |
| `puppeteer`           | ^24.29.1 | Headless browser (dev)        |
| `@sparticuz/chromium` | ^141.0.0 | Chromium for serverless       |
| `html2canvas`         | ^1.4.1   | HTML to canvas                |

#### Analytics & Support

| Package                      | Version | Purpose          |
| ---------------------------- | ------- | ---------------- |
| `@vercel/analytics`          | ^1.3.1  | Vercel Analytics |
| `logrocket`                  | ^9.0.0  | Session replay   |
| `@intercom/messenger-js-sdk` | ^0.0.17 | Intercom chat    |

#### UI Assets

| Package         | Version | Purpose               |
| --------------- | ------- | --------------------- |
| `@mdi/font`     | ^7.4.47 | Material Design Icons |
| `vue3-carousel` | ^0.3.4  | Carousel component    |
| `sass`          | ^1.78.0 | SCSS preprocessor     |

#### Dev & Linting

| Package                       | Version | Purpose             |
| ----------------------------- | ------- | ------------------- |
| `eslint`                      | ^8.57.0 | Linter              |
| `eslint-plugin-vue`           | ^9.22.0 | Vue ESLint rules    |
| `@stylistic/eslint-plugin-js` | ^1.6.3  | Stylistic rules     |
| `@nuxt/content`               | ^2.13.4 | Content management  |
| `@nuxtjs/google-fonts`        | ^3.2.0  | Google Fonts loader |

---

## Middleware

Nuxt route middleware for authentication and authorization. Located in `/middleware/`.

### Available Middleware

| Middleware  | File           | Purpose                                           | Redirect on Fail      |
| ----------- | -------------- | ------------------------------------------------- | --------------------- |
| `auth`      | `auth.js`      | Checks user is authenticated                      | `/auth/signin`        |
| `userRole`  | `userRole.js`  | Checks user is admin or buyer                     | `/home`               |
| `gptAdmin`  | `gptAdmin.js`  | Checks user has admin role for GPT admin routes   | `/gpts/chat`          |
| `gptAccess` | `gptAccess.js` | Checks user has admin, buyer, or super_buyer role | `/dashboard`          |
| `terms`     | `terms.js`     | Checks seller has accepted auction terms          | `/auctions/.../terms` |

### Middleware Details

#### `auth`

Basic authentication check. Verifies Supabase session exists.

```javascript
// Usage in page
definePageMeta({ middleware: ['auth'] })
```

#### `userRole`

Restricts access to admin and buyer users only. Uses `useUser()` composable.

```javascript
// Allowed roles: admin, buyer
// Redirect: /home
```

#### `gptAdmin`

Admin-only access for GPT management routes (create, edit GPTs).

```javascript
// Allowed roles: admin only
// Redirect: /gpts/chat
```

#### `gptAccess`

Access control for GPT chat features. Allows admins and buyers.

```javascript
// Allowed roles: admin, buyer, super_buyer
// Redirect: /dashboard
```

#### `terms`

Ensures seller has accepted terms for all lots in an auction group before accessing seller view.

- Fetches all auctions in the group
- Checks `auctions_sellers.terms_accepted` for each lot
- Redirects to first lot with unaccepted terms
- Supports `?multilot=true` query param

### Middleware Flow

```
Page Request
    ↓
definePageMeta({ middleware: ['auth', 'userRole'] })
    ↓
auth middleware → Check session
    ↓ (pass)
userRole middleware → Check role
    ↓ (pass)
Page renders
```

---

## Composables

Composables are the core business logic layer. They are located in `/composables/`.

### Auction Core

| Composable             | Purpose                                           | Key Exports                                                                                                 |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `useAuctionTimer.js`   | Manages auction timing, status updates, countdown | `now`, `status`, `start`, `end`, `startInDuration`, `endInDuration`, `duration`                             |
| `useDutchRounds.js`    | Dutch auction round logic (descending price)      | `rounds`, `activeRound`, `startingPrice`, `endingPrice`, `maxNbRounds`, `nbPassedRounds`, `currentSupplies` |
| `useJapaneseRounds.js` | Japanese auction round logic (ascending price)    | `rounds`, `activeRound`, `startingPrice`, `endingPrice`, `bestBid`, `currentSupplies`                       |
| `useTrainingBots.js`   | Bot automation for training auctions              | `startBots()` - starts 10s interval calling `/api/v1/auctions/{id}/training`                                |

### Bidding System

| Composable              | Purpose                                         | Key Exports                                        |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `useBids.js`            | Bid insertion and prebid management             | `insertBid()`, `lastPrebids`, `lastPrebidFromUser` |
| `useRank.js`            | Seller rank calculation (memoized, 200ms cache) | `fetchRank(userId, auctionId)`                     |
| `useCeilingPrice.js`    | Ceiling price management for supplies           | -                                                  |
| `useUserAuctionBids.js` | User-specific auction bid data                  | `auction`, `updateAuction()`                       |

### Realtime System

| Composable              | Purpose                                | Key Exports                                      |
| ----------------------- | -------------------------------------- | ------------------------------------------------ |
| `useRealtime.js`        | Generic Supabase realtime subscription | `subscribedData`, `fetchData()`, `unsubscribe()` |
| `useRealtimeBids.js`    | Realtime bids subscription wrapper     | `bids`, `fetchBids()`                            |
| `useRealtimeAuction.js` | Realtime auction updates               | -                                                |
| `useBroadcast.js`       | Supabase broadcast channel             | -                                                |
| `usePresences.js`       | User presence tracking                 | -                                                |

### GPT/AI System

| Composable                 | Purpose                            | Key Exports                                                             |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `useStreamConversation.js` | SSE streaming for AI chat          | `sendMessage(conversationId, content, onChunk)`, `isStreaming`, `error` |
| `useConversations.js`      | Conversation management            | -                                                                       |
| `useGPTs.js`               | GPT assistant data                 | -                                                                       |
| `useCredits.js`            | AI credits management              | -                                                                       |
| `useTypewriter.js`         | Typewriter effect for AI responses | -                                                                       |

### UI Utilities

| Composable             | Purpose                                      | Key Exports |
| ---------------------- | -------------------------------------------- | ----------- |
| `useTableSort.js`      | Table sorting logic                          | -           |
| `useTableFilters.js`   | Table filtering logic                        | -           |
| `useTableSelection.js` | Table row selection                          | -           |
| `useColorSchema.js`    | Theme/color management                       | -           |
| `useToast.js`          | Toast notification system                    | -           |
| `useNow.js`            | Reactive current time (updates every second) | `now`       |

### Data Utilities

| Composable                   | Purpose                     | Key Exports |
| ---------------------------- | --------------------------- | ----------- |
| `useAuctionFormatting.js`    | Auction display formatting  | -           |
| `useAuctionsDescriptions.js` | Auction type descriptions   | -           |
| `useAuctionDocuments.js`     | Auction document management | -           |
| `useAuctionGroupSettings.js` | Auction group configuration | -           |
| `useAuctionLogs.js`          | Auction activity logs       | -           |
| `useZodSchema.js`            | Zod validation schemas      | -           |

### User & Profile

| Composable             | Purpose                 | Key Exports |
| ---------------------- | ----------------------- | ----------- |
| `useUser.js`           | Current user data       | `user`      |
| `useEmailToProfile.js` | Email to profile lookup | -           |
| `useContactList.js`    | Contact list management | -           |
| `useConsent.js`        | User consent management | -           |

### Training & Onboarding

| Composable           | Purpose                 | Key Exports |
| -------------------- | ----------------------- | ----------- |
| `useTrainings.js`    | Training auction data   | -           |
| `useTrainingType.js` | Training type selection | -           |
| `useIntercomTour.js` | Intercom guided tours   | -           |

---

## Components Structure

Components are organized by domain in `/components/`.

```
components/
├── Admin/                 # Admin panel components
├── Auth/                  # Authentication (login, signup, password)
│   ├── PasswordCheck.vue
│   ├── CookieBanner.vue
│   ├── ErrorAlert.vue
│   └── PreviewSheet.vue
├── Auctions/              # Auction-specific components
│   ├── Dutch/             # Dutch auction views
│   │   ├── BuyerView.vue
│   │   ├── SellerView.vue
│   │   ├── RoundTimer.vue
│   │   ├── RoundsCard.vue
│   │   └── ...
│   ├── Japanese/          # Japanese auction views
│   │   ├── BuyerView.vue
│   │   ├── SellerView.vue
│   │   ├── LeavingDialog.vue
│   │   ├── WarningDialog.vue
│   │   └── ...
│   ├── English/           # English auction views
│   │   └── SellerView.vue
│   ├── LogsItems/         # Bid log item renderers
│   │   ├── AuctionStarted.vue
│   │   ├── AuctionEnded.vue
│   │   ├── CompetitorBid.vue
│   │   ├── PrebidRequest.vue
│   │   └── ...
│   ├── Inputs/            # Auction input components
│   ├── Multi/             # Multi-lot components
│   └── EndDialog/         # End dialog components
├── Builder/               # Auction builder components
├── Charts/                # Chart components
│   └── DutchRounds.vue
├── Clients/               # Client management
├── Companies/             # Company management
├── Dashboard/             # Dashboard widgets
│   ├── Card.vue
│   ├── InfoCard.vue
│   ├── DateDropdownMenu.vue
│   └── CompaniesDropdownMenu.vue
├── GPT/                   # GPT chat interface
├── Home/                  # Home page components
│   ├── AuctionsFilters.vue
│   ├── FilterBadge.vue
│   └── ...
├── Landing/               # Landing page sections
│   ├── HeroSection.vue
│   ├── BenefitsSection.vue
│   └── ...
├── Layout/                # Layout components
│   └── Footer.vue
├── Onboarding/            # Onboarding flow
├── Terms/                 # Auction terms/rules panels
│   ├── GeneralPanel.vue
│   ├── RulesPanel.vue
│   ├── CeilingPanel.vue
│   └── ...
└── Trainings/             # Training components
```

---

## Key Components

### Bid Tables

| Component                   | Purpose                              | Used By             |
| --------------------------- | ------------------------------------ | ------------------- |
| `BidTableBuyer.vue`         | Shows all bids to buyer with ranking | Buyer auction view  |
| `BidTableSeller.vue`        | Shows seller's own bids              | Seller auction view |
| `BidTableSellerItem.vue`    | Single bid row for seller            | BidTableSeller      |
| `PreBidTableSeller.vue`     | Prebid management for Dutch auctions | Dutch seller view   |
| `PreBidTableSellerItem.vue` | Single prebid row                    | PreBidTableSeller   |

### Auction Views

| Component                          | Purpose                                    |
| ---------------------------------- | ------------------------------------------ |
| `Auctions/Dutch/BuyerView.vue`     | Buyer's view of Dutch auction              |
| `Auctions/Dutch/SellerView.vue`    | Seller's view of Dutch auction             |
| `Auctions/Japanese/BuyerView.vue`  | Buyer's view of Japanese auction           |
| `Auctions/Japanese/SellerView.vue` | Seller's view of Japanese auction          |
| `Auctions/English/SellerView.vue`  | Seller's view of English (reverse) auction |

### Auction Cards

| Component              | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `AuctionCard.vue`      | Auction summary card for listings       |
| `RankCard.vue`         | Shows seller's current rank (see below) |
| `LeaderboardCard.vue`  | Shows current ranking                   |
| `BidsLogsCard.vue`     | Activity log display                    |
| `BigNumberBidCard.vue` | Large price display                     |

#### RankCard Display Logic

The `RankCard.vue` component displays the seller's global rank with different visuals based on state:

| Condition               | Display                                                   |
| ----------------------- | --------------------------------------------------------- |
| `status === 'upcoming'` | Text: "Your rank will appear when eAuction starts"        |
| `sealed-bid` + `active` | Text: "Your rank will appear when the eAuction time ends" |
| `rank === 0` (hidden)   | Image: `Without_rank.svg`                                 |
| `rank 1-10`             | Image: `Rank_X.svg` (podium with number)                  |
| `rank > 10`             | Image: `auction-loser.svg`                                |
| `rank === -1` (no bids) | Image: `auction-loser.svg`                                |

**Hidden rank behavior**: When `max_rank_displayed` is set and the seller's rank exceeds this limit, `get_seller_rank()` returns `0`. The frontend shows `Without_rank.svg` instead of revealing the actual position.

### Dialogs

| Component                             | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `ConfirmBidDialog.vue`                | Bid confirmation modal             |
| `Auctions/IdleDialog.vue`             | Inactivity warning                 |
| `Auctions/Japanese/LeavingDialog.vue` | Japanese auction exit confirmation |
| `Auctions/Japanese/WarningDialog.vue` | Japanese auction warning           |
| `Auctions/EndDialogBuyer.vue`         | End auction summary for buyer      |
| `Auctions/EndDialogSeller.vue`        | End auction summary for seller     |

---

## Data Flow

### Realtime Bid Flow

```
User Action (place bid)
    ↓
useBids.insertBid()
    ↓
Supabase RPC: insert_bid
    ↓
Database trigger → webhook
    ↓
useRealtime subscription
    ↓
subscribedData.value updated
    ↓
Vue reactivity → UI update
```

### Dutch Auction Round Flow

```
useAuctionTimer (1s interval)
    ↓
status.value changes (upcoming → active → closed)
    ↓
useDutchRounds.nbPassedRounds computed
    ↓
rounds[].status updated (inactive → active → passed)
    ↓
activeRound computed
    ↓
currentSupplies.price updated
    ↓
UI reflects current round price
```

### Japanese Auction Round Flow

```
useAuctionTimer (1s interval)
    ↓
status.value changes
    ↓
useJapaneseRounds.nbPassedRounds computed
    ↓
rounds[].status updated
    ↓
activeRound computed (ascending price)
    ↓
Server calls /api/v1/japanese/round_handler
    ↓
Sellers who didn't confirm are eliminated
```

### Training Bot Flow

```
useTrainingBots.startBots()
    ↓
setInterval(10000) - every 10 seconds
    ↓
POST /api/v1/auctions/{id}/training
    ↓
Server executes bot logic (see BOT_BEHAVIOR.md)
    ↓
Bids inserted via RPC
    ↓
Realtime updates to all clients
```

### GPT Streaming Flow

```
User sends message
    ↓
useStreamConversation.sendMessage()
    ↓
POST /api/conversations/{id}/stream
    ↓
SSE response with chunks
    ↓
onChunk callback
    ↓
useTypewriter effect
    ↓
UI displays streaming text
```

---

## Component Naming Conventions

- **View** suffix: Full-page view components (e.g., `BuyerView.vue`, `SellerView.vue`)
- **Card** suffix: Card-style containers (e.g., `InfoCard.vue`, `RankCard.vue`)
- **Dialog** suffix: Modal dialogs (e.g., `ConfirmBidDialog.vue`)
- **Panel** suffix: Collapsible/expandable sections (e.g., `GeneralPanel.vue`)
- **Section** suffix: Landing page sections (e.g., `HeroSection.vue`)
- **Item** suffix: List item renderers (e.g., `BidTableSellerItem.vue`)
- **Table** prefix/suffix: Data table components (e.g., `BidTableBuyer.vue`)

---

## Auto-Imports

Nuxt auto-imports:

- All composables from `/composables/`
- All components from `/components/`
- Vue Composition API (`ref`, `computed`, `watch`, etc.)
- VueUse utilities

No explicit imports needed for these in Vue templates or scripts.
