-- Migration: Add row_number columns to links and keywords tables
-- This allows viewing data in insertion order with sequential numbering (1, 2, 3...)

-- Add row_number column to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS row_number SERIAL;

-- Add row_number column to keywords table
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS row_number SERIAL;

-- Add row_number column to keyword_entries table
ALTER TABLE keyword_entries ADD COLUMN IF NOT EXISTS row_number SERIAL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_links_row_number ON links(row_number);
CREATE INDEX IF NOT EXISTS idx_keywords_row_number ON keywords(row_number);
CREATE INDEX IF NOT EXISTS idx_keyword_entries_row_number ON keyword_entries(row_number);

-- Comment for documentation
COMMENT ON COLUMN links.row_number IS 'Sequential number for display order (auto-incremented)';
COMMENT ON COLUMN keywords.row_number IS 'Sequential number for display order (auto-incremented)';
COMMENT ON COLUMN keyword_entries.row_number IS 'Sequential number for display order (auto-incremented)';
