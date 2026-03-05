# Browser Testing Guide

This document provides guidance for browser-based testing and automation, including authentication flows and test credentials.

> [!IMPORTANT]
> **Living Document Policy for AI Assistants**
> This documentation is intended to be a living document. If you are an AI assistant using this guide and you find yourself blocked or confused because the documentation is not explicit enough, you are **required** to update this document with your findings. This ensures that future sessions can bypass these hurdles and proceed more efficiently.

## Table of Contents

1. [Playwright E2E Testing](#playwright-e2e-testing) ⭐ NEW
2. [Database Seeders Pattern](#database-seeders-pattern-) ⭐ NEW
3. [URLs](#urls)
4. [Authentication](#authentication)
5. [Test Credentials](#test-credentials)
6. [Navigation Flows](#navigation-flows)
7. [Key Pages](#key-pages)
8. [Auction Testing URLs](#auction-testing-urls)
9. [Browser Automation Tips](#browser-automation-tips)
10. [Role-Based UI Differences](#role-based-ui-differences)
11. [Common Test Scenarios](#common-test-scenarios)
12. [MCP Browser Automation Example](#mcp-browser-automation-example)
13. [Debugging Authentication Issues](#debugging-authentication-issues)
14. [E2E: Create Dutch eAuction with MCP Browser](#e2e-create-dutch-eauction-with-mcp-browser)
15. [E2E: Create English eAuction with MCP Browser](#e2e-create-english-eauction-with-mcp-browser)
16. [E2E: Create Multi-Lot Multi-Item eAuction with MCP Browser](#e2e-create-multi-lot-multi-item-eauction-with-mcp-browser)
17. [E2E: Max Rank Display + Rank Per Line Item Testing](#e2e-max-rank-display--rank-per-line-item-testing)

---

## Playwright E2E Testing

### Overview

Crown uses **Playwright** for automated end-to-end testing of authentication flows (Phase 1). Tests run locally and in CI via GitHub Actions.

### Running Tests Locally

```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug -- auth.signin.spec.ts

# Generate tests with Codegen
npx playwright codegen http://localhost:3000/auth/signin
```

### Test Structure

- **Specs**: `tests/e2e/specs/*.spec.ts`
- **Page Objects**: `tests/e2e/pages/*.page.ts`
- **Helpers**: `tests/e2e/helpers/*.ts`

### Test Coverage (Phase 1: Authentication)

| Flow               | Tests | Description                                |
| ------------------ | ----- | ------------------------------------------ |
| **Signin**         | 7     | Valid login, redirects, errors, validation |
| **Signup**         | 9     | Account creation, password strength, terms |
| **Password Reset** | 5     | Reset email, validation, navigation        |
| **Total**          | 21    |                                            |

### Test Data Management

Tests use **dynamic data** with setup/teardown:

- Users created via Supabase Admin API before each test
- Email verification bypassed with `email_confirm: true`
- Users deleted after each test via `deleteTestUser()`

```typescript
// Example test pattern
test('should login successfully', async ({ page }) => {
  const testEmail = generateTestEmail()

  // Setup: Create test user with confirmed email
  await createTestUser(testEmail, VALID_TEST_PASSWORD)
  await setOnboardingStep(testEmail, 4) // Completed onboarding

  // Action: Login
  const signinPage = new SigninPage(page)
  await signinPage.goto()
  await signinPage.login(testEmail, VALID_TEST_PASSWORD)

  // Assert: Redirected to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

  // Cleanup happens in afterEach hook
})
```

### Debugging Failed Tests

1. **Check traces**: `npx playwright show-trace test-results/<test-name>/trace.zip`
2. **View report**: `npm run test:e2e:report`
3. **Run with UI mode**: `npm run test:e2e:ui`
4. **Check logs**: Test output shows database errors, timeouts, etc.

### Common Patterns

#### Creating Test User

```typescript
const testEmail = generateTestEmail()
await createTestUser(testEmail, VALID_TEST_PASSWORD)
await setOnboardingStep(testEmail, 4) // Completed onboarding
```

#### Vuetify Form Interactions

```typescript
// Use placeholder or role locators
await page.getByPlaceholder(/email/i).fill('test@example.com')
await page.getByRole('button', { name: /login/i }).click()

// Checkbox - use force if Vuetify hides native input
await page.getByRole('checkbox').check({ force: true })
```

#### Waiting for Redirects

```typescript
// Wait for navigation with regex
await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

// Wait for specific URL
await expect(page).toHaveURL('http://localhost:3000/auth/signin')
```

### CI/CD

E2E tests run automatically in GitHub Actions:

- **Triggers**: PR and push to main/dev
- **Environment**: Uses DEV Supabase instance (qzxnlhzlilysiklmbspn)
- **Artifacts**: Playwright report + traces on failure (30 days retention)
- **Timeout**: 2 minutes for Nuxt dev server startup

**GitHub Secrets Used** (already configured):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_ADMIN_KEY` (used as SERVICE_ROLE_KEY)

### Adding New Tests

1. Create spec: `tests/e2e/specs/my-feature.spec.ts`
2. Create page object if needed: `tests/e2e/pages/my-page.page.ts`
3. Use existing helpers for setup/teardown
4. Run: `npm run test:e2e -- my-feature.spec.ts`

### Pitfalls to Avoid

| Issue                           | Solution                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| Vuetify selectors don't work    | Use `getByPlaceholder()`, `getByRole()` instead of CSS classes  |
| Email verification blocks tests | Use Admin API with `email_confirm: true`                        |
| Tests flaky with timing         | Use `expect().toBeVisible()` with timeout, not `waitForTimeout` |
| Data conflicts between tests    | Use `generateTestEmail()` for unique emails                     |
| Profile not created yet         | Wait 2s after `createTestUser()` for triggers to complete       |

### Resources

- **Full Guide**: See `tests/e2e/README.md`
- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)

---

## Database Seeders Pattern ⭐ NEW

### Overview

For complex E2E tests that require auctions with specific configurations, **database seeders** provide a faster, more reliable alternative to UI-based test data creation. Instead of filling out the auction builder form (which can be slow and brittle), seeders create auctions directly in the database using Supabase Admin API.

**Benefits**:

- ⚡ **Faster**: Creates auction data in ~100ms vs 5-10s through UI
- 🎯 **Precise**: Full control over auction configuration
- 🔄 **Reusable**: Same seeder functions work across multiple tests
- 🛡️ **Reliable**: No UI interaction failures or timing issues

### When to Use Seeders

| Scenario                                                 | Approach                              |
| -------------------------------------------------------- | ------------------------------------- |
| Testing auction **creation flow**                        | ❌ Don't use seeders - test the UI    |
| Testing auction **duplication, bidding, status changes** | ✅ Use seeders to create initial data |
| Testing **builder form validation**                      | ❌ Don't use seeders - test the UI    |
| Testing **home page actions** (delete, duplicate, etc.)  | ✅ Use seeders for test data          |

### Seeder Functions

Location: `tests/e2e/helpers/seeders.ts`

#### Basic Seeder Example

```typescript
import { seedSimpleAuction, getUserProfile } from '../helpers/seeders'
import { deleteAuctionGroup } from '../helpers/auction-helpers'

test('should duplicate auction', async ({ page }) => {
  const timestamp = Date.now()
  const auctionName = `Test Auction ${timestamp}` // Unique name

  // Get user profile
  const profile = await getUserProfile(testEmail)

  // Seed auction directly in database
  const { groupId, auctionId } = await seedSimpleAuction(profile, {
    name: auctionName,
    lotName: auctionName, // This appears in the home table
    type: 'reverse', // English auction
    baseline: 10000,
    duration: 30,
    supplierEmails: ['supplier1@test.com'],
    published: false
  })

  // Now test duplication...
  await homePage.goto()
  await page.reload({ waitUntil: 'networkidle' }) // Ensure seeded data loads

  // Cleanup
  await deleteAuctionGroup(groupId)
})
```

#### Available Seeders

**`seedSimpleAuction(profile, options)`** - Creates single-lot auction

```typescript
interface SeedAuctionOptions {
  name: string // Auction group name
  lotName: string // Lot name (appears in home table!)
  description?: string
  type?: 'reverse' | 'dutch' | 'japanese' | 'sealed-bid'
  baseline?: number // Starting price
  duration?: number // Duration in minutes
  published?: boolean // Default: false
  usage?: 'real' | 'training' | 'test'
  supplierEmails?: string[] // Default: ['supplier1@test.com']
  itemName?: string // Line item name
  itemQuantity?: number // Line item quantity
  itemUnit?: string // Line item unit
  ceilingPrice?: number // Supplier ceiling price
}
```

**`seedMultiSupplierAuction(profile, options)`** - Creates auction with N suppliers

```typescript
const { groupId, auctionId } = await seedMultiSupplierAuction(profile, {
  name: 'Multi-Supplier Auction',
  lotName: 'Multi-Supplier Auction',
  supplierCount: 3 // Creates supplier1@, supplier2@, supplier3@test.com
})
```

### Critical: lot_name vs name

**⚠️ IMPORTANT**: Auctions have TWO name fields with different purposes:

| Field                      | Purpose            | Where it appears                 |
| -------------------------- | ------------------ | -------------------------------- |
| `name` (group level)       | Auction group name | Used internally                  |
| `lot_name` (auction level) | Lot/auction name   | **Home page table, UI displays** |

When creating seeders, always set **`lotName`** to what you want to see in the UI:

```typescript
const { groupId, auctionId } = await seedSimpleAuction(profile, {
  name: 'My Auction', // Group name (internal)
  lotName: 'My Auction' // This is what shows in home table ✅
})
```

### Home Page Testing Patterns

#### Finding Auction Rows

The `HomePage` page object provides a `findAuctionRow()` method that matches rows by text content:

```typescript
import { HomePage } from '../pages/home.page'

const homePage = new HomePage(page)

// Navigate and ensure data loads
await homePage.goto()
await page.reload({ waitUntil: 'networkidle' })

// Find auction row (matches first row containing text)
await homePage.expectAuctionVisible('My Auction Name')

// Open kebab menu and duplicate
await homePage.openDuplicateDialog('My Auction Name')
await homePage.confirmDuplication()
```

**Location**: `tests/e2e/pages/home.page.ts`

**Key Methods**:

- `findAuctionRow(name)` - Locates auction row by name (takes first match)
- `expectAuctionVisible(name)` - Asserts auction appears in table
- `auctionMenuButton(name)` - Gets kebab menu button
- `openDuplicateDialog(name)` - Opens duplication dialog
- `selectDuplicationType('flat' | 'training')` - Selects duplication type
- `confirmDuplication()` - Clicks "Duplicate" button
- `waitForSuccessToast(expectedCount?)` - Waits for success toast
- `waitForDatatableRefresh()` - Waits for table skeleton loader

#### Unique Test Data Names

**Always use timestamps** to avoid conflicts with previous test runs:

```typescript
test('should do something', async ({ page }) => {
  const timestamp = Date.now()
  const auctionName = `Test Auction ${timestamp}` // ✅ Unique

  // NOT: const auctionName = 'Test Auction' // ❌ Conflicts with old data
})
```

### Auction Duplication Testing

The duplication feature creates copies of auctions in two modes:

| Mode         | Behavior          | Result                                         |
| ------------ | ----------------- | ---------------------------------------------- |
| **Flat**     | Simple copy       | 1 auction named "Copy of [original]"           |
| **Training** | Per-supplier copy | N auctions named "[original] Training [email]" |

**Test Example**:

```typescript
test('should duplicate in flat mode', async ({ page }) => {
  const timestamp = Date.now()
  const auctionName = `Test Auction ${timestamp}`

  // Seed original auction
  const profile = await getUserProfile(testEmail)
  const { groupId, auctionId } = await seedSimpleAuction(profile, {
    name: auctionName,
    lotName: auctionName,
    supplierEmails: ['supplier1@test.com']
  })

  // Navigate and duplicate
  await homePage.goto()
  await page.reload({ waitUntil: 'networkidle' })
  await homePage.expectAuctionVisible(auctionName)
  await homePage.openDuplicateDialog(auctionName)
  await expect(homePage.flatRadio).toBeChecked() // Default selection
  await homePage.confirmDuplication()

  // Verify success
  await homePage.waitForSuccessToast(1)
  await homePage.waitForDatatableRefresh()
  await homePage.expectAuctionVisible(`Copy of ${auctionName}`)

  // Verify in database
  const duplicated = await verifyFlatDuplication(auctionId, `Copy of ${auctionName}`)

  // Cleanup both auctions
  await deleteAuctionGroup(groupId)
  await deleteAuctionGroup(duplicated.auctions_group_settings_id)
})
```

### Verification Helpers

Location: `tests/e2e/helpers/auction-helpers.ts`

**`verifyFlatDuplication(originalId, duplicatedName)`**

Verifies a flat duplication succeeded:

- Finds duplicated auction by name
- Checks it's unpublished (`published = false`)
- Verifies it matches original auction structure
- Returns duplicated auction object

**`verifyTrainingDuplication(originalId, expectedSupplierCount)`**

Verifies training duplication succeeded:

- Finds all training auctions matching pattern
- Checks count matches supplier count
- Verifies all have `usage = 'training'`
- Checks naming pattern: `[name] Training [email]`

**`deleteAuctionGroup(groupId)`**

Deletes auction group (cascades to all auctions via FK constraints)

### Known Issues & Workarounds

#### Issue 1: Seeded Data Not Appearing in UI

**Problem**: After seeding, auction doesn't show in home table

**Solution**: Reload page after navigating

```typescript
await homePage.goto()
await page.reload({ waitUntil: 'networkidle' }) // ✅ Forces data load
```

#### Issue 2: Database Verification Timing

**Problem**: Query runs before RPC transaction commits

**Solution**: Add small delay before database verification

```typescript
await homePage.waitForSuccessToast()
await page.waitForTimeout(2000) // Wait for DB commit
const duplicated = await verifyFlatDuplication(auctionId, duplicatedName)
```

#### Issue 3: Multiple Matching Rows

**Problem**: `findAuctionRow()` matches multiple auctions (e.g., "Test Auction" matches "Test Auction Training...")

**Solution**: Use unique, specific names with timestamps

```typescript
// ❌ BAD: Generic name
const auctionName = 'Test Auction'

// ✅ GOOD: Specific with timestamp
const timestamp = Date.now()
const auctionName = `Test Auction Flat ${timestamp}`
```

### Critical Bug Fixed During Development 🐛

**Bug Location**: `/composables/useAuctionDuplication.js:655`

**Issue**: Duplication code used `auctionData.name` (which doesn't exist) instead of `auctionData.lot_name`, causing all duplicated auctions to have `lot_name = null`

**Before**:

```javascript
const basics = {
  name: auctionData.name, // ❌ This field doesn't exist!
  description: auctionData.description
  // ...
}
```

**After**:

```javascript
const basics = {
  name: auctionData.lot_name, // ✅ Fixed: use lot_name
  description: auctionData.description
  // ...
}
```

**Impact**: ALL duplications (flat and training) were creating auctions with null names in production. E2E tests discovered this bug!

### Test Examples

**Location**: `tests/e2e/specs/home.duplication.spec.ts`

Available tests:

1. `should duplicate auction in flat mode` - Tests simple copy
2. `should duplicate auction in training mode with multiple suppliers` - Tests per-supplier duplication
3. `should handle single supplier in training mode` - Edge case with 1 supplier
4. `should cancel duplication when clicking cancel button` - Tests cancellation

### Best Practices

✅ **DO**:

- Use seeders for creating test data (not testing creation)
- Add timestamps to auction names for uniqueness
- Reload page after seeding to ensure data loads
- Clean up all created auction groups in `afterEach`
- Use `getUserProfile()` to get buyer_id for seeders
- Wait for toasts and skeleton loaders to verify UI updates

❌ **DON'T**:

- Use seeders to test the auction builder form itself
- Reuse auction names across tests
- Rely on realtime updates - always reload after seeding
- Skip cleanup - always delete created auction groups
- Use generic names like "Test Auction" - be specific

### Future Improvements

- Add retry logic to database verification (currently 5 attempts with 500ms delay)
- Investigate Supabase transaction commit timing for verification
- Add more seeder variants (multi-lot, specific auction types)
- Create seeders for bid placement and auction state progression

---

## URLs

| Environment     | URL                                 |
| --------------- | ----------------------------------- |
| **Production**  | `https://app.crown-procurement.com` |
| **Development** | `https://dev.crown.ovh`             |
| **Local**       | `http://localhost:3000`             |

---

## Authentication

### Login Page

**URL**: `/auth/signin` or click "Sign In" from homepage `/`

**Form Fields**:
| Field | Selector | Type |
|-------|----------|------|
| Email | `input[placeholder*='name@company.com']` | email |
| Password | `input[type="password"]` | password |
| Submit | `button:has-text('Log in')` | button |

**Flow**:

1. Navigate to `/auth/signin` (or click "Sign In" button from homepage)
2. Enter email in the email field
3. Enter password in the password field
4. Click "Log in" button
5. Wait 2-3 seconds for authentication and redirection
6. If `onboarding_step === 4`: redirects to `/dashboard`
7. If `onboarding_step < 4`: redirects to `/onboarding`

**Post-Login**:

- **Intercom Onboarding Tour**: After login, Intercom may automatically launch an onboarding tour with popups/overlays
- A welcome popup may appear: "Welcome! Click here to start! 1 sur 9"
- **IMPORTANT**: Press Escape or click the X button to dismiss the tour before interacting with the interface
- The tour can block interactions if not dismissed

### Signup Page

**URL**: `/auth/signup`

### Password Reset

**URL**: `/auth/ask-password-change`

---

## Test Credentials

### Admin Account (Recommended for Testing)

| Email                          | Password           |
| ------------------------------ | ------------------ |
| `victor@crown-procurement.com` | `Bestfriends75/!!` |

This account has full admin access and can be used for all buyer/admin testing scenarios.

### Test Supplier Account

| Email                  | Password               |
| ---------------------- | ---------------------- |
| `supplier+1@crown.ovh` | `Supplier+1@crown.ovh` |

Use this account for supplier/seller testing scenarios.

### Other Admin Accounts

| Email                      | Role  | Name            |
| -------------------------- | ----- | --------------- |
| `djebril@crown.ovh`        | admin | Djebril Crown   |
| `mykyta@crown.ovh`         | admin | Mykyta Voytenko |
| `fabien@quantedsquare.com` | admin | Fabien Ungerer  |
| `julien@quantedsquare.com` | admin | Julien Leray    |

### Bot/Training Suppliers

These accounts are used for training auction simulations (automated bots):

| Email                         | Role     |
| ----------------------------- | -------- |
| `bot-1@crown-procurement.com` | supplier |
| `bot-2@crown-procurement.com` | supplier |
| `bot-3@crown-procurement.com` | supplier |
| `bot-4@crown-procurement.com` | supplier |
| `bot-5@crown-procurement.com` | supplier |

### Other Test Accounts

| Email                        | Role     | Notes                 |
| ---------------------------- | -------- | --------------------- |
| `testbeforetest@yopmail.com` | supplier | General test supplier |
| `test@test.com`              | -        | Basic test account    |

---

## Navigation Flows

### Buyer Flow (Admin/Buyer)

```
/auth/signin
    ↓ (login)
/dashboard
    ↓ (select auction group)
/auctions/[groupId]
    ↓ (select lot)
/auctions/[groupId]/lots/[auctionId]/buyer
```

### Supplier Flow

```
/auth/signin
    ↓ (login)
/dashboard
    ↓ (select auction)
/auctions/[groupId]/lots/[auctionId]/seller
```

### Onboarding Flow (New Users)

```
/auth/signup
    ↓ (create account)
/onboarding
    ↓ (step 1: Profile info)
    ↓ (step 2: Company info)
    ↓ (step 3: Preferences)
    ↓ (step 4: Complete)
/dashboard
```

---

## Key Pages

### Dashboard

**URL**: `/dashboard`

**Purpose**: Main landing page after login. Shows:

- Active auctions
- Upcoming auctions
- Past auctions
- Quick actions

### Auction Group

**URL**: `/auctions/[groupId]`

**Purpose**: Lists all lots/auctions in a group.

### Buyer Auction View

**URL**: `/auctions/[groupId]/lots/[auctionId]/buyer`

**Purpose**: Buyer's view of an auction with:

- Real-time bid monitoring
- Seller rankings
- Auction controls
- Export options

### Seller Auction View

**URL**: `/auctions/[groupId]/lots/[auctionId]/seller`

**Purpose**: Seller's view of an auction with:

- Current price display
- Bid submission form
- Prebid management (Dutch)
- Rank display

### GPT Chat

**URL**: `/gpts/chat`

**Purpose**: AI assistant interface.

### Admin Panel

**URL**: `/admin/*`

**Purpose**: Admin-only management pages.

---

## Auction Testing URLs

### Quick Test Links

Replace `{groupId}` and `{auctionId}` with actual UUIDs:

```
# Buyer view
/auctions/{groupId}/lots/{auctionId}/buyer

# Seller view
/auctions/{groupId}/lots/{auctionId}/seller

# Auction settings
/auctions/{groupId}/lots/{auctionId}/settings
```

### Finding Test Auctions

Use the `inspect_auction.js` script to get URLs:

```bash
node scripts/inspect_auction.js <auctionId>
```

Output includes:

```
🔗 URLs:
   Buyer: http://localhost:3000/auctions/{groupId}/lots/{auctionId}/buyer
   Seller: http://localhost:3000/auctions/{groupId}/lots/{auctionId}/seller
```

---

## Browser Automation Tips

### Selectors

| Element                   | Recommended Selector                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| Login email               | `input[placeholder*="name@company.com"]`                                  |
| Login password            | `input[type="password"]`                                                  |
| Sign In button (homepage) | `span.v-btn__content:has-text('Sign In')` or `button:has-text('Sign In')` |
| Log in button (auth page) | `button:has-text('Log in')`                                               |
| Primary buttons           | `.v-btn-primary` or `button:has-text('Button Text')`                      |
| Secondary buttons         | `.v-btn-secondary`                                                        |

### Form Filling with MCP Browser

When using the MCP browser connector, prefer this approach for Vuetify forms:

**Recommended (more reliable)**:

```javascript
// Click field first, then type
{ type: "click", selector: "input[placeholder*='name@company.com']" }
{ type: "type", selector: "input[placeholder*='name@company.com']", text: "email@example.com" }
```

**Alternative**:

```javascript
// browser_fill_form may not always trigger Vue/Vuetify events correctly
browser_fill_form([
  { selector: "input[placeholder*='name@company.com']", value: 'email@example.com' }
])
```

### Waiting for Navigation

After login, **wait 2-3 seconds** for:

- Authentication to complete
- URL change to `/dashboard` or `/onboarding`
- Presence of dashboard elements

**Example**:

```javascript
{ type: "wait", timeout: 3000 }
```

### Handling Vuetify Components

Vuetify components often have nested structures:

```html
<v-text-field>
  <div class="v-input">
    <div class="v-field">
      <input />
      <!-- Target this -->
    </div>
  </div>
</v-text-field>
```

For buttons, target the text content:

```html
<v-btn>
  <span class="v-btn__content">Sign In</span>
  <!-- Use :has-text() -->
</v-btn>
```

### Logout Process

**Location**: User menu at bottom-left of navigation drawer

**Steps**:

1. Click on the options button next to the user name at the bottom of the sidebar (`.v-navigation-drawer__append .v-list-item__append`)
2. A menu opens with options:
   - Edit Profile
   - Switch to French
   - Terms of Use
   - Privacy Policy
   - Log out
3. Click "Log out" (`div.v-list-item-title:has-text('Log out')`)
4. User is redirected to `/auth/signin`

**Alternative (JavaScript)**:

```javascript
await $nuxt.$supabase.auth.signOut()
```

**Note**: The Intercom tour may appear when clicking the user menu for the first time ("Here you can edit your profile, switch the platform language, review the terms and privacy policy, or log out of your account"). Press Escape or click X to dismiss it.

### Session Persistence

Supabase auth tokens are stored in:

- `localStorage`: `sb-{project-ref}-auth-token`
- Cookies for SSR

---

## Role-Based UI Differences

### Navigation Menu by Role

| Menu Item  | Admin | Supplier | Notes                       |
| ---------- | ----- | -------- | --------------------------- |
| Dashboard  | ✓     | ✓        |                             |
| eAuctions  | ✓     | ✓        |                             |
| Users      | ✓     | ✗        | Admin only                  |
| Calculator | ✓     | ✗        | Admin only                  |
| Crown GPT  | ✓     | ✗        | Admin only                  |
| Clients    | ✓     | ✗        | Admin only                  |
| Trainings  | ✓     | ✓        | Shows count (e.g., "0/284") |

### Dashboard Differences

**Admin Dashboard** (`/dashboard`):

- Statistics cards: Super Buyers, Buyers, Suppliers, Companies, Planned eAuctions, Finished eAuctions
- Total Savings widget with chart
- Calendar
- Savings chart
- Full auction table

**Supplier Dashboard** (`/dashboard`):

- CEO card with name and country
- Planned eAuctions / Done Auctions counts
- Notifications Panel with auction invitations
- Calendar
- No global statistics
- Filtered auction list (only auctions where supplier is invited)

### User Menu Differences

Both admin and supplier have access to the same user menu options:

- Edit Profile
- Switch to French (language toggle)
- Terms of Use
- Privacy Policy
- Log out

---

## Common Test Scenarios

### 1. Login as Admin

```
1. Go to /auth/signin (or click "Sign In" from homepage)
2. Click email field and type: victor@crown-procurement.com
3. Click password field and type: Bestfriends75/!!
4. Click "Log in" button
5. Wait 2-3 seconds for authentication
6. Verify: redirected to /dashboard
7. Note: Welcome popup "1 sur 9" may appear - dismiss if needed
```

### 2. Login as Supplier Bot

```
1. Go to /auth/signin
2. Enter: bot-1@crown-procurement.com
3. Enter: [password]
4. Click submit
5. Verify: redirected to /dashboard or /onboarding
```

### 3. View Auction as Buyer

```
1. Login as admin
2. Navigate to /dashboard
3. Click on an auction group
4. Click on a lot
5. Verify: buyer view with bid table
```

### 4. Place a Bid as Supplier

```
1. Login as bot-1@crown-procurement.com
2. Navigate to auction seller view
3. Enter bid amount
4. Click submit
5. Verify: bid appears in list
```

### 5. Test Training Auction

```
1. Login as admin
2. Find a test/training auction
3. Call POST /api/v1/auctions/{id}/restart
4. Call POST /api/v1/auctions/{id}/training
5. Verify: bots place bids
```

### 6. Verify Role-Based Menu Visibility

```
1. Login as admin (victor@crown-procurement.com)
2. Verify Crown GPT is visible in sidebar menu
3. Click user menu button (bottom-left, next to username)
4. Click "Log out"
5. Login as supplier (supplier+1@crown.ovh)
6. Verify Crown GPT is NOT visible in sidebar menu
7. Verify Users, Calculator, Clients are also hidden
8. Verify Dashboard, eAuctions, Trainings are visible

### 7. Test Crown GPT (Admin Only)

```

1. Login as admin
2. Navigate to /gpts/chat (or click "Crown GPT" in sidebar)
3. Click "New test" under CROWN AI
4. Type a message (e.g., "Hello")
5. Verify: AI responds

```

### 8. Create a Dutch eAuction

```

1. Login as admin
2. Navigate to /home (eAuctions page)
3. Navigate directly to /builder (or click "Create eAuction" button)
4. Select "Dutch" auction type
5. Fill Auction Basics:
   - Name: Enter auction name (e.g., "Test Dutch Auction")
   - Date: Click calendar icon, select date
   - Time: Click clock icon, select time (Note: time picker can be finicky)
   - Timezone: Type timezone (e.g., "Europe/Paris")
6. Expand "Suppliers" section:
   - Search for suppliers (e.g., "supplier+1@crown.ovh")
   - Click to add each supplier to the general suppliers list
   - Add at least 2 suppliers (e.g., supplier+1@crown.ovh, supplier+2@crown.ovh)
7. Expand "Lots" section:
   - Name: Enter lot name (e.g., "Test Lot 1")
   - Baseline Price: Enter value (e.g., "100")
   - Round Increment: Enter value (e.g., "10")
   - Duration: Select from dropdown (e.g., "10 min")
   - Round Duration: Select from dropdown (e.g., "1 min")
   - Ending Price: Enter value (e.g., "50")
   - Starting Price: Auto-calculated and displayed (disabled field)
   - Scroll down within the Lots section to find "Lot Suppliers"
   - Check the checkboxes for suppliers to invite them to this lot
   - IMPORTANT: At least one supplier must be checked to pass validation
8. Click "Create eAuction" button (bottom right)
9. Verify: Redirected to auction page or success message appears

````

**Common Issues:**
- **Time Picker**: The time picker clock interface can be difficult to use. Click the hour number directly on the clock face, then AM/PM toggle.
- **Validation**: The auction won't create if no suppliers are invited to the lot (checked in Lot Suppliers section).
- **Supplier Selection**: Suppliers must first be added to the general "Suppliers" section before they appear as checkboxes in "Lot Suppliers".

---

## MCP Browser Automation Example

### Complete Login Flow with MCP Browser

This example shows how to use the MCP browser connector (Blueprint MCP) to automate login:

```javascript
// 1. Enable browser automation
mcp__browser__enable({ client_id: "crown-test" })

// 2. Create new tab and navigate to local app
mcp__browser__browser_tabs({
  action: "new",
  url: "http://localhost:3000"
})

// 3. Take screenshot to verify page loaded
mcp__browser__browser_take_screenshot({ highlightClickables: true })

// 4. Click "Sign In" button from homepage
mcp__browser__browser_interact({
  actions: [
    { type: "click", selector: "span.v-btn__content:has-text('Sign In')" }
  ]
})

// 5. Fill login form (click + type for each field)
mcp__browser__browser_interact({
  actions: [
    { type: "click", selector: "input[placeholder*='name@company.com']" },
    { type: "type", selector: "input[placeholder*='name@company.com']", text: "victor@crown-procurement.com" }
  ]
})

mcp__browser__browser_interact({
  actions: [
    { type: "click", selector: "input[type='password']" },
    { type: "type", selector: "input[type='password']", text: "Bestfriends75/!!" }
  ]
})

// 6. Submit form
mcp__browser__browser_interact({
  actions: [
    { type: "click", selector: "button:has-text('Log in')" }
  ]
})

// 7. Wait for authentication and redirection
mcp__browser__browser_interact({
  actions: [
    { type: "wait", timeout: 3000 }
  ]
})

// 8. Verify login successful (should be on /dashboard)
mcp__browser__browser_take_screenshot({ highlightClickables: true })

// 9. Dismiss Intercom onboarding tour if it appears
mcp__browser__browser_interact({
  actions: [
    { type: "press_key", key: "Escape" }
  ]
})

// 10. Optional: Check console for errors
mcp__browser__browser_console_messages({ level: "error", limit: 10 })

// 11. Logout (optional)
mcp__browser__browser_interact({
  actions: [
    { type: "click", selector: ".v-navigation-drawer__append .v-list-item__append" }
  ]
})

// Wait for menu to open
mcp__browser__browser_interact({
  actions: [
    { type: "wait", timeout: 500 }
  ]
})

// Click Log out
mcp__browser__browser_interact({
  actions: [
    { type: "click", selector: "div.v-list-item-title:has-text('Log out')" }
  ]
})
````

### Using Accessibility Tree References (`ref`)

The MCP browser connector provides **accessibility tree references** (`ref`) that are more reliable than CSS selectors for dynamic Vue components. These `ref` values are stable during a session but **will change between sessions** - always get them dynamically.

**How to get `ref` values:**

1. Use `browser_snapshot` to get the current page structure
2. Look for `[ref=e123]` attributes in the snapshot output
3. Use these `ref` values directly in `browser_click`, `browser_type`, etc.

**Example:**

```javascript
// Get snapshot to find refs
mcp__browser__browser_snapshot()
// Output shows: checkbox "Supplier 1" [ref=e894] [cursor=pointer]

// Use the ref directly
mcp__browser__browser_click({
  element: 'Supplier 1 checkbox',
  ref: 'e894'
})
```

**Important Notes:**

- ⚠️ **Refs are session-specific**: Don't hardcode `ref` values in scripts - they change between browser sessions
- ✅ **Get refs dynamically**: Always call `browser_snapshot` before using a `ref`
- ✅ **Refs update after DOM changes**: After expanding panels, opening dropdowns, or adding elements, take a new snapshot

**Advantages of using `ref`:**

- More reliable than CSS selectors for Vuetify components
- Works even when component structure changes
- Directly targets the accessibility tree node
- Less brittle than position-based clicks
- Better than hardcoded IDs which change frequently

**When to use `ref` vs selectors:**

- **Use `ref`**: For checkboxes, buttons, form inputs in complex Vuetify forms, expansion panels
- **Use selectors**: For simple, stable elements, or when `ref` is not available in snapshot
- **Use coordinates**: Only as last resort when both `ref` and selectors fail

### Tips for MCP Browser

1. **Use `browser_snapshot` to get `ref` values**: Take a snapshot first to get reliable `ref` identifiers for elements, especially for Vuetify components. Take snapshots:
   - After page loads
   - After expanding panels/sections
   - After dropdowns open
   - When elements become visible

2. **Use `ref` instead of coordinates when possible**: `ref` values are more reliable than `mouse_click` coordinates which can vary with screen size and layout changes.

3. **Use `browser_lookup` to find elements**: If you're unsure about selectors, use `browser_lookup({ text: "Button Text" })` to find elements by their text content

4. **Take screenshots frequently**: Screenshots help verify each step completed successfully

5. **Check console messages**: Use `browser_console_messages` to debug issues

6. **Handle dynamic content**: Use `wait` actions between steps to allow Vue components to render. Typical wait times:
   - Page load: 2000ms
   - Panel expansion: 500ms
   - Dropdown opening: 1000ms
   - Form submission: 3000ms

7. **Dismiss Intercom tours**: After login, Intercom may launch an onboarding tour that blocks interactions. Dismiss it with:

   ```javascript
   // Press Escape to dismiss Intercom tour
   mcp__browser__browser_interact({
     actions: [{ type: 'press_key', key: 'Escape' }]
   })

   // Or hide Intercom via JavaScript
   window.Intercom && window.Intercom('hide')
   ```

8. **Navigate directly to auth page**: You can skip the homepage and go directly to `/auth/signin`:

   ```javascript
   mcp__browser__browser_navigate({
     action: 'url',
     url: 'http://localhost:3000/auth/signin'
   })
   ```

9. **Scope JavaScript queries to active sections**: When using `browser_evaluate`, always scope queries to the active/visible section:

   ```javascript
   // Good: Scoped to active lot form
   const lotForm = document.querySelector('.v-expansion-panel--active')
   const inputs = lotForm.querySelectorAll('input[type="number"]')

   // Bad: May find inputs from other sections
   const inputs = document.querySelectorAll('input[type="number"]')
   ```

---

## Debugging Authentication Issues

### Check Auth State

In browser console:

```javascript
// Get current session
const {
  data: { session }
} = await supabase.auth.getSession()
console.log(session)

// Get current user
const {
  data: { user }
} = await supabase.auth.getUser()
console.log(user)
```

### Clear Auth State

```javascript
// Sign out
await supabase.auth.signOut()

// Clear storage
localStorage.clear()
```

### Common Errors

| Error                       | Cause                 | Solution                          |
| --------------------------- | --------------------- | --------------------------------- |
| "Invalid login credentials" | Wrong email/password  | Verify credentials                |
| "Email not confirmed"       | User not verified     | Check email for confirmation link |
| "User not found"            | Account doesn't exist | Create account first              |
| Redirect to `/onboarding`   | Incomplete profile    | Complete onboarding steps         |

---

## E2E: Create Dutch eAuction with MCP Browser

This section provides a complete, tested E2E flow for creating a Dutch eAuction using MCP browser automation.

### Prerequisites

1. MCP Browser extension enabled (`/mcp` command to enable 'browser')
2. Local app running at `http://localhost:3000`
3. Admin credentials available

### Complete E2E Flow

#### Step 1: Enable Browser & Login

```javascript
// Enable browser automation
mcp__browser__enable({ client_id: 'crown-dutch-test' })

// Navigate directly to login page
mcp__browser__browser_tabs({
  action: 'new',
  url: 'http://localhost:3000/auth/signin'
})

// Wait for page load
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 2000 }] })

// Fill login form
mcp__browser__browser_interact({
  actions: [
    { type: 'click', selector: "input[placeholder*='name@company.com']" },
    {
      type: 'type',
      selector: "input[placeholder*='name@company.com']",
      text: 'victor@crown-procurement.com'
    }
  ]
})

mcp__browser__browser_interact({
  actions: [
    { type: 'click', selector: "input[placeholder*='Has at least 8 characters']" },
    {
      type: 'type',
      selector: "input[placeholder*='Has at least 8 characters']",
      text: 'Bestfriends75/!!'
    }
  ]
})

// Submit login
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Log In')" }]
})

// Wait for redirect to dashboard
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 3000 }] })

// IMPORTANT: Dismiss Intercom tour
mcp__browser__browser_interact({ actions: [{ type: 'press_key', key: 'Escape' }] })
```

#### Step 2: Navigate to Builder

```javascript
// Navigate to builder page
mcp__browser__browser_navigate({
  action: 'url',
  url: 'http://localhost:3000/builder'
})

// Wait for page load
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 2000 }] })

// Dismiss Intercom if it appears again
mcp__browser__browser_evaluate({
  expression:
    "window.Intercom && window.Intercom('hide'); document.querySelectorAll('[class*=\"intercom\"]').forEach(el => el.style.display = 'none');"
})
```

#### Step 3: Fill Auction Basics (Step 1)

```javascript
// Fill auction name
mcp__browser__browser_interact({
  actions: [
    { type: 'click', selector: "input[placeholder='Enter Auction name']" },
    {
      type: 'type',
      selector: "input[placeholder='Enter Auction name']",
      text: 'Test Dutch Auction E2E'
    }
  ]
})

// Select Dutch auction type - use the hidden input value
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "input[value='dutch']" }]
})

// Verify Dutch is selected by taking screenshot
mcp__browser__browser_take_screenshot({ highlightClickables: true })
```

#### Step 4: Add Suppliers (Step 2)

```javascript
// Scroll down to see Suppliers section
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 400 }] })

// Get snapshot to find Suppliers panel ref
mcp__browser__browser_snapshot()

// Click on Suppliers panel to expand (use ref from snapshot, or coordinates as fallback)
mcp__browser__browser_click({
  element: 'Suppliers button',
  ref: 'e286' // Get from snapshot, or use coordinates: { type: "mouse_click", x: 317, y: 546 }
})

// Wait for expansion
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })

// Get snapshot to find supplier search input ref
mcp__browser__browser_snapshot()

// Click on supplier search autocomplete (it opens dropdown automatically)
mcp__browser__browser_click({
  element: 'Find an existing supplier combobox',
  ref: 'e360' // Get from snapshot
})

// Type to search (this triggers the dropdown)
mcp__browser__browser_type({
  element: 'Find an existing supplier combobox',
  ref: 'e360',
  text: 'supplier+1'
})

// Wait for dropdown to appear
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 1000 }] })

// Get snapshot to find dropdown option ref
mcp__browser__browser_snapshot()

// Select first supplier from dropdown
mcp__browser__browser_click({
  element: 'supplier+1@crown.ovh option',
  ref: 'e403' // Get from snapshot
})

// Wait for supplier to be added
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })

// Add second supplier (click autocomplete again)
mcp__browser__browser_click({
  element: 'Find an existing supplier combobox',
  ref: 'e551' // Ref may change after first supplier is added, get from new snapshot
})

mcp__browser__browser_type({
  element: 'Find an existing supplier combobox',
  ref: 'e551',
  text: 'supplier+2'
})

mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 1000 }] })
mcp__browser__browser_snapshot()

mcp__browser__browser_click({
  element: 'supplier+2@crown.ovh option',
  ref: 'e577' // Get from snapshot
})
```

#### Step 5: Configure Lot (Step 3)

```javascript
// Click on Lots panel to expand
mcp__browser__browser_click({
  element: 'Lots button',
  ref: 'e299' // Get ref from browser_snapshot
})

// Wait for expansion
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })

// IMPORTANT: Use JavaScript to set numeric field values (more reliable than typing)
// Use active expansion panel to scope the search
mcp__browser__browser_evaluate({
  expression: `
    const lotForm = document.querySelector('.v-expansion-panel--active');
    if (lotForm) {
      const inputs = lotForm.querySelectorAll('input[type="number"]');
      // Order for Dutch: [0] Baseline, [1] Round Increment, [2] Duration, [3] Ending Price
      if (inputs[0]) {
        inputs[0].focus();
        inputs[0].value = '100';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        inputs[0].blur();
      }
      if (inputs[1]) {
        inputs[1].focus();
        inputs[1].value = '10';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
        inputs[1].blur();
      }
      if (inputs[3]) {
        inputs[3].focus();
        inputs[3].value = '50';
        inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[3].dispatchEvent(new Event('change', { bubbles: true }));
        inputs[3].blur();
      }
    }
    'Lot values set: Baseline=100, Round Increment=10, Ending Price=50';
  `
})

// Scroll to see Lot Suppliers section
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 400 }] })

// Get snapshot to find checkbox refs
mcp__browser__browser_snapshot()

// Check both supplier checkboxes using refs (more reliable than coordinates)
mcp__browser__browser_click({
  element: 'Supplier 1 checkbox',
  ref: 'e894' // Get from snapshot
})
mcp__browser__browser_click({
  element: 'Supplier 2 checkbox',
  ref: 'e904' // Get from snapshot
})
```

#### Step 6: Set Ceiling Prices

**IMPORTANT**: Ceiling prices can only be set after suppliers are checked in "Lot Suppliers" section. The table appears automatically once suppliers are selected.

```javascript
// Set ceiling prices using JavaScript (most reliable method)
mcp__browser__browser_evaluate({
  expression: `
    // Find the ceiling price table (appears after suppliers are checked)
    const table = document.querySelector('table[ref="e1101"]') || 
                  document.querySelector('.v-data-table');
    
    if (table) {
      const rows = table.querySelectorAll('tbody tr');
      // Skip the "Total" row (last row), only process item rows
      const itemRow = rows[0]; // First row with Item 1
      
      if (itemRow) {
        const inputs = itemRow.querySelectorAll('input[type="number"]');
        // Last N inputs are supplier ceiling prices (where N = number of checked suppliers)
        // For 2 suppliers: last 2 inputs
        const supplierInputs = Array.from(inputs).slice(-2);
        
        if (supplierInputs.length >= 2) {
          // Supplier 1 ceiling price
          supplierInputs[0].focus();
          supplierInputs[0].value = '150';
          supplierInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          supplierInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          supplierInputs[0].blur();
          
          // Supplier 2 ceiling price
          supplierInputs[1].focus();
          supplierInputs[1].value = '160';
          supplierInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
          supplierInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
          supplierInputs[1].blur();
        }
      }
    }
    'Ceiling prices set: Supplier 1 = 150, Supplier 2 = 160';
  `
})

// Note: If ceiling prices don't appear to save, verify suppliers are checked first
// The table should show the supplier columns before setting prices
```

#### Step 7: Fill Required Terms

```javascript
// Fill all Quill rich text editors
mcp__browser__browser_evaluate({
  expression: `
    const quillContainers = document.querySelectorAll('.ql-container');
    quillContainers.forEach((container, i) => {
      const quill = container.__quill || Quill.find(container);
      if (quill) {
        if (i === 0) {
          quill.setText('Lowest price wins the lot.');
        } else if (i === 1) {
          quill.setText('Standard commercial terms apply. Payment within 30 days.');
        }
        // General terms (i === 2) usually has default content
      }
    });
    'Updated Quill editors';
  `
})
```

#### Step 8: Submit Form

```javascript
// Scroll to bottom to see Create button
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 500 }] })

// Click Create eAuction button
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Create eAuction')" }]
})

// Wait for creation and redirect
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 3000 }] })

// Verify success - URL should change to /auctions/{id}
mcp__browser__browser_take_screenshot({ highlightClickables: true })
```

### Key Selectors Reference

| Element                | Selector                                          | Notes                                |
| ---------------------- | ------------------------------------------------- | ------------------------------------ |
| Auction name input     | `input[placeholder='Enter Auction name']`         | Step 1                               |
| Dutch type radio       | `input[value='dutch']`                            | Hidden but clickable                 |
| Supplier search        | Use `ref` from snapshot                           | More reliable than coordinates       |
| Supplier dropdown item | `div.v-list-item:has-text('email@example.com')`   | After autocomplete opens             |
| Expansion panel        | Use `ref` from snapshot                           | Or use `mouse_click` on panel header |
| Supplier checkbox      | Use `ref` from snapshot                           | More reliable than coordinates       |
| Create button          | `button:has-text('Create eAuction')` or use `ref` | Bottom of page                       |

### Order of Operations for Lot Configuration

**IMPORTANT**: The order in which you set values matters for proper form validation:

1. **Set Baseline Price first** - This is required for calculations
2. **Set Round Increment** - Required for Dutch auctions
3. **Set Ending Price** - Must be set after Baseline (Starting Price is auto-calculated)
4. **Check supplier checkboxes** - Required before ceiling price table appears
5. **Set ceiling prices** - Only possible after suppliers are checked
6. **Fill terms** - Required for form submission

**Why order matters:**

- Starting Price is calculated from Baseline, Round Increment, and Ending Price
- Ceiling price table only appears after suppliers are checked
- Form validation checks all fields before enabling "Create eAuction" button

### JavaScript Workarounds

**Why JavaScript is needed**: Vuetify v-model bindings don't always trigger from standard `type` events. Use `browser_evaluate` for:

1. **Numeric input fields** (Baseline, Ending Price, Round Increment):

```javascript
// Pattern 1: Find inputs by position in active lot form (most reliable)
const lotForm = document.querySelector('.v-expansion-panel--active')
if (lotForm) {
  const inputs = lotForm.querySelectorAll('input[type="number"]')
  // [0] Baseline, [1] Round Increment, [2] Duration, [3] Ending Price (Dutch)
  if (inputs[0]) {
    inputs[0].focus()
    inputs[0].value = '100'
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[0].dispatchEvent(new Event('change', { bubbles: true }))
    inputs[0].blur()
  }
}

// Pattern 2: Find by ID (less reliable, IDs change)
const input = document.querySelector('#input-v-0-1-70')
if (input) {
  input.value = '100'
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
```

2. **Quill rich text editors** (Awarding, Commercial, General terms):

```javascript
const quillContainers = document.querySelectorAll('.ql-container')
quillContainers.forEach((container, i) => {
  const quill = container.__quill || (window.Quill && Quill.find(container))
  if (quill) {
    if (i === 0) {
      quill.setText('Awarding principles text')
    } else if (i === 1) {
      quill.setText('Commercial terms text')
    }
    // General terms (i === 2) usually has default content
  }
})
```

3. **Hiding Intercom overlays**:

```javascript
window.Intercom && window.Intercom('hide')
document.querySelectorAll('[class*="intercom"]').forEach((el) => (el.style.display = 'none'))
```

4. **Setting ceiling prices in table**:

```javascript
// Find the visible table (important for multi-lot scenarios)
const tables = document.querySelectorAll('.v-data-table')
let visibleTable = null
tables.forEach((table) => {
  const rect = table.getBoundingClientRect()
  if (rect.top > 0 && rect.top < window.innerHeight && rect.width > 0) {
    visibleTable = table
  }
})

if (visibleTable) {
  const rows = visibleTable.querySelectorAll('tbody tr')
  rows.forEach((row, rowIdx) => {
    const inputs = row.querySelectorAll('input[type="number"]')
    // Last N inputs are supplier ceiling prices (where N = number of suppliers)
    const supplierInputs = Array.from(inputs).slice(-2) // For 2 suppliers
    supplierInputs.forEach((input, inputIdx) => {
      input.focus()
      input.value = prices[rowIdx][inputIdx]
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.blur()
    })
  })
}
```

### Common Pitfalls & Solutions

| Problem                      | Symptom                             | Solution                                                                                                      |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Intercom blocks clicks       | `mouse_click` hits Intercom overlay | Run `Intercom('hide')` via JS or press Escape                                                                 |
| Typed values don't stick     | Field shows typed text but resets   | Use JS to set `.value` and dispatch both `input` and `change` events                                          |
| Expansion panel won't open   | Click on text does nothing          | Use `mouse_click` on panel header coordinates, or use `ref` from snapshot                                     |
| Suppliers not checkable      | Checkboxes don't respond            | Use `ref` from `browser_snapshot` instead of coordinates                                                      |
| Autocomplete won't open      | Click on field does nothing         | Use `mouse_click` with exact coordinates, or click then type to trigger dropdown                              |
| "Required" validation error  | Terms fields empty                  | Use Quill API via JS to set content                                                                           |
| Price fields showing 0       | JS didn't find correct inputs       | Use `.v-expansion-panel--active` to scope search to active lot form                                           |
| Ending Price not updating    | Value stays at default              | Set Ending Price AFTER Baseline and Round Increment, dispatch both `input` and `change` events                |
| Ceiling prices not saving    | Table shows 0 EUR after setting     | Ensure suppliers are checked first, then set prices. Use `focus()`, set value, dispatch events, then `blur()` |
| Wrong inputs targeted        | JS modifies wrong fields            | Always scope to `.v-expansion-panel--active` for lot-specific inputs                                          |
| Create button stays disabled | Form validation not passing         | Verify: name, suppliers added, lot suppliers checked, prices > 0, terms filled                                |

### Validation Requirements

The form **won't submit** without:

- ✅ Auction name (not empty)
- ✅ At least 1 supplier in general "Suppliers" section
- ✅ At least 1 supplier checked in "Lot Suppliers" section
- ✅ Baseline price > 0
- ✅ Round Increment > 0 (for Dutch)
- ✅ Ending price > 0 (for Dutch)
- ✅ At least 1 line item with ceiling prices filled (for each checked supplier)
- ✅ Awarding principles (not empty - use Quill API)
- ✅ Commercial terms (not empty - use Quill API)
- ✅ General terms (not empty - usually pre-filled, but verify)

**Note**: The "Create eAuction" button will be disabled until all requirements are met. If the button stays disabled, check:

1. Browser console for validation errors
2. All required fields are filled
3. Ceiling price table shows values (not "0 EUR")
4. Terms fields have actual content (not just placeholder text)

### Success Verification

After clicking "Create eAuction":

1. **URL changes** from `/builder` to `/auctions/{groupId}/lots/{auctionId}/buyer?status=upcoming&usage=test&type=dutch`
2. **Page shows auction details** with:
   - Lot tabs at top (Lot 1, Terms, Status, Admin)
   - Countdown timer showing "Start in X hours" or "upcoming" status
   - Round information: "Round: 1 / 5" (for Dutch with 5 rounds)
   - Price chart with suppliers (Supplier 1, Supplier 2)
   - Activity Log showing "eAuction starts at the price of X EUR"
   - Participants table with both suppliers listed
   - Baseline price displayed correctly (e.g., "100 EUR")
   - Current Price displayed (e.g., "10 EUR" - the starting price)
   - Price Saving: "No bid yet"
3. **Buttons available**:
   - "Start Training" button
   - "Start eAuction" button

**If creation fails:**

- Check browser console for errors (`browser_console_messages`)
- Verify all required fields are filled (see Validation Requirements)
- Check that at least one supplier is checked in Lot Suppliers
- Ensure ceiling prices are set (table should not show "0 EUR")

---

## E2E: Create English eAuction with MCP Browser

This section provides a complete, tested E2E flow for creating an English (Reverse) eAuction using MCP browser automation.

### English vs Dutch: Key Differences

| Aspect          | English (Reverse)                 | Dutch                              |
| --------------- | --------------------------------- | ---------------------------------- |
| Price direction | Bidders compete down (lower wins) | Price auto-decreases over time     |
| Bidding         | Active bidding with decrements    | First to accept current price wins |
| Duration        | Competition duration in minutes   | Total duration with rounds         |
| Key fields      | Min/Max bid decrement, Overtime   | Round increment, Round duration    |
| Rounds          | No rounds (continuous)            | Discrete rounds                    |

### Prerequisites

1. MCP Browser extension enabled
2. Local app running at `http://localhost:3000`
3. Admin credentials available
4. Already logged in (see Dutch E2E section for login steps)

### Complete E2E Flow

#### Step 1: Navigate to Builder (After Login)

```javascript
// Navigate to builder page
mcp__browser__browser_navigate({
  action: 'url',
  url: 'http://localhost:3000/builder'
})

// Wait for page load
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 2000 }] })

// Dismiss Intercom overlays
mcp__browser__browser_evaluate({
  expression:
    "window.Intercom && window.Intercom('hide'); document.querySelectorAll('[class*=\"intercom\"]').forEach(el => el.style.display = 'none');"
})
```

#### Step 2: Fill Auction Basics (English is Default)

```javascript
// Fill auction name using JavaScript (more reliable for Vuetify)
mcp__browser__browser_evaluate({
  expression: `
    const nameInput = document.querySelector("input[placeholder='Enter Auction name']");
    if (nameInput) {
      nameInput.value = 'Test English Auction E2E';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    'Auction name set';
  `
})

// NOTE: English type is selected by default - no need to click the radio button
// Verify by taking screenshot - should show "English Reverse" description
mcp__browser__browser_take_screenshot()
```

#### Step 3: Add Suppliers (Step 2)

```javascript
// Scroll to see Suppliers section
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 400 }] })

// Click on Suppliers panel to expand
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 680, y: 544 }]
})

// Wait for expansion
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })

// Click on supplier search autocomplete
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 160 }]
})

// Type to search (autocomplete will show results)
mcp__browser__browser_interact({
  actions: [{ type: 'type', selector: 'input#input-v-0-1-43', text: 'supplier+1' }]
})

// Click on supplier from dropdown
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 212 }]
})

// Add second supplier (same flow)
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 160 }]
})
mcp__browser__browser_interact({
  actions: [{ type: 'type', selector: 'input#input-v-0-1-43', text: 'supplier+2' }]
})
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 212 }]
})
```

#### Step 4: Configure English Lot (Step 3)

```javascript
// Click on Lots panel to expand
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 680, y: 392 }]
})

// Wait for expansion
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })

// Set English lot values using JavaScript
// English-specific fields: Baseline, Min Bid Decrement, Competition Duration, Max Bid Decrement
mcp__browser__browser_evaluate({
  expression: `
    const lotForm = document.querySelector('.v-expansion-panel--active');
    if (lotForm) {
      const allInputs = lotForm.querySelectorAll('input[type="number"]');
      // Order: [0] Baseline, [1] Min Bid Decr, [2] Duration, [3] Max Bid Decr
      if (allInputs[0]) { allInputs[0].value = '1000'; allInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[1]) { allInputs[1].value = '10'; allInputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[2]) { allInputs[2].value = '10'; allInputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[3]) { allInputs[3].value = '100'; allInputs[3].dispatchEvent(new Event('input', { bubbles: true })); }
    }
    'English lot values set: baseline=1000, minBid=10, duration=10min, maxBid=100';
  `
})
```

#### Step 5: Select Lot Suppliers

```javascript
// Scroll to see Lot Suppliers section
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 400 }] })

// Check both supplier checkboxes
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 265, y: 331 }] // Supplier 1 checkbox
})
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 556, y: 331 }] // Supplier 2 checkbox
})
```

#### Step 6: Set Ceiling Prices

```javascript
// Set ceiling prices using JavaScript
mcp__browser__browser_evaluate({
  expression: `
    const allInputs = Array.from(document.querySelectorAll('input[type="number"]'));
    const priceInputs = allInputs.filter(input => {
      const row = input.closest('tr');
      return row && row.querySelector('td');
    });

    if (priceInputs.length >= 2) {
      priceInputs[priceInputs.length - 2].value = '800';
      priceInputs[priceInputs.length - 2].dispatchEvent(new Event('input', { bubbles: true }));
      priceInputs[priceInputs.length - 1].value = '850';
      priceInputs[priceInputs.length - 1].dispatchEvent(new Event('input', { bubbles: true }));
    }
    'Ceiling prices set: Supplier 1 = 800, Supplier 2 = 850';
  `
})
```

#### Step 7: Fill Required Terms

```javascript
// Fill all Quill rich text editors
mcp__browser__browser_evaluate({
  expression: `
    const quillContainers = document.querySelectorAll('.ql-container');
    const termsContent = [
      'The lot will be awarded to the supplier with the lowest total price at the end of the auction.',
      'Payment terms: Net 30 days. Delivery within 2 weeks of order confirmation.',
      'All suppliers must comply with local regulations. Force majeure clauses apply.'
    ];

    quillContainers.forEach((container, index) => {
      const quill = container.__quill || (window.Quill && Quill.find(container));
      if (quill && termsContent[index]) {
        quill.setText(termsContent[index]);
      }
    });
    'Filled ' + quillContainers.length + ' Quill editors';
  `
})
```

#### Step 8: Submit Form

```javascript
// Scroll to bottom to see Create button
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 500 }] })

// Click Create eAuction button
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Create eAuction')" }]
})

// Wait for creation and redirect
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 3000 }] })

// Verify success - URL should change to /auctions/{id}
mcp__browser__browser_take_screenshot()
```

### English Lot Rules Field Reference

| Field                     | Property             | Type   | Description                              | Example Value |
| ------------------------- | -------------------- | ------ | ---------------------------------------- | ------------- |
| Baseline price            | `baseline`           | Number | Reference/reserve price                  | 1000          |
| Min bid decrement         | `min_bid_decr`       | Number | Minimum price decrease per bid           | 10            |
| Max bid decrement         | `max_bid_decr`       | Number | Maximum price decrease per bid           | 100           |
| Competition Duration      | `duration`           | Number | Duration in minutes                      | 10            |
| Overtime                  | `overtime_range`     | Select | Extension time when bids placed near end | 1 min         |
| Ranks triggering overtime | `overtime_rule`      | Select | Which ranks trigger overtime             | All           |
| Line items rank           | `rank_per_line_item` | Toggle | Show rank per item vs total              | No/Yes        |

### English vs Dutch Form Fields

| Section    | English Fields                                           | Dutch Fields                                                      |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| Lot Rules  | Baseline, Min Bid Decr, Max Bid Decr, Duration, Overtime | Baseline, Round Increment, Duration, Round Duration, Ending Price |
| Calculated | None                                                     | Starting Price (auto)                                             |
| Timing     | Overtime triggers                                        | Rounds display                                                    |
| Special    | Rank per line item toggle                                | Pre-bid toggle                                                    |

### Success Verification (English)

After successful creation, the auction page shows:

- **Lot tabs** at top (Lot 1, etc.)
- **Countdown timer** (e.g., "23:52 hours")
- **Status**: "Upcoming"
- **Baseline**: 1,000 EUR (your configured value)
- **Lowest current Bid**: "No bid yet"
- **Price Saving**: "No bid yet" (0%)
- **Activity Log**: "eAuction date is set to Dec XX..."
- **Leaderboard** with suppliers:
  - Rank 1: Supplier 1 - Offline
  - Rank 2: Supplier 2 - Offline

### Troubleshooting English E2E

| Issue                        | Cause                           | Solution                                    |
| ---------------------------- | ------------------------------- | ------------------------------------------- |
| English type not selected    | Different default in some cases | Click `input[value='reverse']`              |
| Duration field error         | Value below minimum             | Ensure duration >= 1 min for non-sealed-bid |
| Overtime dropdown empty      | Select component issue          | Use `mouse_click` on select, then option    |
| "Min bid decrement required" | Field reset after blur          | Use JS to set value and dispatch event      |
| Rank per line item disabled  | Only one line item              | Add more line items to enable toggle        |

---

## E2E: Create Multi-Lot Multi-Item eAuction with MCP Browser

This section provides a complete E2E flow for creating an eAuction with **multiple lots** and **multiple line items per lot**, including the "Line items rank" feature.

### Multi-Lot Features Overview

| Feature                 | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| **Multiple Lots**       | Create auctions with 2+ lots, each with independent configuration |
| **Timing Rules**        | Serial, Parallel, or Staggered lot execution                      |
| **Multiple Line Items** | Add multiple items per lot with individual ceiling prices         |
| **Line Items Rank**     | Display rank per item instead of total (requires 2+ items)        |

### Prerequisites

1. MCP Browser extension enabled
2. Local app running at `http://localhost:3000`
3. Admin credentials available
4. Already logged in

### Complete E2E Flow

#### Step 1: Navigate to Builder

```javascript
// Navigate to builder page
mcp__browser__browser_navigate({
  action: 'url',
  url: 'http://localhost:3000/builder'
})

// Wait for page load
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 2000 }] })

// Dismiss Intercom overlays
mcp__browser__browser_evaluate({
  expression:
    "window.Intercom && window.Intercom('hide'); document.querySelectorAll('[class*=\"intercom\"]').forEach(el => el.style.display = 'none');"
})
```

#### Step 2: Fill Auction Basics

```javascript
// Set auction name via JavaScript
mcp__browser__browser_evaluate({
  expression: `
    const nameInput = document.querySelector("input[placeholder='Enter Auction name']");
    if (nameInput) {
      nameInput.value = 'Multi-Lot Multi-Item Test E2E';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    'Auction name set';
  `
})

// English type is selected by default
```

#### Step 3: Add Multiple Suppliers

```javascript
// Expand Suppliers section
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 400 }] })
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 680, y: 544 }]
})
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })

// Add first supplier
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 160 }]
})
mcp__browser__browser_interact({
  actions: [{ type: 'type', text: 'supplier+1' }]
})
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 212 }]
})

// Add second supplier
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 160 }]
})
mcp__browser__browser_interact({
  actions: [{ type: 'type', text: 'supplier+2' }]
})
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 686, y: 212 }]
})
```

#### Step 4: Configure Lot 1 with Multiple Line Items

```javascript
// Expand Lots section
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 680, y: 392 }]
})
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })

// Set Lot 1 rules (English type)
mcp__browser__browser_evaluate({
  expression: `
    const lotForm = document.querySelector('.v-expansion-panel--active');
    if (lotForm) {
      const allInputs = lotForm.querySelectorAll('input[type="number"]');
      // [0] Baseline, [1] Min Bid Decr, [2] Duration, [3] Max Bid Decr
      if (allInputs[0]) { allInputs[0].value = '5000'; allInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[1]) { allInputs[1].value = '50'; allInputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[2]) { allInputs[2].value = '15'; allInputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[3]) { allInputs[3].value = '500'; allInputs[3].dispatchEvent(new Event('input', { bubbles: true })); }
    }
    'Lot 1 values set';
  `
})

// Scroll to Lot Suppliers
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 300 }] })

// Check both supplier checkboxes
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 265, y: 331 }]
})
mcp__browser__browser_interact({
  actions: [{ type: 'mouse_click', x: 556, y: 331 }]
})
```

#### Step 5: Add Multiple Line Items to Lot 1

```javascript
// Scroll to ceiling price table
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 200 }] })

// Click "Add new line item" button twice
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Add new line item')" }]
})
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 300 }] })
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Add new line item')" }]
})

// Now we have 3 line items total (1 default + 2 added)
// Set ceiling prices for all items using JavaScript
mcp__browser__browser_evaluate({
  expression: `
    const tables = document.querySelectorAll('.v-data-table');
    let visibleTable = null;
    tables.forEach(table => {
      const rect = table.getBoundingClientRect();
      if (rect.top > 0 && rect.top < window.innerHeight) {
        visibleTable = table;
      }
    });

    if (visibleTable) {
      const rows = visibleTable.querySelectorAll('tbody tr');
      const prices = [
        [1000, 1100],  // Item 1: S1=1000, S2=1100
        [800, 850],    // Item 2: S1=800, S2=850
        [500, 550]     // Item 3: S1=500, S2=550
      ];

      rows.forEach((row, rowIdx) => {
        if (rowIdx < prices.length) {
          const inputs = row.querySelectorAll('input[type="number"]');
          const supplierInputs = Array.from(inputs).slice(-2); // Last 2 are supplier prices
          supplierInputs.forEach((input, inputIdx) => {
            if (prices[rowIdx][inputIdx] !== undefined) {
              input.focus();
              input.value = prices[rowIdx][inputIdx];
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.blur();
            }
          });
        }
      });
    }
    'Ceiling prices set for 3 items';
  `
})
```

#### Step 6: Enable Line Items Rank

**IMPORTANT**: The "Line items rank" toggle is only enabled when there are 2+ line items in the lot.

```javascript
// Scroll up to see the Line items rank toggle
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: -200 }] })

// Enable Line items rank toggle
mcp__browser__browser_evaluate({
  expression: `
    const switches = document.querySelectorAll('.v-switch');
    const rankSwitch = Array.from(switches).find(sw => {
      const parentCol = sw.closest('.v-col');
      if (parentCol) {
        const text = parentCol.textContent || '';
        return text.includes('Line items rank') || text.includes('rank');
      }
      return false;
    });

    if (rankSwitch) {
      const input = rankSwitch.querySelector('input[type="checkbox"]');
      if (input && !input.checked) {
        input.click();
      }
      'Line items rank enabled';
    } else {
      'Line items rank switch not found';
    }
  `
})

// Verify toggle is ON
mcp__browser__browser_take_screenshot()
```

#### Step 7: Add Lot 2

When adding a second lot, a **Timing Rules Dialog** appears.

```javascript
// Click "Add" button to add a new lot (usually has a + icon)
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Add')" }]
})

// Wait for Timing Rules Dialog to appear
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })
mcp__browser__browser_take_screenshot()

// Select timing rule (Serial is default)
// Options: Serial (lots run one after another), Parallel (all at same time), Staggered (overlap)
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Confirm')" }]
})

// Wait for dialog to close and Lot 2 tab to appear
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 500 }] })
```

#### Step 8: Configure Lot 2

```javascript
// Lot 2 tab should now be active
// Set Lot 2 values
mcp__browser__browser_evaluate({
  expression: `
    const lotForm = document.querySelector('.v-expansion-panel--active');
    if (lotForm) {
      const allInputs = lotForm.querySelectorAll('input[type="number"]');
      if (allInputs[0]) { allInputs[0].value = '3000'; allInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[1]) { allInputs[1].value = '30'; allInputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[2]) { allInputs[2].value = '10'; allInputs[2].dispatchEvent(new Event('input', { bubbles: true })); }
      if (allInputs[3]) { allInputs[3].value = '300'; allInputs[3].dispatchEvent(new Event('input', { bubbles: true })); }
    }
    'Lot 2 values set';
  `
})

// Select suppliers for Lot 2
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 300 }] })
// Note: Supplier checkbox IDs are different per lot (e.g., v-0-1-90 for Lot 1, v-0-1-173 for Lot 2)
mcp__browser__browser_evaluate({
  expression: `
    const checkboxes = document.querySelectorAll('.v-checkbox input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const rect = cb.getBoundingClientRect();
      // Only click checkboxes visible in supplier section
      if (rect.top > 200 && rect.top < 500 && !cb.checked) {
        cb.click();
      }
    });
    'Suppliers selected for Lot 2';
  `
})

// Add line items and set ceiling prices for Lot 2
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Add new line item')" }]
})

// Set ceiling prices for Lot 2 items
mcp__browser__browser_evaluate({
  expression: `
    const tables = document.querySelectorAll('.v-data-table');
    let visibleTable = null;
    tables.forEach(table => {
      const rect = table.getBoundingClientRect();
      if (rect.top > 0 && rect.top < window.innerHeight && rect.width > 0) {
        visibleTable = table;
      }
    });

    if (visibleTable) {
      const rows = visibleTable.querySelectorAll('tbody tr');
      const prices = [
        [600, 650],  // Item 1: S1=600, S2=650
        [400, 450]   // Item 2: S1=400, S2=450
      ];

      rows.forEach((row, rowIdx) => {
        if (rowIdx < prices.length) {
          const inputs = row.querySelectorAll('input[type="number"]');
          const supplierInputs = Array.from(inputs).slice(-2);
          supplierInputs.forEach((input, inputIdx) => {
            if (prices[rowIdx][inputIdx] !== undefined) {
              input.focus();
              input.value = prices[rowIdx][inputIdx];
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.blur();
            }
          });
        }
      });
    }
    'Lot 2 ceiling prices set';
  `
})
```

#### Step 9: Submit Multi-Lot Auction

```javascript
// Scroll to bottom
mcp__browser__browser_interact({ actions: [{ type: 'scroll_by', x: 0, y: 500 }] })

// Click Create eAuction
mcp__browser__browser_interact({
  actions: [{ type: 'click', selector: "button:has-text('Create eAuction')" }]
})

// Wait for creation
mcp__browser__browser_interact({ actions: [{ type: 'wait', timeout: 3000 }] })

// Verify success
mcp__browser__browser_take_screenshot()
```

### Timing Rules Reference

| Rule          | Description                          | Use Case                                      |
| ------------- | ------------------------------------ | --------------------------------------------- |
| **Serial**    | Lots run one after another           | Default. Lot 2 starts after Lot 1 ends        |
| **Parallel**  | All lots start at the same time      | Suppliers bid on multiple lots simultaneously |
| **Staggered** | Lots start with configurable overlap | Lot 2 starts X minutes after Lot 1            |

**Note**: Japanese auctions only support Serial timing.

### Multi-Lot Configuration Summary

| Lot   | Baseline  | Min Bid | Duration | Max Bid | Line Items |
| ----- | --------- | ------- | -------- | ------- | ---------- |
| Lot 1 | 5,000 EUR | 50 EUR  | 15 min   | 500 EUR | 3 items    |
| Lot 2 | 3,000 EUR | 30 EUR  | 10 min   | 300 EUR | 2 items    |

### Line Items Rank Feature

The "Line items rank" toggle:

- **Location**: In the lot configuration form, near the rules section
- **Requirement**: Must have 2+ line items to enable
- **Effect**: Shows supplier rank per item instead of total lot rank
- **Default**: Off (disabled)

### Ceiling Price Table Structure (Per Lot)

| Line Item | Unit | Quantity | Supplier 1    | Supplier 2    |
| --------- | ---- | -------- | ------------- | ------------- |
| Item 1    | Ton  | 1        | 1000          | 1100          |
| Item 2    | Ton  | 1        | 800           | 850           |
| Item 3    | Ton  | 1        | 500           | 550           |
| **Total** |      |          | **2,300 EUR** | **2,500 EUR** |

### Success Verification

After creation, the auction summary shows:

```
Summary
-------
Lots         Status      eAuction Time    Leader    Lowest bid    Savings
0 / 2 Lot 1  UPCOMING    00:00 / 15 min   -         -             0%
0 / 2 Lot 2  UPCOMING    00:00 / 10 min   -         -             0%
```

Both lots should display with their configured durations.

### Troubleshooting Multi-Lot E2E

| Issue                              | Cause                                 | Solution                                               |
| ---------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Timing Rules Dialog doesn't appear | May need to click specific Add button | Look for button with + icon near lot tabs              |
| Line items rank toggle disabled    | Less than 2 items                     | Add more line items first                              |
| Lot 2 config not saving            | Wrong inputs targeted                 | Use JavaScript to find inputs by position              |
| Supplier checkboxes not found      | Different IDs per lot                 | Use position-based selection or iterate all checkboxes |
| Ceiling prices reset               | Vue reactivity                        | Dispatch both 'input' and 'change' events              |
| Second lot has 0 prices            | JS targeting wrong table              | Filter tables by visibility (getBoundingClientRect)    |

### Key JavaScript Patterns for Multi-Lot

**Find visible table (for ceiling prices):**

```javascript
const tables = document.querySelectorAll('.v-data-table')
let visibleTable = null
tables.forEach((table) => {
  const rect = table.getBoundingClientRect()
  if (rect.top > 0 && rect.top < window.innerHeight && rect.width > 0) {
    visibleTable = table
  }
})
```

**Set ceiling prices by input ID:**

```javascript
const prices = [
  { id: 'input-v-0-1-189', value: '600' },
  { id: 'input-v-0-1-193', value: '650' }
]

prices.forEach(({ id, value }) => {
  const input = document.getElementById(id)
  if (input) {
    input.focus()
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.blur()
  }
})
```

**Enable Line items rank toggle:**

```javascript
const switches = document.querySelectorAll('.v-switch')
const rankSwitch = Array.from(switches).find((sw) => {
  const text = sw.closest('.v-col')?.textContent || ''
  return text.includes('Line items rank')
})
if (rankSwitch) {
  const input = rankSwitch.querySelector('input[type="checkbox"]')
  if (input && !input.checked) input.click()
}
```

---

## E2E: Max Rank Display with Rank Per Line Item Test

This section documents the E2E test for verifying that `max_rank_displayed` limitation only applies to global rank when `rank_per_line_item` is enabled.

### Feature Overview

The `max_rank_displayed` field controls whether suppliers can see their rank:

- When `max_rank_displayed = 0`: No ranks are shown to any supplier
- When `max_rank_displayed = N`: Only suppliers ranked 1 through N see their rank; ranks > N are hidden (shown as 0)

**Key Behavior Change Tested:**

- **Global rank**: Always respects `max_rank_displayed` (unchanged)
- **Line item rank** (when `rank_per_line_item = true`): Shows actual rank WITHOUT applying `max_rank_displayed` limitation

### Code Change

The modification was made in `server/api/v1/auctions/[auctionId]/supplies/[supplyId]/suppliers/[supplierId]/rank.get.js`:

```javascript
// Apply max_rank_displayed logic only if rank_per_line_item is NOT enabled
// When rank_per_line_item is enabled, show actual rank without limitation
if (!auction.rank_per_line_item) {
  if (auction.max_rank_displayed === 0) {
    return 0
  } else if (auction.max_rank_displayed && finalRank > auction.max_rank_displayed) {
    return 0
  }
}
```

### Prerequisites

1. MCP Browser extension enabled
2. Local app running at `http://localhost:3000`
3. Admin credentials: `victor@crown-procurement.com` / `Bestfriends75/!!`
4. At least 3 test supplier accounts (e.g., `supplier+1@crown.ovh`, `supplier+2@crown.ovh`, `supplier+3@crown.ovh`)

### Test Setup Steps

#### Step 1: Login and Navigate to Builder

```javascript
// Login as admin
// Navigate to /auth/signin
// Fill credentials and submit
// Dismiss Intercom tour with Escape key
// Navigate to /builder
```

#### Step 2: Create English Auction with Multiple Line Items

**Auction Configuration:**

- **Name**: "Max Rank Display Test with Rank Per Line Item"
- **Type**: English (reverse) - default selection
- **Suppliers**: Add 3+ suppliers
- **Line Items**: Add 2+ line items to enable rank_per_line_item toggle
- **Rank Per Line Item**: Toggle ON (checkbox in Ceiling Price header)

**Important Fields:**

- Baseline Price: e.g., 1000 EUR
- Min/Max Bid Decrements: e.g., 1 EUR / 1 EUR
- Competition Duration: e.g., 5 minutes
- Ceiling Prices: Set for all suppliers across all items

#### Step 3: Enable Line Items Rank Toggle

**Key Requirement**: The "Line items rank" toggle is only enabled when there are 2+ line items in the lot.

**JavaScript Pattern to Enable:**

```javascript
// After adding 2+ line items, the checkbox becomes enabled
// Find and click the checkbox
const checkbox = document.querySelector('input[type="checkbox"]')
// Check if it's the rank_per_line_item checkbox by looking at parent context
if (checkbox && !checkbox.disabled) {
  checkbox.click()
}
```

**Alternative - Find by Context:**

```javascript
const switches = document.querySelectorAll('.v-switch')
const rankSwitch = Array.from(switches).find((sw) => {
  const text = sw.closest('.v-col')?.textContent || ''
  return text.includes('Line items rank')
})
if (rankSwitch) {
  const input = rankSwitch.querySelector('input[type="checkbox"]')
  if (input && !input.checked) input.click()
}
```

#### Step 4: Set Ceiling Prices

**JavaScript Pattern for Setting Prices:**

```javascript
const table = document.querySelector('.v-data-table')
if (table) {
  const rows = table.querySelectorAll('tbody tr')
  const prices = [
    [900, 950, 1000], // Item 1: S1, S2, S3
    [850, 900, 950] // Item 2: S1, S2, S3
  ]

  rows.forEach((row, rowIdx) => {
    if (rowIdx < prices.length) {
      const inputs = row.querySelectorAll('input[type="number"]')
      const supplierInputs = Array.from(inputs).slice(-3) // Last 3 are supplier columns
      supplierInputs.forEach((input, inputIdx) => {
        if (prices[rowIdx][inputIdx] !== undefined) {
          input.focus()
          input.value = prices[rowIdx][inputIdx]
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.blur()
        }
      })
    }
  })
}
```

#### Step 5: Submit and Update max_rank_displayed

**After Creating Auction:**

1. Note the auction ID from the URL: `/auctions/{groupId}/lots/{auctionId}/buyer`
2. By default, `max_rank_displayed` is set to 100 for English auctions
3. Update it to 2 using a script:

```bash
node scripts/update_max_rank_displayed.js <auctionId> 2
```

**Script Content (create if needed):**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://jgwbqdpxygwsnswtnrxf.supabase.co', '<service_role_key>')

async function updateMaxRankDisplayed(auctionId, maxRank) {
  const { data, error } = await supabase
    .from('auctions')
    .update({ max_rank_displayed: maxRank })
    .eq('id', auctionId)
    .select()

  if (error) throw error
  console.log('✅ Updated:', data[0])
  return data[0]
}

updateMaxRankDisplayed(process.argv[2], parseInt(process.argv[3]))
  .then(() => process.exit(0))
  .catch(console.error)
```

### Verification Steps

#### Test Case 1: rank_per_line_item = true, max_rank_displayed = 2

**Setup:**

- Auction has `rank_per_line_item = true` and `max_rank_displayed = 2`
- 3+ suppliers place bids
- Suppliers are ranked 1, 2, 3+ based on total bid prices

**Global Rank Endpoint:**

```
GET /api/v1/auctions/{auctionId}/suppliers/{supplierId}/rank
```

**Expected Behavior:**

- Supplier ranked 1: Returns `1`
- Supplier ranked 2: Returns `2`
- Supplier ranked 3+: Returns `0` (hidden due to max_rank_displayed = 2)

**Line Item Rank Endpoint:**

```
GET /api/v1/auctions/{auctionId}/supplies/{supplyId}/suppliers/{supplierId}/rank
```

**Expected Behavior (with rank_per_line_item = true):**

- Supplier ranked 1 on item: Returns `1`
- Supplier ranked 2 on item: Returns `2`
- Supplier ranked 3+ on item: Returns actual rank (e.g., `3`, `4`, etc.) - **NOT hidden!**

#### Test Case 2: rank_per_line_item = false, max_rank_displayed = 2

**Setup:**

- Auction has `rank_per_line_item = false` and `max_rank_displayed = 2`

**Expected Behavior:**

- Both global rank AND line item rank respect `max_rank_displayed`
- Supplier ranked 3+ on any item: Returns `0` (hidden)

### Key Selectors Reference

| Element                  | Selector / Pattern                               | Notes                                   |
| ------------------------ | ------------------------------------------------ | --------------------------------------- |
| Line items rank checkbox | `input[type="checkbox"]` in ceiling price header | Only enabled with 2+ items              |
| Ceiling price table      | `.v-data-table`                                  | Contains rows for each line item        |
| Supplier column inputs   | Last N `input[type="number"]` in row             | Where N = number of suppliers           |
| Create eAuction button   | `button:has-text('Create eAuction')`             | Enabled when all required fields filled |

### Common Pitfalls & Solutions

| Problem                         | Symptom                          | Solution                                                 |
| ------------------------------- | -------------------------------- | -------------------------------------------------------- |
| Line items rank toggle disabled | Checkbox shows `[disabled]`      | Add at least 2 line items first                          |
| max_rank_displayed not 2        | Default is 100 for English       | Use script to update after creation                      |
| Ceiling prices not saving       | Values reset to 0                | Use `focus()`, set value, dispatch events, then `blur()` |
| Suppliers not in lot            | "Add suppliers to the lot" alert | Check supplier checkboxes in Lot Suppliers section       |

### Validation Requirements

The auction form won't submit without:

- ✅ Auction name (not empty)
- ✅ At least 1 supplier in general "Suppliers" section
- ✅ At least 1 supplier checked in "Lot Suppliers" section
- ✅ Baseline price > 0
- ✅ At least 1 line item with ceiling prices filled
- ✅ Awarding principles (not empty - has default content)
- ✅ Commercial terms (not empty - has default content)
- ✅ General terms (not empty - has default content)

### Success Verification

**After auction creation:**

1. URL changes to `/auctions/{groupId}/lots/{auctionId}/buyer`
2. Auction shows:
   - Baseline price correctly displayed
   - All suppliers in Leaderboard
   - All line items in Bids Table
   - Status: "Upcoming"

**After updating max_rank_displayed:**

1. Run verification script or SQL query:

```sql
SELECT id, name, max_rank_displayed, rank_per_line_item, type
FROM auctions
WHERE id = '<auctionId>';
```

2. Expected output:
   - `max_rank_displayed`: 2
   - `rank_per_line_item`: true
   - `type`: reverse

**Testing the rank endpoints:**

- Place bids as different suppliers (or use training bots)
- Call the rank endpoints via API or inspect in browser DevTools
- Verify that line item ranks show actual values (not limited by max_rank_displayed = 2)

### Notes

- **Default max_rank_displayed values**:
  - English (reverse): 100
  - Japanese: 0 (for japanese-no-rank) or 100
  - Dutch: 100
  - Sealed Bid: 100

- **rank_per_line_item availability**:
  - Only visible for auction types with multiple line items support
  - Toggle only enabled when 2+ line items exist
  - Stored as boolean in database: `auctions.rank_per_line_item`

- **API Endpoints**:
  - Global rank: `GET /api/v1/auctions/{auctionId}/suppliers/{supplierId}/rank`
  - Line item rank: `GET /api/v1/auctions/{auctionId}/supplies/{supplyId}/suppliers/{supplierId}/rank`
  - The line item rank endpoint contains the conditional logic for `rank_per_line_item`

---

## E2E: Max Rank Display + Rank Per Line Item Testing ⭐ NEW

This section documents a complete E2E test flow for verifying the `max_rank_displayed` and `rank_per_line_item` features.

### Test Objective

Verify that when `rank_per_line_item = true` and `max_rank_displayed = 2`:

- **Global ranks** respect `max_rank_displayed` (suppliers ranked 3+ see rank 0)
- **Line item ranks** show actual values regardless of `max_rank_displayed`

### Test Setup

**Environment:** `http://localhost:3000`

**Login credentials:**

- Email: `victor@crown-procurement.com`
- Password: `Bestfriends75/!!`

**Test auction configuration:**

- Type: English (reverse)
- Multiple line items: 2 (Item 1, Item 2)
- Multiple suppliers: 3 (Supplier 1, Supplier 2, Supplier 3)
- `max_rank_displayed`: 2 (manually updated via script after creation)
- `rank_per_line_item`: true (enabled via "Line items rank" checkbox)

### Complete E2E Flow

#### Step 1: Login and Navigate to Builder

```javascript
// Navigate to login page
await page.goto('http://localhost:3000/auth/signin')

// Fill in credentials
await page.locator('input[type="email"]').fill('victor@crown-procurement.com')
await page.locator('input[type="password"]').fill('Bestfriends75/!!')

// Click Log In button
await page.locator('button:has-text("Log in")').click()

// Wait for redirect
await page.waitForURL('**/dashboard')

// Dismiss Intercom tour
await page.evaluate(() => {
  const closeButton = document.querySelector('[aria-label="Close"]')
  if (closeButton) closeButton.click()
})

// Navigate to builder
await page.goto('http://localhost:3000/builder')
```

#### Step 2: Create English Auction with Required Configuration

**Set Auction Name:**

```javascript
const nameInput = document.querySelector("input[placeholder='Enter Auction name']")
if (nameInput) {
  nameInput.value = 'Test Max Rank Display with Line Item Ranks'
  nameInput.dispatchEvent(new Event('input', { bubbles: true }))
}
```

**Add 3 Suppliers:**

```javascript
// Expand Suppliers section
await page.locator('button:has-text("Suppliers")').click()

// Add Supplier 1
await page.locator('div[role="combobox"]').click()
await page.locator('div:has-text("Supplier 1")').first().click()

// Add Supplier 2
await page.locator('div[role="combobox"]').click()
await page.locator('div:has-text("Supplier 2")').first().click()

// Add Supplier 3
await page.locator('div[role="combobox"]').click()
await page.locator('div:has-text("Supplier 3")').first().click()
```

**Configure Lot with Multiple Items:**

```javascript
// Expand Lots section
await page.locator('button:has-text("Lots")').click()

// Check all 3 suppliers for the lot
const checkboxes = await page.locator('input[type="checkbox"]').all()
for (const checkbox of checkboxes.slice(0, 3)) {
  await checkbox.check()
}

// Set baseline price
await page.evaluate(() => {
  const input = document.querySelector('input[placeholder="1000"]')
  if (input) {
    input.focus()
    input.value = '1000'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.blur()
  }
})

// Add second line item
await page.locator('button:has-text("Add new line item")').click()

// Enable "Line items rank" toggle
const rankCheckbox = await page.locator('input[type="checkbox"][aria-label*="Line items rank"]')
await rankCheckbox.check()

// Set ceiling prices for both items
await page.evaluate(() => {
  const inputs = document.querySelectorAll('input[type="number"]')
  // Item 1: S1=900, S2=950, S3=1000
  if (inputs[0]) inputs[0].value = '900'
  if (inputs[1]) inputs[1].value = '950'
  if (inputs[2]) inputs[2].value = '1000'
  // Item 2: S1=850, S2=900, S3=950
  if (inputs[3]) inputs[3].value = '850'
  if (inputs[4]) inputs[4].value = '900'
  if (inputs[5]) inputs[5].value = '950'

  inputs.forEach((input) => {
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
})
```

**Create Auction:**

```javascript
await page.locator('button:has-text("Create eAuction")').click()
await page.waitForURL('**/auctions/**/lots/**/buyer')
```

#### Step 3: Update max_rank_displayed in Database

After creation, the auction defaults to `max_rank_displayed = 100`. Use a script to update it to `2`:

**Script:** `scripts/update_max_rank_displayed.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://jgwbqdpxygwsnswtnrxf.supabase.co', '<SERVICE_ROLE_KEY>')

async function updateAuctionMaxRank(auctionId, maxRank, rankPerLineItem) {
  const { data, error } = await supabase
    .from('auctions')
    .update({
      max_rank_displayed: maxRank,
      rank_per_line_item: rankPerLineItem
    })
    .eq('id', auctionId)
    .select()

  if (error) {
    console.error('Failed to update auction:', error)
    process.exit(1)
  }

  console.log('✅ Auction updated successfully!')
  console.log('max_rank_displayed:', data[0].max_rank_displayed)
  console.log('rank_per_line_item:', data[0].rank_per_line_item)
}

const auctionId = process.argv[2]
const maxRank = parseInt(process.argv[3], 10)
const rankPerLineItem = process.argv[4] === 'true'

updateAuctionMaxRank(auctionId, maxRank, rankPerLineItem)
```

**Usage:**

```bash
node scripts/update_max_rank_displayed.js <auctionId> 2 true
```

#### Step 4: Place Pre-Bids for All Suppliers

Navigate to the **Admin** tab on the auction page and place pre-bids:

**Supplier 1:**

- Item 1: 850 EUR
- Item 2: 800 EUR
- Total: 1,650 EUR → **Global Rank 1**

**Supplier 2:**

- Item 1: 880 EUR
- Item 2: 830 EUR
- Total: 1,710 EUR → **Global Rank 3**

**Supplier 3:**

- Item 1: 840 EUR
- Item 2: 850 EUR
- Total: 1,690 EUR → **Global Rank 2**

**JavaScript to set pre-bid values:**

```javascript
// For each supplier, select from dropdown then:
const inputs = document.querySelectorAll('input[type="number"]')
if (inputs[0]) {
  inputs[0].value = '<price>'
  inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
  inputs[0].dispatchEvent(new Event('change', { bubbles: true }))
}
// Repeat for second item...

// Click Submit pre-bid
await page.locator('button:has-text("Submit pre-bid")').click()
await page.locator('button:has-text("Yes")').click()
```

#### Step 5: Start the Auction

Return to the **Lot 1** tab and click **"Start eAuction"** button.

#### Step 6: Verify Rank Display

**Expected Line Item Ranks:**

- **Item 1**: S3 (840) = Rank 1, S1 (850) = Rank 2, S2 (880) = Rank 3
- **Item 2**: S1 (800) = Rank 1, S2 (830) = Rank 2, S3 (850) = Rank 3

**Expected Global Ranks:**

- S1 (1,650) = Rank 1
- S3 (1,690) = Rank 2
- S2 (1,710) = Rank 0 (hidden because rank 3 > max_rank_displayed 2)

### ❗ IMPORTANT FINDING: Potential Bug Detected

During testing on **Dec 2, 2025**, the Bids Table showed:

**Actual Display:**

- **Item 1**: S1 rank 2 ✓, S3 rank 1 ✓, S2 rank **2** ❌ (should be 3!)
- **Item 2**: S1 rank 1 ✓, S2 rank 2 ✓, S3 rank **2** ❌ (should be 3!)

**Issue:** Line item ranks are being capped at `max_rank_displayed = 2`, even though `rank_per_line_item = true`. According to the feature specification, line item ranks should show actual values when `rank_per_line_item = true`.

**Affected Code:** `server/api/v1/auctions/[auctionId]/supplies/[supplyId]/suppliers/[supplierId]/rank.get.js`

**Expected Behavior:**
When `rank_per_line_item = true`, the following condition should allow ranks beyond `max_rank_displayed`:

```javascript
// Apply max_rank_displayed logic only if rank_per_line_item is NOT enabled
// When rank_per_line_item is enabled, show actual rank without limitation
if (!auction.rank_per_line_item) {
  if (auction.max_rank_displayed === 0) {
    return 0
  } else if (auction.max_rank_displayed && finalRank > auction.max_rank_displayed) {
    return 0
  }
}
return finalRank
```

### Key Selectors for Pre-Bid Placement

| Element                 | Selector                              | Notes                          |
| ----------------------- | ------------------------------------- | ------------------------------ |
| Admin tab               | `tab[aria-label="Admin"]`             | Switch to admin view           |
| Supplier dropdown       | `div[role="combobox"]`                | Select supplier to bid as      |
| Item 1 unit price       | `input[type="number"]:nth-of-type(1)` | First number input in form     |
| Item 2 unit price       | `input[type="number"]:nth-of-type(2)` | Second number input in form    |
| Submit pre-bid button   | `button:has-text("Submit pre-bid")`   | Enabled when all fields filled |
| Confirmation Yes button | `button:has-text("Yes")`              | Confirm pre-bid submission     |

### Common Pitfalls

| Problem                        | Symptom                  | Solution                                                             |
| ------------------------------ | ------------------------ | -------------------------------------------------------------------- |
| Pre-bid won't submit           | Button stays disabled    | Ensure all ceiling prices are filled                                 |
| Confirmation dialog stuck      | Dialog doesn't close     | Click "Yes" button, wait 2-3 seconds                                 |
| Supplier dropdown not loading  | No options visible       | Wait for page to fully load, check if suppliers were added in Step 2 |
| Ceiling price validation error | "Max value: X EUR" alert | Cannot bid above ceiling price for that supplier                     |

### Validation Requirements

Pre-bid submission requires:

- ✅ Supplier selected from dropdown
- ✅ All line item unit prices filled
- ✅ Unit prices ≤ ceiling prices for that supplier
- ✅ Unit prices > 0

### Success Verification

**After placing all pre-bids:**

1. All 3 suppliers appear in Leaderboard with bid amounts
2. Bids Table shows all prices and ranks
3. Activity Log shows all pre-bid entries

**After starting auction:**

1. Status changes to "Ongoing" or shows timer countdown
2. Bids Table displays line item ranks
3. Ranks should follow `rank_per_line_item` logic

### Testing Different Scenarios

**Scenario 1: rank_per_line_item = true, max_rank_displayed = 2**

- ✅ Global rank 3 → shows 0 (hidden)
- ✅ Line item rank 3 → should show 3 (actual value)
- ❌ **BUG**: Currently shows 2 instead of 3

**Scenario 2: rank_per_line_item = false, max_rank_displayed = 2**

- ✅ Global rank 3 → shows 0 (hidden)
- ✅ Line item rank 3 → shows 0 (hidden)

### Notes

- **Auction Type Mapping**: Remember that "English" in UI = `type: 'reverse'` in database
- **Default Values**: English auctions default to `max_rank_displayed = 100`
- **Rank Calculation**: Ranks are calculated based on total bid amounts across all items
- **Line Item Specificity**: Each item can have different supplier rankings
- **Real-time Updates**: Ranks update dynamically as bids are placed

### Future Testing Recommendations

1. Test with more than 3 suppliers to verify rank 4, 5, etc.
2. Test during live bidding (not just pre-bids)
3. Verify API endpoints return correct rank values
4. Test with different `max_rank_displayed` values (0, 1, 3, etc.)
5. Test toggling `rank_per_line_item` after auction creation

---
