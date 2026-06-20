-- Per-account categories (Spending and Savings each get their own
-- independent, separately editable outgoing/incoming lists instead of
-- sharing one global set).
ALTER TABLE categories ADD COLUMN account_id INTEGER REFERENCES accounts(id);

-- Existing (003-seeded) non-system categories become Spending's.
UPDATE categories SET account_id = 1 WHERE is_system = 0;

-- transfer-in/transfer-out (is_system=1) stay account_id = NULL: they're
-- written as literal strings by the transfer flow on both accounts and
-- never appear in a per-account picker, so they don't need duplicating.

-- Swap the old global (lower(name), list) unique index for a per-account one
-- BEFORE cloning into Savings below, otherwise the first cloned row (e.g.
-- "food"/outgoing) collides with the existing Spending "food"/outgoing row
-- under the old index and the INSERT throws UNIQUE constraint failed.
DROP INDEX idx_categories_name_list;
CREATE UNIQUE INDEX idx_categories_account_name_list ON categories(account_id, lower(name), list);

-- Clone them into Savings' own independent set (same names/colors initially,
-- editable separately from this point forward).
INSERT INTO categories (name, list, is_system, color, account_id)
SELECT name, list, is_system, color, 2 FROM categories WHERE is_system = 0 AND account_id = 1;
