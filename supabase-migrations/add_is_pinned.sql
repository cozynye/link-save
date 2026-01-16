-- Add is_pinned column to links table
ALTER TABLE links
ADD COLUMN is_pinned BOOLEAN DEFAULT false NOT NULL;

-- Add index for better query performance on pinned items
CREATE INDEX idx_links_is_pinned ON links(is_pinned);

-- Add comment for documentation
COMMENT ON COLUMN links.is_pinned IS 'Whether the link is pinned to the top of the list';
