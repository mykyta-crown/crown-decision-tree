# eAuction Builder Documentation

This document provides comprehensive documentation for the eAuction Builder, including all components, fields, and their configurations.

> [!IMPORTANT]
> **Living Document Policy for AI Assistants**
> This documentation is intended to be a living document. If you are an AI assistant using this guide and you find yourself blocked or confused because the documentation is not explicit enough, you are **required** to update this document with your findings.

## Table of Contents

1. [Overview](#overview)
2. [URL and Access](#url-and-access)
3. [Step 1: Auction Basics](#step-1-auction-basics)
4. [Step 2: Suppliers](#step-2-suppliers)
5. [Step 3: Lots](#step-3-lots)
6. [Auction Types](#auction-types)
7. [Lot Configuration by Type](#lot-configuration-by-type)
8. [Validation Rules](#validation-rules)
9. [Component Reference](#component-reference)

---

## Overview

The eAuction Builder is a multi-step form for creating and editing eAuctions. It consists of 3 main steps:

1. **Auction Basics** - General auction settings
2. **Suppliers** - Supplier selection and management
3. **Lots** - Lot configuration with pricing and terms

### Architecture

```
pages/builder.vue
├── components/Builder/BasicsStep.vue      (Step 1)
├── components/Builder/SuppliersStep.vue   (Step 2)
└── components/Builder/LotsStep.vue        (Step 3)
    └── components/Builder/Lot/Form.vue
        ├── NameAndRulesForm.vue
        │   ├── EnglishLotRulesForm.vue
        │   ├── DutchLotRulesForm.vue
        │   └── JapaneseLotRulesForm.vue
        ├── SuppliersForm.vue
        ├── RoundTimingRulesForm.vue (Preferred Dutch only)
        ├── CeilingPriceForm.vue
        ├── FixedHandicapForm.vue (English only)
        ├── DynamicHandicapForm.vue (English only)
        ├── AwardingTermsForm.vue
        ├── CommercialTermsForm.vue
        └── GeneralTermsForm.vue
```

---

## URL and Access

| URL                                    | Purpose                     |
| -------------------------------------- | --------------------------- |
| `/builder`                             | Create new eAuction         |
| `/builder?auction_id={uuid}`           | Edit existing eAuction      |
| `/builder?auction_id={uuid}&copy=true` | Duplicate existing eAuction |

**Access**: Admin/Buyer role required

---

## Step 1: Auction Basics

**Component**: `components/Builder/BasicsStep.vue`

### Fields

| Field          | Property      | Type         | Required | Description                            |
| -------------- | ------------- | ------------ | -------- | -------------------------------------- |
| Auction Owner  | `buyer_id`    | Autocomplete | Yes      | Select the buyer/owner of the auction  |
| Auction Usage  | `usage`       | Select       | Yes      | Purpose: `real`, `training`, or `test` |
| Auction Status | `published`   | Switch       | Yes      | Toggle between `Draft` and `Published` |
| Auction Name   | `name`        | Text         | Yes      | Name of the auction group              |
| Description    | `description` | Textarea     | No       | Optional description                   |
| Date           | `date`        | Date Picker  | Yes      | Start date (default: tomorrow)         |
| Time           | `time`        | Time Picker  | Yes      | Start time (format: HH:mm)             |
| Timezone       | `timezone`    | Text         | Yes      | e.g., `CEST`, `Europe/Paris`           |
| Currency       | `currency`    | Select       | Yes      | `EUR` or `USD`                         |
| Auction Type   | `type`        | Radio Group  | Yes      | See [Auction Types](#auction-types)    |

### Default Values

```javascript
{
  name: '',
  description: '',
  prefered: false,
  max_rank_displayed: 100,
  date: dayjs().add(1, 'day'),
  time: dayjs().format('HH:mm'),
  currency: 'EUR',
  timezone: 'CEST',
  type: 'reverse',
  test: true,
  log_visibility: 'only_own',
  published: false,
  usage: 'training' // 'test' in non-production
}
```

### Auction Usage Options

| Value      | Label    | Description         |
| ---------- | -------- | ------------------- |
| `real`     | Real     | Production auction  |
| `training` | Training | Training simulation |
| `test`     | Test     | Testing purposes    |

---

## Step 2: Suppliers

**Component**: `components/Builder/SuppliersStep.vue`

### Features

- **Search Existing Suppliers**: Autocomplete dropdown to search and add existing suppliers
- **Add New Supplier**: Button to open dialog for inviting new suppliers
- **Supplier Table**: Display and manage added suppliers

### Supplier Table Columns

| Column   | Property   | Description              |
| -------- | ---------- | ------------------------ |
| Name     | `name`     | Supplier contact name    |
| Company  | `company`  | Company name             |
| Email    | `email`    | Email address (required) |
| Phone    | `phone`    | Phone number             |
| Country  | `country`  | Country                  |
| Address  | `address`  | Company address          |
| Position | `position` | Contact position         |

### Add New Supplier Dialog

| Field | Required | Description                |
| ----- | -------- | -------------------------- |
| Email | Yes      | Must be valid email format |
| Phone | Yes      | Phone number               |

### Supplier Object Structure

```javascript
// Existing supplier
{
  email: "supplier@example.com",
  phone: "+33123456789",
  company: "Company Name",
  address: "123 Street",
  country: "France",
  name: "John Doe",
  position: "CEO",
  isNew: false
}

// New supplier (invitation)
{
  email: "new@example.com",
  phone: "+33123456789",
  isNew: true
}
```

---

## Step 3: Lots

**Component**: `components/Builder/LotsStep.vue`

### Features

- **Tabbed Interface**: Navigate between multiple lots
- **Add Lot**: Button to add new lots
- **Delete Lot**: X icon on each tab (if more than one lot)
- **Timing Rules**: Configure timing between lots (serial, parallel, staggered)

### Timing Rules (Multi-Lot)

| Rule        | Description                     |
| ----------- | ------------------------------- |
| `serial`    | Lots run one after another      |
| `parallel`  | All lots start at the same time |
| `staggered` | Lots start with overlap         |

**Note**: Japanese auctions only support `serial` timing.

### Lot Form Sections

Each lot contains the following sections:

#### 1. Name and Rules (`NameAndRulesForm.vue`)

| Field    | Property | Type | Required |
| -------- | -------- | ---- | -------- |
| Lot Name | `name`   | Text | Yes      |

Plus auction-type-specific fields (see [Lot Configuration by Type](#lot-configuration-by-type))

#### 2. Lot Suppliers (`SuppliersForm.vue`)

Checkbox list of suppliers from Step 2 to invite to this specific lot.

**Important**: At least one supplier must be selected per lot.

#### 3. Ceiling Prices (`CeilingPriceForm.vue`)

Data table for line items:

| Column           | Property       | Type   | Description                |
| ---------------- | -------------- | ------ | -------------------------- |
| Line Item        | `line_item`    | Text   | Item name                  |
| Unit             | `unit`         | Text   | Unit of measure            |
| Quantity         | `quantity`     | Number | Quantity                   |
| [Supplier Email] | `[email]`      | Number | Ceiling price per supplier |
| Multiplier       | `mult_[email]` | Number | Optional multiplier        |

#### 4. Fixed Handicap (`FixedHandicapForm.vue`)

**Available for**: English (reverse) auctions only

Per-supplier handicap configuration:

- Type: `+`, `-`, or `*`
- Value: Number

#### 5. Dynamic Handicap (`DynamicHandicapForm.vue`)

**Available for**: English (reverse) auctions only

Group-based handicap configuration:

- Group Name
- Option Name
- Supplier
- Amount

#### 6. Awarding Terms (`AwardingTermsForm.vue`)

Rich text editor for awarding principles.

| Property              | Type           | Required |
| --------------------- | -------------- | -------- |
| `awarding_principles` | HTML/Rich Text | Yes      |

#### 7. Commercial Terms (`CommercialTermsForm.vue`)

Rich text editor for commercial terms + file uploads.

| Property            | Type           | Required |
| ------------------- | -------------- | -------- |
| `commercials_terms` | HTML/Rich Text | Yes      |
| `commercials_docs`  | File[]         | No       |

#### 8. General Terms (`GeneralTermsForm.vue`)

Rich text editor for general terms.

| Property        | Type           | Required |
| --------------- | -------------- | -------- |
| `general_terms` | HTML/Rich Text | Yes      |

---

## Auction Types

| Type             | Value              | Description                                     |
| ---------------- | ------------------ | ----------------------------------------------- |
| English          | `reverse`          | Price descends through competitive bidding      |
| Dutch            | `dutch`            | Price descends automatically, first bidder wins |
| Japanese         | `japanese`         | Price ascends, sellers exit when price too high |
| Sealed Bid       | `sealed-bid`       | Single blind bid submission                     |
| Preferred Dutch  | `preferred-dutch`  | Dutch with preferred supplier timing            |
| Japanese No Rank | `japanese-no-rank` | Japanese without rank display                   |

---

## Lot Configuration by Type

### English (Reverse) Auction

**Component**: `EnglishLotRulesForm.vue`

| Field                | Property             | Type   | Required | Description                  |
| -------------------- | -------------------- | ------ | -------- | ---------------------------- |
| Baseline Price       | `baseline`           | Number | Yes      | Reference price              |
| Competition Duration | `duration`           | Number | Yes      | Duration in minutes          |
| Min Bid Decrement    | `min_bid_decr`       | Number | Yes      | Minimum bid decrease         |
| Max Bid Decrement    | `max_bid_decr`       | Number | Yes      | Maximum bid decrease         |
| Overtime             | `overtime_range`     | Select | Yes      | Overtime duration (30s-5min) |
| Ranks Triggering     | `overtime_rule`      | Select | No       | Which ranks trigger overtime |
| Rank Per Line Item   | `rank_per_line_item` | Toggle | No       | Show rank per item           |

**Overtime Options**: None, 30 sec, 1-5 min

### Sealed Bid Auction

Same as English but without:

- Competition Duration
- Min Bid Decrement
- Overtime fields

### Dutch Auction

**Component**: `DutchLotRulesForm.vue`

| Field           | Property               | Type   | Required | Description                       |
| --------------- | ---------------------- | ------ | -------- | --------------------------------- |
| Baseline Price  | `baseline`             | Number | Yes      | Target/reserve price              |
| Round Increment | `min_bid_decr`         | Number | Yes      | Price decrease per round          |
| Duration        | `duration`             | Select | Yes      | Total auction duration            |
| Round Duration  | `overtime_range`       | Select | Yes      | Duration of each round            |
| Ending Price    | `max_bid_decr`         | Number | Yes      | Final/highest price               |
| Starting Price  | (calculated)           | Number | -        | Auto-calculated from other fields |
| Pre-bid         | `dutch_prebid_enabled` | Toggle | No       | Enable scheduled pre-bids         |

**Duration Options**: 5, 10, 15, 20, 25, 30, 35, 40 min
**Round Duration Options**: 15 sec, 30 sec, 1 min

**Calculated Fields**:

- **Starting Price**: `max_bid_decr - (nbRounds - 1) * min_bid_decr`
- **Number of Rounds**: `duration / overtime_range`

### Japanese Auction

**Component**: `JapaneseLotRulesForm.vue`

| Field           | Property               | Type   | Required | Description               |
| --------------- | ---------------------- | ------ | -------- | ------------------------- |
| Baseline Price  | `baseline`             | Number | Yes      | Reserve price             |
| Round Decrement | `min_bid_decr`         | Number | Yes      | Price increase per round  |
| Duration        | `duration`             | Select | Yes      | Total auction duration    |
| Round Duration  | `overtime_range`       | Select | Yes      | Duration of each round    |
| Starting Price  | `max_bid_decr`         | Number | Yes      | Initial/highest price     |
| Ending Price    | (calculated)           | Number | -        | Auto-calculated           |
| Pre-bid         | `dutch_prebid_enabled` | Toggle | No       | Enable scheduled pre-bids |

**Note**: In Japanese auctions, price **ascends** (decreases from buyer's perspective).

---

## Validation Rules

### Step 1 (Basics)

- All fields except `description` are required
- `name` must not be empty
- `timezone` must not be empty

### Step 2 (Suppliers)

- At least 1 supplier must be added

### Step 3 (Lots)

Per lot:

- `name` must not be empty
- `baseline` must be > 0
- `suppliers` must have at least 1 selected
- `items` must have at least 1 line item
- All item fields must be filled
- `awarding_principles` must not be empty
- `commercials_terms` must not be empty
- `general_terms` must not be empty

**For non-sealed-bid auctions**:

- `duration` must be > 0
- `overtime_range` must be > 0
- `min_bid_decr` must be > 0
- `max_bid_decr` must be > 0

---

## Component Reference

### Main Files

| Component      | Path                                   | Purpose   |
| -------------- | -------------------------------------- | --------- |
| Builder Page   | `pages/builder.vue`                    | Main page |
| Basics Step    | `components/Builder/BasicsStep.vue`    | Step 1    |
| Suppliers Step | `components/Builder/SuppliersStep.vue` | Step 2    |
| Lots Step      | `components/Builder/LotsStep.vue`      | Step 3    |

### Lot Sub-Components

| Component           | Path                                             | Purpose                        |
| ------------------- | ------------------------------------------------ | ------------------------------ |
| Form                | `components/Builder/Lot/Form.vue`                | Lot form container             |
| NameAndRulesForm    | `components/Builder/Lot/NameAndRulesForm.vue`    | Lot name + type-specific rules |
| SuppliersForm       | `components/Builder/Lot/SuppliersForm.vue`       | Lot supplier selection         |
| CeilingPriceForm    | `components/Builder/Lot/CeilingPriceForm.vue`    | Line items table               |
| FixedHandicapForm   | `components/Builder/Lot/FixedHandicapForm.vue`   | Fixed handicap config          |
| DynamicHandicapForm | `components/Builder/Lot/DynamicHandicapForm.vue` | Dynamic handicap config        |
| AwardingTermsForm   | `components/Builder/Lot/AwardingTermsForm.vue`   | Awarding principles            |
| CommercialTermsForm | `components/Builder/Lot/CommercialTermsForm.vue` | Commercial terms + docs        |
| GeneralTermsForm    | `components/Builder/Lot/GeneralTermsForm.vue`    | General terms                  |

### Type-Specific Rule Forms

| Component            | Path                                          | Used For            |
| -------------------- | --------------------------------------------- | ------------------- |
| EnglishLotRulesForm  | `components/Builder/EnglishLotRulesForm.vue`  | English, Sealed-Bid |
| DutchLotRulesForm    | `components/Builder/DutchLotRulesForm.vue`    | Dutch               |
| JapaneseLotRulesForm | `components/Builder/JapaneseLotRulesForm.vue` | Japanese            |

### Other Components

| Component                | Path                                              | Purpose                       |
| ------------------------ | ------------------------------------------------- | ----------------------------- |
| TimingRulesDialogContent | `components/Builder/TimingRulesDialogContent.vue` | Multi-lot timing config       |
| RoundsCard               | `components/Builder/RoundsCard.vue`               | Dutch/Japanese rounds display |
| DuplicateAuctionDialog   | `components/Builder/DuplicateAuctionDialog.vue`   | Copy auction options          |
| RoundTimingRulesForm     | `components/Builder/Lot/RoundTimingRulesForm.vue` | Preferred Dutch timing        |

---

## CSS Selectors for Automation

### Step 1 - Basics

| Element          | Selector                                   |
| ---------------- | ------------------------------------------ |
| Auction Name     | `input` inside first text-field            |
| Description      | `textarea`                                 |
| Date Field       | `input` with Calendar icon                 |
| Time Field       | `input` with Clock icon                    |
| Timezone         | Text field with placeholder                |
| Currency         | `v-select` with EUR/USD options            |
| Auction Type     | `v-radio-group`                            |
| Published Switch | `v-switch`                                 |
| Usage Select     | `v-select` with real/training/test options |

### Step 2 - Suppliers

| Element                 | Selector                              |
| ----------------------- | ------------------------------------- |
| Search Suppliers        | `v-autocomplete` with search icon     |
| Add New Supplier Button | `button:has-text('Add New Supplier')` |
| Supplier Table          | `v-data-table`                        |
| Dialog Email Field      | `input[placeholder*="email"]`         |
| Dialog Phone Field      | `input[placeholder*="phone"]`         |

### Step 3 - Lots

| Element             | Selector                                |
| ------------------- | --------------------------------------- |
| Lot Tabs            | `v-tab` elements                        |
| Add Lot Button      | `button:has-text('Add')` with plus icon |
| Lot Name            | First `v-text-field` in lot form        |
| Supplier Checkboxes | `v-checkbox` in SuppliersForm           |
| Line Items Table    | `v-data-table` in CeilingPriceForm      |

### Submit Button

| Element            | Selector                                                          |
| ------------------ | ----------------------------------------------------------------- |
| Create/Edit Button | `button:has-text('Create eAuction')` or `button:has-text('Edit')` |

---

## Browser Testing Flow

See `docs/BROWSER_TESTING.md` for complete testing scenarios including:

- Scenario 8: Create a Dutch eAuction
- Step-by-step instructions for filling the builder form
