# Webhook Setup Guide - Supabase Dashboard

This guide explains how to configure webhooks via Supabase Dashboard for both PROD and DEV environments.

## ⚠️ Important: Automatic Payload

**Supabase automatically generates and sends the webhook payload** with this structure:

```typescript
{
  type: 'INSERT' | 'UPDATE' | 'DELETE',
  table: string,
  schema: string,
  record: { /* new row data */ },      // null for DELETE
  old_record: { /* old row data */ }   // null for INSERT, populated for UPDATE
}
```

**You do NOT need to configure the payload manually** - Supabase handles it automatically. Our API endpoints already expect `body.record`, which is exactly what Supabase sends.

## Prerequisites

1. Migration `20251210090000_webhook_system_setup.sql` has been applied to both DEV and PROD ✅
2. You have access to Supabase Dashboard for both projects
3. Your API endpoints are deployed and accessible:
   - **PROD**: `https://app.crown-procurement.com/api/v1/webhooks/...`
   - **DEV**: `https://dev.crown.ovh/api/v1/webhooks/...`

## Environment URLs

| Environment | Supabase Project       | Dashboard URL                                                              | API Base URL                        |
| ----------- | ---------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| **PROD**    | `jgwbqdpxygwsnswtnrxf` | https://supabase.com/dashboard/project/jgwbqdpxygwsnswtnrxf/database/hooks | `https://app.crown-procurement.com` |
| **DEV**     | `qzxnlhzlilysiklmbspn` | https://supabase.com/dashboard/project/qzxnlhzlilysiklmbspn/database/hooks | `https://dev.crown.ovh`             |

## Step 1: Generate Webhook Bearer Token

The webhook endpoints require authentication via Bearer token.

```bash
# Generate a secure random token
openssl rand -base64 32

# Example output: 3K8vN2kL9mP5qR7tU1wX4yZ6aB8cD0eF2gH4iJ6kL8mN0pQ2rS4tU6vW8xY0zA2b

# Add it to Vercel (select "Development" for DEV, "Production" for PROD)
vercel env add WEBHOOK_BEARER_TOKEN

# Or via Vercel Dashboard: Project Settings → Environment Variables
```

**Important**:

- Use **different tokens** for DEV and PROD
- Keep the token secure - never commit it to git
- The same token must be used in both Vercel and Supabase webhook headers

## Step 2: Configure Webhooks in Supabase Dashboard

### For DEV Environment

1. **Go to DEV Dashboard**: https://supabase.com/dashboard/project/qzxnlhzlilysiklmbspn/database/hooks

2. **Enable Webhooks** (if not already enabled):
   - Click `Enable Webhooks` button

3. **Create 4 webhooks** (one at a time):

---

### Webhook 1: `insert_bid` (Dutch Prebid Scheduling)

**Purpose**: Schedules prebids in Google Cloud Tasks for Dutch auctions

**Configuration**:

- **Name**: `insert_bid`
- **Table**: `public.bids`
- **Events**: ☑️ Insert (uncheck Update and Delete)
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://dev.crown.ovh/api/v1/webhooks/bids/insert`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <YOUR_DEV_TOKEN>
  ```
- **Timeout**: 5000ms (5 seconds)
- **HTTP Params**: Leave empty or use default - payload is automatic!

---

### Webhook 2: `insert_auction` (Japanese Round Scheduling)

**Purpose**: Schedules rounds in Google Cloud Tasks for Japanese auctions

**Configuration**:

- **Name**: `insert_auction`
- **Table**: `public.auctions`
- **Events**: ☑️ Insert
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://dev.crown.ovh/api/v1/webhooks/auctions/insert`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <YOUR_DEV_TOKEN>
  ```
- **Timeout**: 5000ms

---

### Webhook 3: `update_auction` (Auction State Changes)

**Purpose**: Handles auction updates including timing changes

**Configuration**:

- **Name**: `update_auction`
- **Table**: `public.auctions`
- **Events**: ☑️ Update (uncheck Insert and Delete)
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://dev.crown.ovh/api/v1/webhooks/auctions/update`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <YOUR_DEV_TOKEN>
  ```
- **Timeout**: 5000ms

**Note**: For UPDATE events, Supabase automatically sends both `record` (new values) and `old_record` (previous values).

---

### Webhook 4: `insert_users` (Profile Creation)

**Purpose**: Creates user profiles automatically when new users register

**Configuration**:

- **Name**: `insert_users`
- **Table**: `auth.users` ⚠️ **Important**: auth schema, not public!
- **Events**: ☑️ Insert
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://dev.crown.ovh/api/v1/webhooks/users/insert`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <YOUR_DEV_TOKEN>
  ```
- **Timeout**: 5000ms

---

## Step 3: Repeat for PROD Environment

Follow the exact same steps for PROD, but with these changes:

1. **Go to PROD Dashboard**: https://supabase.com/dashboard/project/jgwbqdpxygwsnswtnrxf/database/hooks

2. **Use PROD URLs**:
   - Replace `https://dev.crown.ovh` with `https://app.crown-procurement.com`

3. **Use PROD Token**:
   - Generate a **different** token for PROD
   - Add it to Vercel with "Production" environment selected

## Step 4: Verify Configuration

### Via Dashboard

In Supabase Dashboard → Database → Database Webhooks, verify:

- [ ] `insert_bid` - Enabled, points to `/api/v1/webhooks/bids/insert`
- [ ] `insert_auction` - Enabled, points to `/api/v1/webhooks/auctions/insert`
- [ ] `update_auction` - Enabled, points to `/api/v1/webhooks/auctions/update`
- [ ] `insert_users` - Enabled, points to `/api/v1/webhooks/users/insert`

### Test with Script

```bash
# Test insert_bid webhook (creates a test prebid)
node scripts/test_webhook_insert_bid.js

# Expected output: "✅ SUCCESS! Cloud Task was created"

# Check Vercel logs
vercel logs --follow

# Look for: [WEBHOOK BID INSERT] with bid data
```

### Manual Test

1. Create a Dutch auction via UI
2. Create a prebid with a future price trigger
3. Check logs in Vercel: should see `[WEBHOOK BID INSERT]`
4. Verify Cloud Task created: `gcloud tasks list --queue=BidWatchQueue`
5. Check `bids.cloud_task` column is populated in database

## Troubleshooting

### Issue: "Unauthorized" (401) in webhook logs

**Cause**: Bearer token mismatch between Supabase webhook config and Vercel environment variable.

**Solution**:

```bash
# Check Vercel env var
vercel env ls | grep WEBHOOK_BEARER_TOKEN

# Verify it matches the token in Supabase webhook header
# Redeploy if needed
vercel --prod  # for production
```

### Issue: Webhook not firing at all

**Cause**: Webhooks not enabled or trigger conditions not met.

**Solution**:

1. Check Supabase Dashboard → Database Webhooks → Ensure webhooks are "Enabled"
2. Check table/event match: INSERT on `bids` should trigger `insert_bid`
3. Check Supabase logs: Dashboard → Logs → Postgres Logs
4. Look for errors like "webhook timeout" or "connection refused"

### Issue: "body.record is undefined" in API logs

**Cause**: This should NOT happen with Supabase webhooks (payload is automatic).

**Solution**:

1. Verify the webhook is created via Supabase Dashboard (not custom SQL)
2. Check Supabase sends payload automatically
3. Check API endpoint logs to see exact payload received:
   ```javascript
   console.log('Webhook payload:', JSON.stringify(body, null, 2))
   ```

### Issue: "Webhook authentication not configured" error

**Cause**: `WEBHOOK_BEARER_TOKEN` environment variable not set in Vercel.

**Solution**:

```bash
# Generate token
TOKEN=$(openssl rand -base64 32)

# Add to Vercel (select correct environment)
vercel env add WEBHOOK_BEARER_TOKEN

# Redeploy
vercel --prod  # for production
```

### Issue: Webhook timeout (5 seconds exceeded)

**Cause**: API endpoint taking too long to respond.

**Solution**:

1. Check Vercel logs for slow operations
2. Optimize API endpoint (async operations, database queries)
3. Increase timeout in Supabase webhook config (max 25 seconds)

## Expected Payload Examples

### INSERT Event (insert_bid, insert_auction, insert_users)

```json
{
  "type": "INSERT",
  "table": "bids",
  "schema": "public",
  "record": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "auction_id": "789e4567-e89b-12d3-a456-426614174111",
    "seller_email": "seller@example.com",
    "type": "prebid",
    "price": 100.5,
    "created_at": "2025-12-13T10:30:00Z"
  },
  "old_record": null
}
```

### UPDATE Event (update_auction)

```json
{
  "type": "UPDATE",
  "table": "auctions",
  "schema": "public",
  "record": {
    "id": "789e4567-e89b-12d3-a456-426614174111",
    "status": "active",
    "updated_at": "2025-12-13T11:00:00Z"
  },
  "old_record": {
    "id": "789e4567-e89b-12d3-a456-426614174111",
    "status": "pending",
    "updated_at": "2025-12-13T10:00:00Z"
  }
}
```

## API Endpoint Compatibility

Our API endpoints are already compatible with Supabase's automatic payload:

```javascript
// server/api/v1/webhooks/bids/insert.post.js
const body = await readBody(event)

// Supabase sends: { type, table, schema, record, old_record }
const bid = body.record // ✅ Works automatically!

// No payload configuration needed in Supabase Dashboard
```

## Security Notes

1. **Always use HTTPS** for webhook URLs
2. **Keep bearer tokens secret** - never commit them to git
3. **Rotate tokens regularly** - update both Supabase and Vercel when rotating
4. **Use different tokens for DEV and PROD**
5. **Monitor webhook logs** for unauthorized access attempts

## Reference

- **Supabase Webhooks Docs**: https://supabase.com/docs/guides/database/webhooks
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Our API Endpoints**: `server/api/v1/webhooks/*/`

## Summary

After completing this guide, you should have:

- ✅ 4 webhooks configured in both PROD and DEV Supabase dashboards
- ✅ Bearer token authentication set up in Vercel
- ✅ Verified webhooks are firing and reaching your API
- ✅ Tested end-to-end flows (Dutch prebids, Japanese rounds)
- ✅ Understanding that **payload is automatic** - no manual configuration needed!

**The webhook system is now production-ready and will work reliably across environments.**

---

**Last Updated**: 2025-12-13
**Automatic Payload**: ✅ Yes - Supabase generates it automatically
**Manual Payload Config**: ❌ Not needed - remove old `{{ record }}` syntax from any existing webhooks
