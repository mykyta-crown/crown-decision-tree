# Crown API Documentation

This document provides comprehensive documentation for all server-side API routes in the Crown platform.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Webhook Endpoints](#webhook-endpoints)
4. [Auction Endpoints](#auction-endpoints)
5. [GPT/AI Endpoints](#gptai-endpoints)
6. [Conversation Endpoints](#conversation-endpoints)
7. [Credits Endpoints](#credits-endpoints)
8. [Utility Endpoints](#utility-endpoints)

---

## Overview

### Base URL

- **Production**: `https://app.crown-procurement.com`
- **Development**: `https://dev.crown.ovh`

### Runtime Configurations

| Runtime                | Use Case                  |
| ---------------------- | ------------------------- |
| Node.js                | Default, most endpoints   |
| Edge                   | Streaming endpoints (SSE) |
| Node.js 20.x + 3GB RAM | PDF generation            |

### Common Response Format

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Error description",
    "data": { ... }
  }
}
```

---

## Authentication

Most endpoints require authentication via Supabase Auth.

### Headers

```http
Authorization: Bearer <supabase_access_token>
```

### Role-Based Access

| Role          | Description                    |
| ------------- | ------------------------------ |
| `admin`       | Full platform access           |
| `buyer`       | Can create/manage auctions     |
| `super_buyer` | Buyer with company-wide access |
| `seller`      | Can participate in auctions    |

---

## Webhook Endpoints

These endpoints are triggered by Supabase database triggers.

### POST `/api/v1/webhooks/auctions/insert`

Triggered when a new auction is inserted.

**Purpose**:

- Broadcasts auction creation to connected clients
- Schedules Japanese auction rounds via Cloud Tasks

**Body** (from Supabase trigger):

```json
{
  "record": {
    "id": "uuid",
    "type": "japanese|dutch|reverse|sealed-bid",
    ...
  }
}
```

**Actions**:

- For `japanese` auctions: Calls `japaneseScheduleAuctionRounds()` to create Cloud Tasks
- Broadcasts `INSERT` event to channel `broadcast_auctions_id=eq.{auction_id}`

---

### POST `/api/v1/webhooks/auctions/update`

Triggered when an auction is updated.

**Purpose**:

- Broadcasts auction updates to connected clients
- Reschedules prebids when auction timing changes
- Manages serial/staggered auction group timing

**Body** (from Supabase trigger):

```json
{
  "record": { ... },      // Updated auction
  "old_record": { ... }   // Previous auction state
}
```

**Actions**:

- Broadcasts `UPDATE` event to channel `broadcast_auctions_id=eq.{auction_id}`
- For `japanese`: Reschedules auction rounds
- Calls `updatePreBidsToScheduler()` for Dutch prebids
- For `serial` timing rule: Cascades timing to next auction in group
- For `staggered` timing rule: Adjusts end times to maintain gaps

---

### POST `/api/v1/webhooks/bids/insert`

Triggered when a new bid is inserted.

**Purpose**:

- Broadcasts bid to connected clients
- Schedules Dutch prebids via Cloud Tasks (Dutch auctions only)

**Body** (from Supabase trigger):

```json
{
  "record": {
    "id": "uuid",
    "auction_id": "uuid",
    "seller_id": "uuid",
    "price": 100.0,
    "type": "bid|prebid"
  }
}
```

**Actions**:

- Validates auction is not closed
- For `dutch` auctions with `type: 'prebid'`: Calls `dutchAddPreBidToScheduler()`
  - Creates Cloud Task for auto-bid execution
  - Updates `bids.cloud_task` with task reference
- For `reverse` (English) auctions: Prebids are supported but NO Cloud Tasks created
  - English auctions don't have auto-bid feature
  - `bids.cloud_task` remains NULL (this is normal)
- Broadcasts `INSERT` event to channel `broadcast_bids_auction_id=eq.{auction_id}`

---

### POST `/api/v1/webhooks/users/insert`

Triggered when a new user is created in Supabase Auth.

---

## Auction Endpoints

### Cloud Task Handlers

#### POST `/api/v1/dutch/auto_bid`

**Called by**: Google Cloud Tasks (`BidWatchQueue`)

**Purpose**: Executes a scheduled Dutch prebid at the exact round time.

**Headers** (from Cloud Tasks):

```http
x-cloudtasks-queuename: BidWatchQueue
x-cloudtasks-taskname: <task_id>
```

**Body** (bid payload):

```json
{
  "id": "bid_uuid",
  "auction_id": "auction_uuid",
  "seller_id": "seller_uuid",
  "price": 100.0,
  "type": "prebid"
}
```

**Flow**:

1. Validates auction is active
2. Validates bid price matches current round price
3. Calculates exact millisecond timing with `calculateTimeToBid()`
4. Delays execution until exact bid time
5. Checks if prebid is still the lowest
6. If lowest, converts prebid to winning bid

---

#### POST `/api/v1/japanese/round_handler`

**Called by**: Google Cloud Tasks (`JaponeseRoundHandler`)

**Purpose**: Handles Japanese auction round transitions.

**Body**:

```json
{
  "type": "round",
  "auction": { "id": "uuid", ... },
  "round": {
    "price": 150.00,
    "previousPrice": 140.00,
    "start_at": "2024-01-01T10:00:00Z"
  }
}
```

**Flow**:

1. Validates auction is active and Japanese type
2. Counts bids at previous price
3. Checks for prebids at current price
4. If no bids at previous price and `max_rank_displayed > 0`: ends auction
5. Updates `auctions.end_at` to round start time

---

### Bid Validation

#### POST `/api/v1/japanese/is_supplier_bid_allowed`

**Purpose**: Validates if a supplier can place a bid in a Japanese auction.

**Body**:

```json
{
  "supplierId": "uuid",
  "auctionId": "uuid",
  "type": "bid|prebid",
  "price": 150.0,
  "created_at": "2024-01-01T10:05:00Z"
}
```

**Validation Rules**:

- Prebids are always allowed
- Live bids must:
  - Match current round price
  - Follow proper decrement sequence (no skipping rounds)
  - Be within valid round time window

**Response**:

```json
{
  "success": true,
  "data": {
    "isAllowed": true,
    "auctionId": "uuid",
    "supplierId": "uuid"
  }
}
```

---

### Rank Endpoints

#### GET `/api/v1/auctions/[auctionId]/suppliers/[supplierId]/rank`

**Purpose**: Gets a supplier's current rank in an auction.

**Response**: Returns rank number (capped at `auction.max_rank_displayed`)

**Uses**: `supabase.rpc('get_seller_rank', { p_seller_id, p_auction_id })`

---

#### GET `/api/v1/auctions/[auctionId]/supplies/[supplyId]/suppliers/[supplierId]/rank`

**Purpose**: Gets a supplier's rank for a specific supply item (line-item ranking).

---

### Training & Testing

#### POST `/api/v1/auctions/[auctionId]/restart`

**Purpose**: Resets a training/test auction for re-run.

**Authorization**: Only works if `auction.usage === 'training' || 'test'`

**Actions**:

1. Deletes all existing bids if auction has started
2. Sets `start_at` to now + 30 seconds (or 2 min for sealed-bid)
3. Recalculates `end_at` based on duration

---

#### POST `/api/v1/auctions/[auctionId]/training`

**Purpose**: Manages training bot behavior in test auctions.

**Bot Emails**:

```javascript
;[
  'bot-1@crown-procurement.com',
  'bot-2@crown-procurement.com',
  'bot-3@crown-procurement.com',
  'bot-4@crown-procurement.com',
  'bot-5@crown-procurement.com'
]
```

**Bot Behavior by Auction Type**:

| Type       | Behavior                                          |
| ---------- | ------------------------------------------------- |
| Dutch      | Creates prebid at round 9                         |
| Japanese   | Creates staggered prebids for each bot            |
| Sealed-bid | Creates bids with 3% decrements per bot           |
| Reverse    | Creates prebids at ceiling, responds to user bids |

---

### PDF Export

#### POST `/api/auctions/[auctionId]/export-pdf`

**Runtime**: Node.js 20.x, 3GB RAM, 60s timeout

**Purpose**: Generates PDF report for an auction.

**Rate Limit**: 5 requests/minute per user

**Body**:

```json
{
  "images": [
    {
      "data": "data:image/png;base64,...",
      "title": "Chart 1"
    }
  ],
  "metadata": { ... }
}
```

**Limits**:

- Max 500 images
- Max 10MB per image
- Max 100MB total payload

**Response**: PDF binary with `Content-Disposition: attachment`

---

### Handicaps

#### GET `/api/v1/auctions/[auctionId]/handicaps`

**Purpose**: Gets handicap options for an auction.

---

## GPT/AI Endpoints

### GPT Management

#### GET `/api/gpts/list`

**Purpose**: Lists all GPTs accessible to the current user.

---

#### POST `/api/gpts/create`

**Authorization**: Admin only

**Purpose**: Creates a new GPT configuration.

**Body**:

```json
{
  "name": "Procurement Assistant",
  "description": "Helps with RFP analysis",
  "icon": "url_to_icon",
  "instructions": "System prompt for the GPT...",
  "welcome_message": "Hello, how can I help?",
  "conversation_starters": ["Help me write an RFP", "Analyze this proposal"],
  "knowledge_files": [],
  "recommended_model": "openai/gpt-4-turbo",
  "provider": "openai"
}
```

**Supported Providers**: `openai`, `anthropic`, `google`, `gemini`, `mistral`, `xai`

---

#### GET `/api/gpts/[id]`

#### PATCH `/api/gpts/[id]`

#### DELETE `/api/gpts/[id]`

Standard CRUD operations for GPT configurations.

---

#### POST `/api/gpts/assign-users`

**Authorization**: Admin only

**Purpose**: Assigns GPT access to users or companies.

---

### Knowledge Files

#### GET `/api/gpts/[id]/knowledge/`

**Purpose**: Lists knowledge files for a GPT.

---

#### POST `/api/gpts/[id]/knowledge/upload`

**Purpose**: Uploads a knowledge file to a GPT.

---

#### DELETE `/api/gpts/[id]/knowledge/[fileId]`

**Purpose**: Deletes a knowledge file from a GPT.

---

## Conversation Endpoints

### Conversation Management

#### GET `/api/conversations/list`

**Purpose**: Lists all conversations for the current user.

---

#### POST `/api/conversations/create`

**Purpose**: Creates a new conversation with a GPT.

**Body**:

```json
{
  "gpt_id": "uuid",
  "title": "Optional title"
}
```

**Actions**:

1. Creates conversation record
2. Generates AI welcome message via OpenRouter
3. Creates initial assistant message

---

#### DELETE `/api/conversations/[id]`

**Purpose**: Soft-deletes a conversation (sets `deleted_at`).

---

#### POST `/api/conversations/[id]/restore`

**Purpose**: Restores a soft-deleted conversation.

---

#### POST `/api/conversations/[id]/rename`

**Purpose**: Renames a conversation.

---

### Messaging

#### GET `/api/conversations/[id]/messages`

**Purpose**: Gets all messages in a conversation.

---

#### POST `/api/conversations/[id]/send`

**Purpose**: Sends a message (non-streaming).

---

#### POST `/api/conversations/[id]/stream`

**Runtime**: Edge (for SSE streaming)

**Purpose**: Sends a message with streaming response.

**Rate Limit**: 10 requests/minute per user

**Body**:

```json
{
  "content": "User message",
  "document_ids": ["uuid1", "uuid2"]
}
```

**Flow**:

1. Validates credits
2. Creates user message
3. Links documents to message
4. Creates empty assistant message (status: `generating`)
5. Calls OpenRouter with streaming
6. Streams SSE chunks to client
7. Saves snapshots to DB every 2 seconds
8. Deducts credits on completion

**SSE Format**:

```
data: {"content": "Hello"}

data: {"content": " world"}

data: [DONE]
```

**OpenRouter Model**: Uses `gpt.recommended_model` or defaults to `openai/gpt-4-turbo`

---

### Document Management

#### GET `/api/conversations/[id]/documents/list`

**Purpose**: Lists documents attached to a conversation.

---

#### POST `/api/conversations/[id]/documents/upload`

**Purpose**: Uploads a document to a conversation.

---

#### DELETE `/api/conversations/[id]/documents/[docId]`

**Purpose**: Deletes a document from a conversation.

---

## Credits Endpoints

#### GET `/api/credits/balance`

**Purpose**: Gets user's credit balance.

**Response**:

```json
{
  "success": true,
  "data": {
    "credits_remaining": 100,
    "credits_total": 500
  }
}
```

**Uses**: `supabase.rpc('get_user_credits', { p_user_id })`

---

#### POST `/api/credits/add`

**Authorization**: Admin only

**Purpose**: Adds credits to a user's account.

---

## Utility Endpoints

### GET `/api/v1/last_bid`

**Purpose**: Gets the last bid for an auction.

---

### GET `/api/v1/retrieve_colors`

**Purpose**: Retrieves color configuration.

---

### GET `/api/v1/intercom`

### GET `/api/v1/intercom/contact`

**Purpose**: Intercom integration endpoints.

---

### GET `/api/debug/cookies`

**Purpose**: Debug endpoint for cookie inspection.

---

### POST `/api/setDefaultAuction`

**Purpose**: Sets default auction for testing.

---

### POST `/api/createTestAuction`

**Purpose**: Creates a test auction.

---

### GET `/api/test/dutch_round_time`

**Purpose**: Test endpoint for Dutch round timing calculations.

---

## Server Utilities

### Key Utility Files

| File                                             | Purpose                       |
| ------------------------------------------------ | ----------------------------- |
| `server/utils/enqueuer.js`                       | Cloud Tasks creation/deletion |
| `server/utils/dutch/helpers.js`                  | Dutch price calculations      |
| `server/utils/dutch/addPreBidToScheduler.js`     | Dutch prebid scheduling       |
| `server/utils/japanese/helpers.js`               | Japanese round calculations   |
| `server/utils/japanese/scheduleAuctionRounds.js` | Japanese task scheduling      |
| `server/utils/pdf/*`                             | PDF generation pipeline       |
| `server/utils/rateLimiter.js`                    | Rate limiting utility         |

### Global Auto-imports

These utilities are auto-imported in all server routes:

```javascript
// From server/utils/
supabase // Admin Supabase client
fetchAuction() // Fetch auction with error handling
auctionStatus() // Calculate auction status
ERROR_TYPES // Standard error types
dutchHelpers // Dutch auction helpers
japaneseHelpers // Japanese auction helpers
dutchAddPreBidToScheduler()
japaneseScheduleAuctionRounds()
updatePreBidsToScheduler()
enqueueTask()
deleteTask()
```

### Error Types

```javascript
ERROR_TYPES = {
  UNAUTHORIZED: { statusCode: 401, message: 'Unauthorized' },
  NOT_FOUND: { statusCode: 404, message: 'Not found' },
  INVALID_INPUT: { statusCode: 400, message: 'Invalid input' },
  AUCTION_CLOSED: { statusCode: 400, message: 'Auction is closed' },
  INVALID_AUCTION_TYPE: { statusCode: 400, message: 'Invalid auction type' },
  INVALID_BID_PRICE: { statusCode: 400, message: 'Invalid bid price' },
  INVALID_BID_TIME: { statusCode: 400, message: 'Invalid bid time' },
  INVALID_BID_DECREMENT: { statusCode: 400, message: 'Invalid bid decrement' },
  BID_PROCESSING_FAILED: { statusCode: 500, message: 'Bid processing failed' },
  DATABASE_ERROR: { statusCode: 500, message: 'Database error' },
  INTERNAL_ERROR: { statusCode: 500, message: 'Internal error' },
  ENQUEUING_FAILED: { statusCode: 500, message: 'Failed to enqueue task' }
}
```

---

## Cloud Tasks Configuration

### Queues

| Queue                  | Purpose                   | Endpoint                         |
| ---------------------- | ------------------------- | -------------------------------- |
| `BidWatchQueue`        | Dutch prebid execution    | `/api/v1/dutch/auto_bid`         |
| `JaponeseRoundHandler` | Japanese round management | `/api/v1/japanese/round_handler` |

### GCP Configuration

```javascript
PROJECT: 'crown-476614'
LOCATION: 'europe-west1'
```

### Task Payload Format

**Dutch Prebid**:

```json
{
  "id": "bid_uuid",
  "auction_id": "auction_uuid",
  "seller_id": "seller_uuid",
  "price": 100.0,
  "type": "prebid"
}
```

**Japanese Round**:

```json
{
  "type": "round",
  "auction": { "id": "uuid", ... },
  "round": {
    "number": 5,
    "price": 150.00,
    "previousPrice": 140.00,
    "start_at": "2024-01-01T10:00:00Z",
    "end_at": "2024-01-01T10:05:00Z"
  }
}
```

---

## Realtime Broadcasts

The platform uses Supabase Realtime for live updates.

### Channel Naming Convention

```
broadcast_auctions_id=eq.{auction_id}
broadcast_bids_auction_id=eq.{auction_id}
```

### Event Types

- `INSERT` - New record created
- `UPDATE` - Record updated
- `DELETE` - Record deleted

### Payload Format

```json
{
  "type": "broadcast",
  "event": "INSERT|UPDATE|DELETE",
  "payload": {
    "record": { ... },
    "old_record": { ... }  // Only for UPDATE
  }
}
```
