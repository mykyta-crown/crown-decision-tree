# Crown Database Documentation

This document provides a comprehensive overview of the Crown database schema, relationships, policies, and business logic to improve code generation accuracy.

## Table of Contents

1. [Overview](#overview)
2. [Tables Schema](#tables-schema)
3. [Relationships](#relationships)
4. [RLS Policies](#rls-policies)
5. [Triggers & Webhooks](#triggers--webhooks)
6. [Business Logic](#business-logic)
7. [Common Patterns](#common-patterns)

---

## Overview

Crown is an e-auction platform supporting multiple auction types:

- **Dutch Auctions**: Price descends over time, first bidder wins
- **Japanese Auctions**: Price ascends, last remaining bidder wins
- **Standard Auctions**: Traditional ascending bid auctions

The platform uses:

- **Supabase** (PostgreSQL) for data storage
- **Google Cloud Tasks** for scheduled auction events
- **Vercel** for serverless API endpoints

---

## Tables Schema

### Core Auction Tables

#### `auctions`

Main auction table containing all auction configurations.

| Column                     | Type        | Nullable | Default           | Description                                 |
| -------------------------- | ----------- | -------- | ----------------- | ------------------------------------------- |
| id                         | uuid        | NO       | gen_random_uuid() | Primary key                                 |
| created_at                 | timestamptz | NO       | now()             | Creation timestamp                          |
| name                       | text        | YES      |                   | Auction name                                |
| description                | text        | YES      |                   | Auction description                         |
| type                       | text        | YES      |                   | Auction type (see warning below)            |
| status                     | text        | YES      |                   | Current status                              |
| start_at                   | timestamptz | YES      |                   | Scheduled start time                        |
| end_at                     | timestamptz | YES      |                   | Scheduled end time                          |
| duration                   | smallint    | YES      |                   | Duration in minutes                         |
| overtime_range             | float8      | YES      |                   | Round duration for Dutch/Japanese (minutes) |
| max_bid_decr               | float4      | YES      |                   | Dutch: ending price / Japanese: max price   |
| min_bid_decr               | float4      | YES      |                   | Price increment/decrement per round         |
| max_bid_decr_type          | text        | YES      |                   | Type of max bid decrement                   |
| min_bid_decr_type          | text        | YES      |                   | Type of min bid decrement                   |
| baseline                   | bigint      | YES      |                   | Baseline price for comparison               |
| currency                   | text        | YES      |                   | Currency code (EUR, USD, etc.)              |
| timezone                   | text        | YES      |                   | Timezone for display                        |
| log_visibility             | text        | YES      |                   | Who can see bid logs                        |
| buyer_id                   | uuid        | YES      |                   | FK to profiles (auction creator)            |
| company_id                 | uuid        | YES      |                   | FK to companies                             |
| auctions_group_settings_id | uuid        | YES      |                   | FK to auction group                         |
| lot_name                   | text        | YES      |                   | Lot identifier name                         |
| lot_number                 | smallint    | NO       | 1                 | Lot number in group                         |
| published                  | boolean     | NO       | false             | Is auction visible to sellers               |
| deleted                    | boolean     | NO       | false             | Soft delete flag                            |
| test                       | boolean     | YES      | true              | Test/training auction flag                  |
| dutch_prebid_enabled       | boolean     | NO       | false             | Allow Dutch prebids                         |
| last_bid_time              | timestamptz | YES      |                   | Timestamp of last bid                       |
| attachments                | jsonb       | YES      |                   | Attached documents                          |
| commercials_terms          | text        | YES      |                   | Commercial terms text                       |
| general_terms              | text        | YES      |                   | General terms text                          |
| awarding_principles        | text        | YES      |                   | Awarding principles                         |
| usage                      | text        | YES      |                   | Usage description                           |
| rank_trigger               | text        | YES      | 'all'             | When to show ranks                          |
| max_rank_displayed         | float8      | YES      | 100               | Max rank to display (see below)             |
| rank_per_line_item         | boolean     | YES      | false             | Rank per supply item (see below)            |

#### Rank Display Settings

**`max_rank_displayed`**: Controls how many ranks are visible to sellers.

- If set to `2`, sellers ranked 1st and 2nd see their actual rank
- Sellers ranked 3rd or lower see a hidden rank (displayed as `Without_rank.svg`)
- Set to `0` to hide all ranks
- Set to `100` (default) to show all ranks

**`rank_per_line_item`**: When `true`, shows individual ranks per supply/line item in addition to the global rank.

- **Interaction with `max_rank_displayed`**:
  - `max_rank_displayed` applies to both global rank and per-line-item ranks
  - Ranks exceeding `max_rank_displayed` are hidden regardless of `rank_per_line_item` setting

> ⚠️ **CRITICAL WARNING: Auction Type Values**
>
> The `type` field values do **NOT** match UI display names:
>
> | UI Name    | Database `type` value |
> | ---------- | --------------------- |
> | English    | `reverse`             |
> | Sealed Bid | `sealed-bid`          |
> | Dutch      | `dutch`               |
> | Japanese   | `japanese`            |
>
> **NEVER use `auction.type === 'english'`** - this value does not exist!
> Always use `auction.type === 'reverse'` for English auctions.

#### `auctions_group_settings`

Groups multiple auctions together with shared settings.

| Column      | Type        | Nullable | Default           | Description            |
| ----------- | ----------- | -------- | ----------------- | ---------------------- |
| id          | uuid        | NO       | gen_random_uuid() | Primary key            |
| created_at  | timestamptz | NO       | now()             | Creation timestamp     |
| name        | text        | YES      |                   | Group name             |
| description | text        | YES      |                   | Group description      |
| buyer_id    | uuid        | NO       |                   | FK to profiles         |
| timing_rule | text        | NO       | 'serial'          | 'serial' or 'parallel' |

#### `auctions_sellers`

Junction table linking sellers to auctions they can participate in.

| Column          | Type        | Nullable | Default | Description                   |
| --------------- | ----------- | -------- | ------- | ----------------------------- |
| auction_id      | uuid        | NO       |         | FK to auctions                |
| seller_email    | text        | NO       |         | Seller's email (identifier)   |
| created_at      | timestamptz | NO       | now()   | When seller was invited       |
| terms_accepted  | boolean     | YES      | false   | Has accepted terms            |
| seller_phone    | text        | YES      |         | Contact phone                 |
| exit_time       | timestamptz | YES      |         | Japanese: when exited         |
| last_connection | timestamptz | YES      |         | Last activity time            |
| time_per_round  | float8      | YES      |         | Custom round timing (seconds) |

#### `auctions_handicaps`

Handicap options available per auction (quality criteria, certifications, etc.)

| Column       | Type        | Nullable | Default           | Description             |
| ------------ | ----------- | -------- | ----------------- | ----------------------- |
| id           | uuid        | NO       | gen_random_uuid() | Primary key             |
| auction_id   | uuid        | NO       |                   | FK to auctions          |
| seller_email | text        | YES      |                   | If seller-specific      |
| group_name   | text        | YES      |                   | Handicap category       |
| option_name  | text        | YES      |                   | Specific option         |
| amount       | float8      | YES      |                   | Handicap amount         |
| selected     | boolean     | NO       | false             | Is this option selected |
| created_at   | timestamptz | NO       | now()             | Creation timestamp      |

### Bidding Tables

#### `bids`

All bids placed in auctions.

| Column       | Type        | Nullable | Default           | Description                   |
| ------------ | ----------- | -------- | ----------------- | ----------------------------- |
| id           | uuid        | NO       | gen_random_uuid() | Primary key                   |
| created_at   | timestamptz | YES      | now()             | Bid timestamp                 |
| auction_id   | uuid        | YES      |                   | FK to auctions                |
| seller_id    | uuid        | YES      |                   | FK to profiles                |
| seller_email | text        | YES      |                   | Seller email (denormalized)   |
| price        | float8      | YES      |                   | Bid price                     |
| rank         | smallint    | YES      |                   | Current rank (calculated)     |
| type         | text        | YES      |                   | 'bid', 'prebid', 'pre'        |
| cloud_task   | text        | YES      |                   | GCP Cloud Task ID for prebids |

**Important: `cloud_task` behavior by auction type:**

- **Dutch auctions**: Prebids create Cloud Tasks for auto-bid execution
  - `cloud_task` stores full path: `projects/{PROJECT_ID}/locations/{LOCATION}/queues/{QUEUE}/tasks/{TASK_ID}`
  - Tasks execute prebids automatically at the target round time
- **English/Reverse auctions**: Prebids are supported but do NOT create Cloud Tasks
  - No auto-bid feature for English auctions
  - `cloud_task = NULL` is expected and correct for English/Reverse prebids
- **Japanese/Sealed-bid auctions**: Prebids do not use Cloud Tasks
  - `cloud_task = NULL` is normal for these auction types

#### `bid_supplies`

Links bids to specific supply items (for line-item bidding).

| Column     | Type        | Nullable | Default           | Description         |
| ---------- | ----------- | -------- | ----------------- | ------------------- |
| id         | uuid        | NO       | gen_random_uuid() | Primary key         |
| bid_id     | uuid        | YES      |                   | FK to bids          |
| supply_id  | uuid        | YES      |                   | FK to supplies      |
| price      | float8      | YES      |                   | Price for this item |
| created_at | timestamptz | NO       | now()             | Creation timestamp  |

#### `bids_handicaps`

Junction table for handicaps applied to specific bids.

| Column      | Type        | Nullable | Default | Description              |
| ----------- | ----------- | -------- | ------- | ------------------------ |
| bid_id      | uuid        | NO       |         | FK to bids               |
| handicap_id | uuid        | NO       |         | FK to auctions_handicaps |
| created_at  | timestamptz | NO       | now()   | Creation timestamp       |

### Supply Tables

#### `supplies`

Line items within an auction.

| Column     | Type        | Nullable | Default           | Description        |
| ---------- | ----------- | -------- | ----------------- | ------------------ |
| id         | uuid        | NO       | gen_random_uuid() | Primary key        |
| auction_id | uuid        | YES      |                   | FK to auctions     |
| name       | text        | YES      |                   | Item name          |
| quantity   | integer     | YES      |                   | Quantity           |
| unit       | text        | YES      |                   | Unit of measure    |
| index      | smallint    | YES      |                   | Display order      |
| created_at | timestamptz | NO       | now()             | Creation timestamp |

#### `supplies_sellers`

Seller-specific supply configurations (ceiling prices, handicaps).

| Column         | Type        | Nullable | Default | Description             |
| -------------- | ----------- | -------- | ------- | ----------------------- |
| supply_id      | uuid        | NO       |         | FK to supplies          |
| seller_email   | text        | NO       |         | Seller identifier       |
| ceiling        | float8      | YES      |         | Max price ceiling       |
| additive       | float8      | NO       | 0       | Additive handicap       |
| multiplicative | float8      | NO       | 1       | Multiplicative handicap |
| multiplier     | smallint    | YES      |         | Quantity multiplier     |
| test           | boolean     | YES      |         | Test flag               |
| created_at     | timestamptz | NO       | now()   | Creation timestamp      |

### User & Company Tables

#### Authentication Architecture: `auth.users` → `profiles`

Crown uses a **two-table authentication system**:

**1. `auth.users` (Supabase Auth schema)**

- Managed by Supabase Auth service
- Stores authentication credentials (email, password hash)
- Handles email verification, password reset, sessions
- **Not directly accessible** via RLS policies

**2. `public.profiles` (Application schema)**

- Extends `auth.users` with business data
- Stores user profile (name, company, role, etc.)
- `profiles.id` = foreign key to `auth.users.id`
- Accessible via RLS policies

**Synchronization Flow:**

When a user signs up via Supabase Auth:

1. Account created in `auth.users`
2. Database trigger `insert_users` fires on `auth.users` INSERT
3. Trigger calls webhook: `POST https://app.crown-procurement.com/api/v1/webhooks/users/insert`
4. Webhook creates matching profile in `public.profiles`:
   ```javascript
   // server/api/v1/webhooks/users/insert.post.js
   await supabase.from('profiles').insert([
     {
       id: insertedUser.id,
       email: insertedUser.email
     }
   ])
   ```

**Important Notes:**

- Profile creation is **asynchronous** (webhook-based)
- If webhook fails, user exists in `auth.users` but not in `profiles`
- Application code should handle missing profiles gracefully
- Manual profile creation may be needed in rare cases (webhook failures)

**Trigger Definition:**

```sql
CREATE TRIGGER insert_users
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://app.crown-procurement.com/api/v1/webhooks/users/insert',
  'POST',
  '{"Content-type":"application/json","authorization":"Bearer ..."}',
  '{}',
  '5000'
);
```

#### `profiles`

User profiles (extends Supabase auth.users).

| Column          | Type        | Nullable | Default | Description                               |
| --------------- | ----------- | -------- | ------- | ----------------------------------------- |
| id              | uuid        | NO       |         | PK, matches auth.users.id                 |
| email           | text        | NO       |         | User email                                |
| first_name      | text        | YES      |         | First name                                |
| last_name       | text        | YES      |         | Last name                                 |
| phone           | text        | YES      |         | Phone number                              |
| position        | text        | YES      |         | Job position                              |
| company_id      | uuid        | YES      |         | FK to companies                           |
| role            | text        | YES      |         | 'admin', 'buyer', 'seller', 'super_buyer' |
| admin           | boolean     | NO       | false   | Is platform admin                         |
| is_active       | boolean     | NO       | false   | Account active                            |
| is_deleted      | boolean     | NO       | false   | Soft delete                               |
| onboarding_step | smallint    | YES      | 0       | Onboarding progress                       |
| onboarding_date | timestamptz | YES      |         | Onboarding completion                     |
| created_at      | timestamptz | NO       | now()   | Creation timestamp                        |

#### `companies`

Company/organization records.

| Column     | Type        | Nullable | Default           | Description                    |
| ---------- | ----------- | -------- | ----------------- | ------------------------------ |
| id         | uuid        | NO       | gen_random_uuid() | Primary key                    |
| name       | text        | YES      |                   | Company name                   |
| phone      | text        | YES      |                   | Company phone                  |
| address    | text        | YES      |                   | Address                        |
| country    | text        | YES      |                   | Country                        |
| legal_id   | text        | YES      |                   | Legal identifier (SIRET, etc.) |
| created_at | timestamptz | NO       | now()             | Creation timestamp             |

#### `trainings`

Tracks seller training completion per auction group.

| Column                     | Type        | Nullable | Default | Description               |
| -------------------------- | ----------- | -------- | ------- | ------------------------- |
| auctions_group_settings_id | uuid        | NO       |         | FK to auction group       |
| seller_email               | varchar     | NO       |         | Seller identifier         |
| trainings_losing           | timestamptz | YES      |         | Completed losing scenario |
| trainings_prebid_win       | timestamptz | YES      |         | Completed prebid win      |
| trainings_live_win         | timestamptz | YES      |         | Completed live win        |
| trainings_second_losing    | timestamptz | YES      |         | Completed second losing   |
| created_at                 | timestamptz | NO       | now()   | Creation timestamp        |

#### `users_auctions_status`

User-specific auction status (favorites, archives).

| Column      | Type    | Nullable | Default | Description       |
| ----------- | ------- | -------- | ------- | ----------------- |
| auction_id  | uuid    | NO       |         | FK to auctions    |
| user_id     | uuid    | NO       |         | FK to profiles    |
| is_archived | boolean | NO       | false   | Archived by user  |
| is_favorite | boolean | NO       | false   | Favorited by user |

### GPT/AI Tables

#### `gpts`

Custom GPT configurations.

| Column                | Type        | Nullable | Default           | Description                 |
| --------------------- | ----------- | -------- | ----------------- | --------------------------- |
| id                    | uuid        | NO       | gen_random_uuid() | Primary key                 |
| name                  | text        | NO       |                   | GPT name                    |
| description           | text        | YES      |                   | Description                 |
| instructions          | text        | NO       |                   | System prompt               |
| conversation_starters | text[]      | YES      | []                | Starter prompts             |
| knowledge_files       | jsonb       | YES      | []                | File references             |
| recommended_model     | text        | NO       |                   | AI model to use             |
| provider              | text        | NO       |                   | 'openai', 'anthropic', etc. |
| max_tokens            | integer     | YES      |                   | Max response tokens         |
| welcome_message       | text        | YES      |                   | Initial greeting            |
| icon                  | text        | YES      |                   | Icon URL                    |
| created_by            | uuid        | YES      |                   | FK to profiles              |
| created_at            | timestamptz | YES      | now()             | Creation timestamp          |
| updated_at            | timestamptz | YES      | now()             | Last update                 |

#### `gpt_access`

Controls access to GPTs by user or company.

| Column     | Type        | Nullable | Default           | Description                      |
| ---------- | ----------- | -------- | ----------------- | -------------------------------- |
| id         | uuid        | NO       | gen_random_uuid() | Primary key                      |
| gpt_id     | uuid        | NO       |                   | FK to gpts                       |
| user_id    | uuid        | YES      |                   | FK to profiles (user access)     |
| company_id | uuid        | YES      |                   | FK to companies (company access) |
| created_at | timestamptz | YES      | now()             | Creation timestamp               |

#### `gpt_knowledge_files`

Knowledge base files for GPTs.

| Column           | Type        | Nullable | Default           | Description        |
| ---------------- | ----------- | -------- | ----------------- | ------------------ |
| id               | uuid        | NO       | gen_random_uuid() | Primary key        |
| gpt_id           | uuid        | NO       |                   | FK to gpts         |
| filename         | text        | NO       |                   | File name          |
| file_url         | text        | NO       |                   | Storage URL        |
| file_type        | text        | NO       |                   | MIME type          |
| file_size        | bigint      | NO       |                   | Size in bytes      |
| extracted_text   | text        | YES      |                   | Extracted content  |
| word_count       | integer     | YES      |                   | Word count         |
| estimated_tokens | integer     | YES      |                   | Token estimate     |
| uploaded_by      | uuid        | YES      |                   | FK to profiles     |
| created_at       | timestamptz | YES      | now()             | Creation timestamp |
| updated_at       | timestamptz | YES      | now()             | Last update        |

#### `conversations`

Chat conversations with GPTs.

| Column     | Type        | Nullable | Default            | Description           |
| ---------- | ----------- | -------- | ------------------ | --------------------- |
| id         | uuid        | NO       | gen_random_uuid()  | Primary key           |
| gpt_id     | uuid        | NO       |                    | FK to gpts            |
| user_id    | uuid        | NO       |                    | FK to profiles        |
| title      | text        | YES      | 'New conversation' | Conversation title    |
| deleted_at | timestamptz | YES      |                    | Soft delete timestamp |
| created_at | timestamptz | YES      | now()              | Creation timestamp    |
| updated_at | timestamptz | YES      | now()              | Last update           |

#### `messages`

Messages within conversations.

| Column          | Type        | Nullable | Default           | Description                     |
| --------------- | ----------- | -------- | ----------------- | ------------------------------- |
| id              | uuid        | NO       | gen_random_uuid() | Primary key                     |
| conversation_id | uuid        | NO       |                   | FK to conversations             |
| role            | text        | NO       |                   | 'user', 'assistant', 'system'   |
| content         | text        | NO       | ''                | Message content                 |
| status          | text        | YES      | 'completed'       | 'pending', 'completed', 'error' |
| tokens_used     | integer     | YES      | 0                 | Tokens consumed                 |
| created_at      | timestamptz | YES      | now()             | Creation timestamp              |
| updated_at      | timestamptz | YES      | now()             | Last update                     |

#### `documents` / `conversation_documents`

Documents attached to conversations.

| Column           | Type        | Nullable | Default           | Description         |
| ---------------- | ----------- | -------- | ----------------- | ------------------- |
| id               | uuid        | NO       | gen_random_uuid() | Primary key         |
| conversation_id  | uuid        | NO       |                   | FK to conversations |
| uploaded_by      | uuid        | NO       |                   | FK to profiles      |
| filename         | text        | NO       |                   | File name           |
| file_url         | text        | NO       |                   | Storage URL         |
| file_type        | text        | NO       |                   | MIME type           |
| file_size        | integer     | NO       |                   | Size in bytes       |
| extracted_text   | text        | YES      |                   | Extracted content   |
| word_count       | integer     | YES      | 0                 | Word count          |
| estimated_tokens | integer     | YES      | 0                 | Token estimate      |
| created_at       | timestamptz | YES      | now()             | Creation timestamp  |
| updated_at       | timestamptz | YES      | now()             | Last update         |

#### `message_documents`

Junction table linking messages to documents.

| Column      | Type        | Nullable | Default           | Description        |
| ----------- | ----------- | -------- | ----------------- | ------------------ |
| id          | uuid        | NO       | gen_random_uuid() | Primary key        |
| message_id  | uuid        | NO       |                   | FK to messages     |
| document_id | uuid        | NO       |                   | FK to documents    |
| created_at  | timestamptz | YES      | now()             | Creation timestamp |

#### `user_credits`

Token/credit balance per user.

| Column            | Type        | Nullable | Default           | Description       |
| ----------------- | ----------- | -------- | ----------------- | ----------------- |
| id                | uuid        | NO       | gen_random_uuid() | Primary key       |
| user_id           | uuid        | NO       |                   | FK to profiles    |
| credits_remaining | integer     | YES      | 0                 | Available credits |
| credits_total     | integer     | YES      | 0                 | Total purchased   |
| updated_at        | timestamptz | YES      | now()             | Last update       |

---

## Relationships

### Entity Relationship Diagram (Text)

```
companies 1--* profiles
profiles 1--* auctions (buyer_id)
profiles 1--* bids (seller_id)
profiles 1--* auctions_group_settings (buyer_id)

auctions_group_settings 1--* auctions
auctions 1--* auctions_sellers
auctions 1--* auctions_handicaps
auctions 1--* supplies
auctions 1--* bids
auctions 1--* users_auctions_status

supplies 1--* supplies_sellers
supplies 1--* bid_supplies

bids 1--* bid_supplies
bids 1--* bids_handicaps
auctions_handicaps 1--* bids_handicaps

gpts 1--* gpt_access
gpts 1--* gpt_knowledge_files
gpts 1--* conversations
conversations 1--* messages
conversations 1--* documents
conversations 1--* conversation_documents
messages 1--* message_documents
documents 1--* message_documents

profiles 1--1 user_credits
```

### Foreign Key Constraints

| Source Table            | Source Column              | Target Table            | Target Column |
| ----------------------- | -------------------------- | ----------------------- | ------------- |
| auctions                | auctions_group_settings_id | auctions_group_settings | id            |
| auctions                | buyer_id                   | profiles                | id            |
| auctions                | company_id                 | companies               | id            |
| auctions_group_settings | buyer_id                   | profiles                | id            |
| auctions_handicaps      | auction_id                 | auctions                | id            |
| auctions_sellers        | auction_id                 | auctions                | id            |
| bid_supplies            | bid_id                     | bids                    | id            |
| bid_supplies            | supply_id                  | supplies                | id            |
| bids                    | auction_id                 | auctions                | id            |
| bids                    | seller_id                  | profiles                | id            |
| bids_handicaps          | bid_id                     | bids                    | id            |
| bids_handicaps          | handicap_id                | auctions_handicaps      | id            |
| conversation_documents  | conversation_id            | conversations           | id            |
| conversation_documents  | uploaded_by                | profiles                | id            |
| conversations           | gpt_id                     | gpts                    | id            |
| conversations           | user_id                    | profiles                | id            |
| documents               | conversation_id            | conversations           | id            |
| documents               | uploaded_by                | profiles                | id            |
| gpt_access              | company_id                 | companies               | id            |
| gpt_access              | gpt_id                     | gpts                    | id            |
| gpt_access              | user_id                    | profiles                | id            |
| gpt_knowledge_files     | gpt_id                     | gpts                    | id            |
| gpt_knowledge_files     | uploaded_by                | profiles                | id            |
| gpts                    | created_by                 | profiles                | id            |
| message_documents       | document_id                | documents               | id            |
| message_documents       | message_id                 | messages                | id            |
| messages                | conversation_id            | conversations           | id            |
| profiles                | company_id                 | companies               | id            |
| supplies                | auction_id                 | auctions                | id            |
| supplies_sellers        | supply_id                  | supplies                | id            |
| trainings               | auctions_group_settings_id | auctions_group_settings | id            |
| user_credits            | user_id                    | profiles                | id            |
| users_auctions_status   | auction_id                 | auctions                | id            |
| users_auctions_status   | user_id                    | profiles                | id            |

---

## RLS Policies

### Policy Helper Functions (private schema)

These functions are used across policies:

- `private.is_admin()` - Returns true if current user has admin role
- `private.is_buyer_v2(auction_id)` - Returns true if current user is the buyer of the auction
- `private.is_supplier(auction_id)` - Returns true if current user is a seller on the auction
- `private.is_super_buyer_of_same_company(user_id)` - Returns true if current user is super_buyer in same company
- `private.profiles_check_v2(id, email)` - Profile visibility check

### Auctions Policies

| Policy                            | Command | Logic                                             |
| --------------------------------- | ------- | ------------------------------------------------- |
| Enable select for auction sellers | SELECT  | Published AND is_supplier OR is_buyer OR is_admin |
| Buyer and Admin can insert        | INSERT  | is_buyer_v2 OR is_admin                           |
| Buyer and Admin can update        | UPDATE  | is_buyer_v2 OR is_admin                           |
| Admin and Buyer Can Delete        | DELETE  | is_buyer_v2 OR is_admin                           |

### Bids Policies

| Policy                  | Command | Logic                                       |
| ----------------------- | ------- | ------------------------------------------- |
| Read                    | SELECT  | Own bid (seller_id) OR is_buyer OR is_admin |
| Enable insert for users | INSERT  | is_supplier OR is_admin                     |
| Admin Can Delete Bids   | DELETE  | is_admin only                               |

### Profiles Policies

| Policy                       | Command              | Logic                                               |
| ---------------------------- | -------------------- | --------------------------------------------------- |
| Profile Check                | SELECT               | is_super_buyer_of_same_company OR profiles_check_v2 |
| Users can update own profile | UPDATE               | auth.uid() = id                                     |
| Admin can edit profiles      | UPDATE               | is_admin                                            |
| Can't set admin true         | UPDATE (RESTRICTIVE) | is_admin OR admin unchanged                         |

### Supplies & Supplies_Sellers Policies

| Policy                  | Command       | Logic                               |
| ----------------------- | ------------- | ----------------------------------- |
| Enable read access      | SELECT        | is_supplier OR is_buyer OR is_admin |
| Buyer can create/update | INSERT/UPDATE | is_buyer_v2                         |
| Admin delete            | DELETE        | is_admin                            |

### GPT-Related Policies

| Policy                                            | Command | Logic                                  |
| ------------------------------------------------- | ------- | -------------------------------------- |
| gpts: Users can view assigned                     | SELECT  | Has gpt_access entry (user or company) |
| gpts: Admins can do everything                    | ALL     | role = 'admin'                         |
| conversations: Users can manage their own         | ALL     | user_id = auth.uid()                   |
| messages: Users can manage in their conversations | ALL     | Conversation belongs to user           |

---

## Triggers & Webhooks

**⚠️ IMPORTANT**: Webhooks are configured via **Supabase Dashboard**, NOT via database migrations.

See `WEBHOOK_SETUP_GUIDE.md` for complete setup instructions.

### Webhook Configuration

Webhooks are managed in Supabase Dashboard → Database → Database Webhooks:

| Webhook Name   | Table           | Event  | Endpoint                           | Purpose                                 |
| -------------- | --------------- | ------ | ---------------------------------- | --------------------------------------- |
| insert_bid     | public.bids     | INSERT | `/api/v1/webhooks/bids/insert`     | Schedule Dutch prebids in Cloud Tasks   |
| insert_auction | public.auctions | INSERT | `/api/v1/webhooks/auctions/insert` | Schedule Japanese rounds in Cloud Tasks |
| update_auction | public.auctions | UPDATE | `/api/v1/webhooks/auctions/update` | Handle auction state changes            |
| insert_users   | auth.users      | INSERT | `/api/v1/webhooks/users/insert`    | Create user profiles automatically      |

**Payload Format**: All webhooks must send `{"record": {{ record }}}` (for INSERT) or `{"record": {{ record }}, "old_record": {{ old_record }}}` (for UPDATE).

**Authentication**: All webhook endpoints require `Authorization: Bearer <WEBHOOK_BEARER_TOKEN>` header.

### Auction Triggers

| Trigger          | Event                | Action                                 |
| ---------------- | -------------------- | -------------------------------------- |
| auctions_changes | INSERT/UPDATE/DELETE | Executes `auctions_changes()` function |

### Bid Triggers

| Trigger                     | Event                | Action                                          |
| --------------------------- | -------------------- | ----------------------------------------------- |
| bids_changes                | INSERT/UPDATE/DELETE | Executes `bids_changes()` function              |
| update_last_bid_time        | INSERT               | Updates `auctions.last_bid_time`                |
| update_bid_rank_on_supplies | INSERT               | Recalculates bid ranks on bid_supplies insert   |
| update_bid_rank_on_handicap | INSERT               | Recalculates bid ranks on bids_handicaps insert |

### GPT Triggers

| Trigger                       | Event                | Action                             |
| ----------------------------- | -------------------- | ---------------------------------- |
| sync*gpt_knowledge_files*\*   | INSERT/UPDATE/DELETE | Syncs `gpts.knowledge_files` JSONB |
| update\_\*\_updated_at        | UPDATE               | Sets `updated_at = now()`          |
| update_conversation_timestamp | INSERT/UPDATE        | Updates conversation `updated_at`  |

### Handicap Triggers

| Trigger                           | Event           | Action                                                             |
| --------------------------------- | --------------- | ------------------------------------------------------------------ |
| auctions_handicaps_update_trigger | UPDATE (BEFORE) | Validates handicap updates via `check_auctions_handicaps_update()` |

---

## Business Logic

### Dutch Auction Flow

1. **Auction Configuration**:
   - `duration`: Total auction time in minutes
   - `overtime_range`: Round duration in minutes
   - `max_bid_decr`: Ending price (highest)
   - `min_bid_decr`: Price increment per round

2. **Price Calculation**:

   ```javascript
   maxRounds = Math.ceil(duration / overtime_range) - 1
   startingPrice = max_bid_decr - maxRounds * min_bid_decr
   currentPrice = startingPrice + completedRounds * min_bid_decr
   ```

3. **Prebid Scheduling**:
   - Sellers can place prebids before auction starts
   - Each prebid creates a Cloud Task scheduled for the exact round
   - Task calls `/api/v1/dutch/auto_bid` 5 seconds before target time
   - `bids.cloud_task` stores the full GCP task path

4. **Cloud Task Configuration**:
   ```javascript
   PROJECT: 'crown-476614'
   LOCATION: 'europe-west1'
   QUEUE: 'BidWatchQueue'
   ENDPOINT: '/api/v1/dutch/auto_bid'
   ```

### Japanese Auction Flow

1. **Round-based Progression**:
   - Price starts at `min_bid_decr` and increases each round
   - Sellers must confirm participation each round or exit
   - `auctions_sellers.exit_time` records when seller exits
   - Last remaining seller wins

2. **Cloud Task Configuration**:
   ```javascript
   QUEUE: 'JaponeseRoundHandler'
   ENDPOINT: '/api/v1/japanese/round_handler'
   ```

### Seller Identification

Sellers are identified by **email** (not user ID) throughout the system:

- `auctions_sellers.seller_email`
- `supplies_sellers.seller_email`
- `auctions_handicaps.seller_email`
- `bids.seller_email` (denormalized)
- `trainings.seller_email`

This allows inviting sellers before they create accounts.

### Handicap System

Handicaps adjust displayed rankings without changing actual prices:

1. Buyer defines handicap options per auction (`auctions_handicaps`)
2. Sellers select applicable handicaps during bidding (`bids_handicaps`)
3. Ranks are recalculated including handicap adjustments

### Training System

Before participating in real auctions, sellers complete training scenarios:

- `trainings_losing` - Experience losing scenario
- `trainings_prebid_win` - Win via prebid
- `trainings_live_win` - Win via live bid
- `trainings_second_losing` - Another losing scenario

---

## Common Patterns

### Handling Missing Profiles

Since profile creation is asynchronous (webhook-based), always handle cases where a user exists in `auth.users` but not yet in `profiles`:

```javascript
// Server-side: Check and create profile if missing
const user = await supabase.auth.getUser()
if (!user) throw new Error('Not authenticated')

const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

if (!profile) {
  // Profile missing - create it manually
  const { data: newProfile } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      is_active: true
    })
    .select()
    .single()

  console.warn(`Profile auto-created for user ${user.email}`)
  return newProfile
}

return profile
```

```javascript
// Client-side: Gracefully handle missing profile
const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle() // Returns null instead of throwing

if (!profile) {
  // Show loading state or retry
  console.warn('Profile not yet created, retrying...')
  await new Promise((resolve) => setTimeout(resolve, 2000))
  // Retry logic...
}
```

### Querying Auctions with Related Data

```javascript
// Get auction with sellers and bids
const { data } = await supabase
  .from('auctions')
  .select(
    `
    *,
    auctions_sellers(*),
    bids(*, profiles(email)),
    supplies(*, supplies_sellers(*))
  `
  )
  .eq('id', auctionId)
  .single()
```

### Checking User Permissions

```javascript
// Check if user can access auction
const { data: auction } = await supabase.from('auctions').select('id').eq('id', auctionId).single()
// RLS will return null if no access
```

### Creating a Bid

```javascript
const { data: bid, error } = await supabase
  .from('bids')
  .insert({
    auction_id: auctionId,
    seller_id: userId,
    seller_email: userEmail,
    price: bidPrice,
    type: 'bid' // or 'prebid' for Dutch
  })
  .select()
  .single()
```

### Scheduling a Dutch Prebid

```javascript
// In server code
const timeToBid = dutchHelpers.calculateTimeToBid(auction, bid, auctionSeller)
const scheduleTime = timeToBid - 5 // 5 second buffer

const result = await enqueueTask(bid, scheduleTime, 'DUTCH', oidcToken)

// Store task reference
await supabase.from('bids').update({ cloud_task: result.data.taskName }).eq('id', bid.id)
```

### GPT Access Check

```javascript
// Check if user has access to a GPT
const { data: access } = await supabase
  .from('gpt_access')
  .select('id')
  .eq('gpt_id', gptId)
  .or(`user_id.eq.${userId},company_id.eq.${companyId}`)
  .single()
```

---

## Views

### `supplies_sellers_view`

Simplified view of supplies_sellers (excludes test/handicap columns).

### `user_suppliers_view`

Maps users to their supplier emails.

---

## Notes for Code Generation

1. **Always use email for seller identification** in auction contexts
2. **Check RLS policies** - most tables restrict access by role
3. **Bids are immutable** - only admins can delete
4. **Dutch prebids require Cloud Task management** - always update `cloud_task` column
5. **Use `deleted` flag** for auctions instead of hard delete
6. **Timestamps are always UTC** (timestamptz)
7. **Price values are floats** - use appropriate precision handling
8. **GPT access** can be granted to users OR companies
9. **Webhook endpoints** expect POST with authorization header
