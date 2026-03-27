-- Additional RLS: allow service role to manage result_cache
-- Service role bypasses RLS by default, so no policy needed for it.
-- The "No direct access" policy blocks anon/authenticated.
-- This file is a placeholder for any future RLS adjustments.

-- Grant usage to service role (default)
-- Service role already has full access when using createClient with service_role key.
