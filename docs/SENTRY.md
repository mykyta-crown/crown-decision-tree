# Sentry Error Monitoring

## Overview

Sentry is configured to provide comprehensive error monitoring and performance tracking across the Crown e-auction platform. This includes:

- **Automatic error capture** via Nitro plugin hooks
- **Manual error capture** with rich business context for critical endpoints
- **Performance tracking** for API endpoints and webhooks
- **User and auction context** automatically extracted from requests

The system operates in both review apps and production environments.

## Configuration

### Project Information

- **Organization**: `crown-ib`
- **Project**: `javascript-nuxt`
- **Sentry URL**: https://sentry.io/organizations/crown-ib/projects/javascript-nuxt/

### Environment Variables

Add these environment variables to your Vercel project settings:

```bash
# Sentry DSN (Data Source Name)
NUXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# Environment (optional, defaults to VERCEL_ENV)
NUXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

#### Setting up for Vercel

1. Go to your Vercel project settings: https://vercel.com/crown-ib/crown/settings/environment-variables
2. Add the `NUXT_PUBLIC_SENTRY_DSN` variable:
   - **Production**: Set the DSN for production monitoring
   - **Preview**: Set the same DSN (or a different one if you want separate environments)
   - **Development**: Optional, can be left empty for local development

3. Get your DSN from Sentry:
   - Go to: https://sentry.io/organizations/crown-ib/projects/javascript-nuxt/keys/
   - Copy the DSN value

### Configuration Files

- **`sentry.client.config.js`**: Client-side Sentry configuration with Session Replay
- **`sentry.server.config.js`**: Server-side Sentry configuration
- **`nuxt.config.js`**: Sentry module integration + source maps configuration

### Source Maps Configuration

Les source maps sont configurées dans `nuxt.config.js` :

```javascript
sourcemap: {
  server: true,
  client: 'hidden' // Génère les source maps mais ne les expose pas au client
}
```

**Pourquoi `hidden` ?**

- ✅ Les source maps sont générées pour Sentry
- ✅ Elles sont uploadées lors du build
- ✅ Elles sont supprimées après upload (pas exposées publiquement)
- ✅ Les utilisateurs ne peuvent pas voir votre code source
- ✅ Sentry peut quand même "un-minifier" les stack traces

## Features

### Client-Side Monitoring

- **Error Tracking**: Automatically captures JavaScript errors, unhandled promises, and console errors
- **Session Replay**: Records user sessions to help debug issues (with privacy controls)
  - Masks all text by default
  - Blocks all media (images, videos)
  - 10% of sessions are recorded
  - 100% of sessions with errors are recorded
- **Performance Monitoring**: Tracks page load times and component render performance
- **Breadcrumbs**: Captures user interactions (clicks, navigation, console logs)

### Server-Side Monitoring

- **Automatic Error Capture**: All API/webhook errors captured via Nitro plugin hooks
- **Rich Business Context**: Errors include user, auction, bid, and operation metadata
- **Performance Tracking**: Critical endpoints monitored for response times
- **Data Sanitization**: Sensitive data (passwords, tokens, headers) automatically filtered
- **Smart Error Filtering**: Non-actionable errors (401, 404, network issues) ignored
- **Specialized Capture Functions**: Manual error capture for webhooks, Cloud Tasks, and critical operations

### Environment-Specific Behavior

- **Production**: 10% sampling rate for performance traces, full error tracking
- **Preview/Review Apps**: 10% sampling rate for performance traces, full error tracking
- **Local Development**: **Completely disabled** - Sentry will not initialize or send any data when running `npm run dev` locally, even if the DSN is set

## Ignored Errors

The following errors are automatically filtered out to reduce noise:

### Client-Side

- Network errors (Failed to fetch, Network request failed)
- Navigation cancelled errors
- ChunkLoadError (lazy loading issues)
- ResizeObserver loop limit exceeded
- Non-Error promise rejections

### Server-Side

- ECONNRESET
- ENOTFOUND
- ETIMEDOUT

## Server Architecture

### Automatic Error Capture (Nitro Plugin)

The Sentry Nitro plugin (`server/plugins/sentry.js`) automatically captures all unhandled errors in API endpoints and webhooks via Nitro lifecycle hooks:

**Features:**

- **`error` hook**: Captures all unhandled exceptions with context
- **`request` hook**: Starts performance transaction for critical endpoints
- **`afterResponse` hook**: Finishes performance transaction
- **Automatic context extraction**: User (from Supabase auth), auction (from URL/body)
- **Smart tagging**: `endpoint`, `method`, `operation_type`, `auction_type`, `is_webhook`, `is_cloud_task`, `is_critical`
- **Error filtering**: Ignores 401, 404, and network errors (ECONNRESET, ETIMEDOUT, etc.)
- **Data sanitization**: Removes sensitive headers/body fields before sending to Sentry

**Critical Endpoints (automatic performance tracking):**

- `/api/v1/webhooks/*` (all webhooks)
- `/api/v1/dutch/auto_bid` (Dutch prebid execution)
- `/api/v1/japanese/round_handler` (Japanese round handler)
- `/api/v1/auctions/*/training` (Bot training)
- `/api/v1/auctions/*` (auction operations)
- `/api/v1/bids/*` (bid operations)

**No code changes needed** - errors are automatically captured with rich context!

### Manual Error Capture (Specialized Functions)

For **enhanced context** in critical error paths, use specialized capture functions from `server/utils/sentry/captureApiError.js`:

#### 1. `captureWebhookError(error, event, webhookType, recordData)`

Use in webhook endpoints to capture errors with webhook-specific metadata.

```javascript
import { captureWebhookError } from '../../../utils/sentry/captureApiError'

export default defineEventHandler(async (event) => {
  try {
    // Webhook logic
  } catch (error) {
    await captureWebhookError(error, event, 'bid_insert', {
      auctionId: body?.record?.auction_id,
      bidId: body?.record?.id
    })
    throw error
  }
})
```

**Tags added:**

- `operation_type: 'webhook'`
- `webhook_type`: `'bid_insert'`, `'auction_insert'`, `'auction_update'`, etc.
- `auction_id`, `bid_id`
- `critical: 'true'`

**Used in:**

- `server/api/v1/webhooks/bids/insert.post.js`
- `server/api/v1/webhooks/auctions/insert.post.js`
- `server/api/v1/webhooks/auctions/update.post.js`

#### 2. `captureCloudTaskError(error, taskPayload, context)`

Use in Cloud Tasks handlers (Dutch autobid, Japanese round handler) to capture errors with task metadata.

```javascript
import { captureCloudTaskError } from '../../../utils/sentry/captureApiError'

export default defineEventHandler(async (event) => {
  try {
    // Cloud Task logic
  } catch (error) {
    await captureCloudTaskError(
      error,
      {
        auctionId: body?.auction?.id,
        type: 'dutch_autobid',
        bidId: bid?.id
      },
      {
        headers: getRequestHeaders(event)
      }
    )
    throw error
  }
})
```

**Tags added:**

- `operation_type: 'cloud_task'`
- `task_type`: `'dutch_autobid'`, `'japanese_round'`
- `auction_id`, `bid_id`
- `critical: 'true'`

**Used in:**

- `server/api/v1/dutch/auto_bid.js`
- `server/api/v1/japanese/round_handler.js`

#### 3. `captureApiError(error, event, context)`

Use in general API endpoints for enhanced business context.

```javascript
import { captureApiError } from '../../../../utils/sentry/captureApiError'

export default defineEventHandler(async (event) => {
  try {
    // API logic
  } catch (error) {
    await captureApiError(error, event, {
      operation: 'training_bot_action',
      auctionId: auctionId,
      auctionType: auction.type,
      critical: true
    })
    throw error
  }
})
```

**Tags added:**

- `operation`: Custom operation name
- `auction_id`, `bid_id`, `auction_type`
- `critical`: `'true'` or `'false'`

**Used in:**

- `server/api/v1/auctions/[auctionId]/training.post.js`

#### 4. `captureAuctionOperation(error, auction, operation, context)`

Use for auction-specific operations with auction state.

```javascript
import { captureAuctionOperation } from '../utils/sentry/captureApiError'

try {
  // Auction operation
} catch (error) {
  await captureAuctionOperation(error, auction, 'extend_overtime', {
    previousEndAt: oldEndAt,
    newEndAt: newEndAt
  })
  throw error
}
```

**Tags added:**

- `operation_type: 'auction_operation'`
- `operation`: Custom operation name
- `auction_id`, `auction_type`
- `critical: 'true'`

### Context Extraction Utilities

#### `extractUserContext(event)`

Automatically extracts user information from Supabase auth session:

```javascript
import { extractUserContext } from '../utils/sentry/extractContext'

const userContext = await extractUserContext(event)
// { id, email, role, company_id }
```

#### `extractAuctionContext(event)`

Automatically extracts auction information from URL params or request body:

```javascript
import { extractAuctionContext } from '../utils/sentry/extractContext'

const auctionContext = await extractAuctionContext(event)
// { id, type, status, usage }
```

These are **called automatically** by the Nitro plugin, but can be used manually if needed.

### Data Sanitization

All data sent to Sentry is automatically sanitized to remove sensitive information:

**`sanitizeData(obj)` - Filters sensitive fields:**

- `password`, `token`, `authorization`, `bearer`
- `api_key`, `apikey`, `secret`, `private_key`
- `credit_card`, `ssn`, `social_security`
- `webhook_bearer_token`, `supabase_admin_key`

**`sanitizeHeaders(headers)` - Filters sensitive headers:**

- `authorization`, `x-vercel-oidc-token`
- `cookie`, `x-supabase-auth`, `x-api-key`

These are **called automatically** by the Nitro plugin for all captured errors.

## Client-Side Manual Error Reporting

You can manually report errors or add custom context in client-side code:

```javascript
import * as Sentry from '@sentry/nuxt'

// Capture an exception
try {
  // Your code
} catch (error) {
  Sentry.captureException(error)
}

// Add custom context
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role
})

// Add breadcrumbs
Sentry.addBreadcrumb({
  category: 'auction',
  message: 'User placed bid',
  level: 'info',
  data: {
    auctionId: auction.id,
    bidAmount: bid.amount
  }
})

// Capture a custom message
Sentry.captureMessage('Critical auction state', 'warning')
```

## Best Practices

### 1. Use Automatic Capture for Most Cases

**The Nitro plugin already captures:**

- All unhandled errors in API endpoints/webhooks
- User context (from Supabase auth)
- Auction context (from URL/body)
- Request metadata (headers, method, path)
- Performance metrics

**You don't need to add error capture code unless you want enhanced context!**

### 2. Add Manual Capture Only for Critical Paths

Use specialized functions (`captureWebhookError`, `captureCloudTaskError`, etc.) when:

- You want to add **extra business context** (bid details, round number, task payload)
- You want to capture **non-fatal errors** (errors you catch and handle)
- You want to add **custom tags** for filtering in Sentry

**Example - Enhanced webhook context:**

```javascript
try {
  await processBid(bid)
} catch (error) {
  // Manual capture adds bid/auction details
  await captureWebhookError(error, event, 'bid_processing', {
    auctionId: bid.auction_id,
    bidId: bid.id,
    bidPrice: bid.price,
    bidType: bid.type
  })
  throw error // Still throw to trigger plugin capture
}
```

### 3. Client-Side: Add User Context

In your auth composable or middleware, add user context for client-side errors:

```javascript
// In composables/useUser.js or middleware/auth.js
import * as Sentry from '@sentry/nuxt'

const user = await supabase.auth.getUser()
if (user.data.user) {
  Sentry.setUser({
    id: user.data.user.id,
    email: user.data.user.email
  })
}
```

### 4. Client-Side: Add Custom Tags for Auctions

```javascript
import * as Sentry from '@sentry/nuxt'

// When viewing an auction
Sentry.setTag('auction_id', auction.id)
Sentry.setTag('auction_type', auction.type)
```

### 5. Client-Side: Capture Critical Business Logic Errors

```javascript
// In critical bidding logic
try {
  const result = await placeBid(auctionId, amount)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      auction_id: auctionId,
      bid_amount: amount,
      critical: true
    }
  })
  throw error
}
```

### 6. Use Breadcrumbs for Tracing Complex Flows

```javascript
// Add breadcrumbs throughout the bidding flow
Sentry.addBreadcrumb({
  category: 'auction',
  message: 'User entered bid amount',
  data: { amount: bidAmount }
})

Sentry.addBreadcrumb({
  category: 'auction',
  message: 'Bid validation passed',
  data: { auctionId }
})
```

## Viewing Errors in Sentry Dashboard

### Sentry Dashboard URLs

- **Issues**: https://sentry.io/organizations/crown-ib/issues/
- **Performance**: https://sentry.io/organizations/crown-ib/performance/
- **Replays**: https://sentry.io/organizations/crown-ib/replays/

### Filtering by Tags

Use tags to filter errors in Sentry:

**Environment:**

- `environment:production` - Production errors
- `environment:preview` - Vercel preview deployments
- `environment:development` - Local development (if DSN set)

**Operation Type:**

- `operation_type:webhook` - All webhook errors
- `operation_type:cloud_task` - Cloud Tasks errors
- `operation_type:auction_operation` - Auction operations
- `operation_type:general_api` - General API errors

**Webhook Type:**

- `webhook_type:bid_insert` - Bid insertion webhook
- `webhook_type:auction_insert` - Auction insertion webhook
- `webhook_type:auction_update` - Auction update webhook

**Task Type:**

- `task_type:dutch_autobid` - Dutch autobid execution
- `task_type:japanese_round` - Japanese round handler

**Critical Status:**

- `is_critical:true` - Critical endpoints only
- `is_webhook:true` - Webhook errors only
- `is_cloud_task:true` - Cloud Task errors only

**Auction Context:**

- `auction_type:dutch` - Dutch auctions only
- `auction_type:japanese` - Japanese auctions only
- `auction_type:reverse` - English (reverse) auctions
- `auction_type:sealed-bid` - Sealed bid auctions

### Filtering by Environment

Use the environment dropdown to filter:

- `production`: Production errors
- `preview`: Vercel preview deployments
- `development`: Local development (if DSN is set)

## Alerts

Configure alerts in Sentry to be notified of:

- New issues
- Spike in error rate
- Performance degradation
- Specific error types (e.g., payment failures, auction ending errors)

## Source Maps

Source maps are automatically uploaded to Sentry during the build process on Vercel, allowing you to see the original source code in error stack traces.

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check that `NUXT_PUBLIC_SENTRY_DSN` is set in Vercel environment variables
2. Verify the DSN is correct
3. Check the browser console for Sentry initialization errors
4. Ensure you're not in development mode without the DSN set

### Too Many Errors

1. Adjust the `ignoreErrors` array in `sentry.client.config.js` and `sentry.server.config.js`
2. Use `beforeSend` to filter specific errors
3. Adjust sampling rates if needed

### Session Replays Not Recording

1. Verify `replaysSessionSampleRate` is set
2. Check browser compatibility (Session Replay requires modern browsers)
3. Ensure the Sentry plan includes Session Replay

## Cost Optimization

- **Sample Rates**: Configured at 10% for production to reduce costs
- **Ignored Errors**: Common non-critical errors are filtered out
- **Replay Sampling**: Only 10% of sessions are recorded, but 100% of error sessions

## Security

- **Privacy**: All text and media are masked in Session Replays
- **Sensitive Data**: Avoid logging passwords, tokens, or PII in custom messages
- **DSN**: The DSN is public and safe to expose in client-side code
