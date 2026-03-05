-- Migration: Update GPT icons from Material Design Icons to gemstone SVGs
-- Date: 2026-02-12
-- Purpose: Replace MDI icons with custom gemstone SVG icons

-- Update existing GPT icons to use new gemstone icon names
-- Maps old MDI icon names to new gemstone icon names

-- Default fallback: any unrecognized icon or NULL becomes 'diamond'
UPDATE gpts
SET icon = 'diamond'
WHERE icon IS NULL
   OR icon NOT IN ('diamond', 'ruby', 'emerald', 'sapphire', 'topaz', 'heart', 'crystal-blue', 'crystal-purple');

-- Optional: Map specific old icons to specific gemstones based on semantic meaning
-- This is a best-effort mapping - adjust as needed

-- Robots -> Diamond (default, most versatile)
UPDATE gpts SET icon = 'diamond' WHERE icon LIKE 'mdi-robot%';

-- Brain/Intelligence -> Sapphire (wisdom)
UPDATE gpts SET icon = 'sapphire' WHERE icon = 'mdi-brain';

-- Sparkles/Stars -> Crystal Purple (magical)
UPDATE gpts SET icon = 'crystal-purple' WHERE icon IN ('mdi-star-four-points', 'mdi-atom');

-- Lightning/Energy -> Topaz (energy)
UPDATE gpts SET icon = 'topaz' WHERE icon IN ('mdi-lightning-bolt', 'mdi-rocket-launch-outline');

-- Search/Documents -> Emerald (clarity)
UPDATE gpts SET icon = 'emerald' WHERE icon IN ('mdi-file-search-outline', 'mdi-book-open-page-variant', 'mdi-database-outline');

-- Writing/Creative -> Ruby (passion)
UPDATE gpts SET icon = 'ruby' WHERE icon IN ('mdi-pencil-outline', 'mdi-palette-outline');

-- Legal/Formal -> Crystal Blue (precision)
UPDATE gpts SET icon = 'crystal-blue' WHERE icon IN ('mdi-gavel', 'mdi-shield-check-outline');

-- Chat/Communication -> Heart (connection)
UPDATE gpts SET icon = 'heart' WHERE icon IN ('mdi-message-text-outline', 'mdi-lightbulb-outline');

-- Calculator/Code -> Sapphire (logic)
UPDATE gpts SET icon = 'sapphire' WHERE icon IN ('mdi-calculator', 'mdi-code-tags', 'mdi-chip', 'mdi-chart-line');

-- Final cleanup: ensure all icons are valid gemstone names
UPDATE gpts
SET icon = 'diamond'
WHERE icon NOT IN ('diamond', 'ruby', 'emerald', 'sapphire', 'topaz', 'heart', 'crystal-blue', 'crystal-purple');

-- Update the column comment to reflect new icon format
COMMENT ON COLUMN gpts.icon IS 'Gemstone icon name (e.g., diamond, ruby, emerald, sapphire, topaz, heart, crystal-blue, crystal-purple) for custom GPT avatar';
