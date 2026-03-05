# Training Content Index

This directory contains training content for eAuctions in both English and French formats.

## File Structure

### Original JSON Files

- `en/trainings.json` - Original English training content in JSON format
- `fr/trainings.json` - Original French training content in JSON format

### New Markdown Files

- `en/trainings.md` - English training content in Markdown format
- `fr/trainings.md` - French training content in Markdown format

## Content Overview

The training content covers the following auction types:

### 1. English eAuction

- **Description**: Suppliers compete by placing lower bids
- **Key Feature**: Last one to bid before timer ends wins
- **Strategy**: Stay alert and bid smart

### 2. Dutch Reverse eAuction

- **Description**: Price goes up over time
- **Key Feature**: First supplier to accept current price wins instantly
- **Strategy**: Timing is everything

### 3. Dutch Preferred eAuction

- **Description**: Like Dutch but with priority access for preferred suppliers
- **Key Feature**: Preferred suppliers get early access at each price step
- **Strategy**: Speed and priority access matter

### 4. Japanese Reverse eAuction

- **Description**: Price decreases gradually
- **Key Feature**: Must confirm staying in each round
- **Strategy**: Last supplier remaining wins

### 5. Japanese No Rank eAuction

- **Description**: Like Japanese but no winner is awarded
- **Key Feature**: Buyer attributes lot outside the auction
- **Strategy**: All suppliers must choose to accept new prices

### 6. Sealed Bid eAuction

- **Description**: Confidential bids until auction ends
- **Key Feature**: Lowest final bid wins
- **Strategy**: Submit most competitive bid

## Content Sections

Each auction type includes:

1. **Title & Description** - Basic overview
2. **How It Works** - Detailed explanation of mechanics
3. **How to Win** - Winning strategies
4. **Timing Explained** - Time management and rules
5. **Pre-bid Explanation** - Understanding pre-bidding
6. **Scenarios** - Different possible outcomes
7. **Example Details** - Specific auction parameters

## Benefits of Markdown Format

### Advantages over JSON:

- ✅ **Human-readable** - Easy to read and understand
- ✅ **Version control friendly** - Better diff tracking in Git
- ✅ **Editable** - Can be edited with any text editor
- ✅ **Structured** - Clear hierarchy with headers
- ✅ **Searchable** - Easy to search for specific content
- ✅ **Collaborative** - Better for team editing and reviews

### Use Cases:

- Content review and editing
- Translation management
- Documentation generation
- Training material creation
- Content versioning and history

## Migration Notes

The JSON files have been converted to Markdown while preserving:

- All original content and structure
- Emoji icons and formatting
- Variable placeholders (e.g., `{scenarioCount}`)
- HTML formatting where present
- All text content in both languages

## Next Steps

1. **Review** the Markdown files for accuracy
2. **Update** any content as needed
3. **Consider** creating separate files for each auction type
4. **Implement** a system to convert Markdown back to JSON if needed
5. **Update** the application to use the new format

## File Locations

```
content/
├── TRAINING_INDEX.md (this file)
├── en/
│   ├── trainings.json (original)
│   └── trainings.md (new)
└── fr/
    ├── trainings.json (original)
    └── trainings.md (new)
```
