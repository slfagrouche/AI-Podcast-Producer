-- Drop policies that depend on the user_id column
DROP POLICY IF EXISTS "Allow insert for matching user_id" ON public.podcasts;
DROP POLICY IF EXISTS "Allow select for matching user_id" ON public.podcasts;
DROP POLICY IF EXISTS "Allow update for matching user_id" ON public.podcasts;
DROP POLICY IF EXISTS "Allow delete for matching user_id" ON public.podcasts;

-- Alter the user_id column type to text
ALTER TABLE public.podcasts ALTER COLUMN user_id TYPE text;

-- Recreate the RLS policies with the correct syntax
CREATE POLICY "Allow insert for matching user_id"
  ON public.podcasts
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Allow select for matching user_id"
  ON public.podcasts
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Allow update for matching user_id"
  ON public.podcasts
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Allow delete for matching user_id"
  ON public.podcasts
  FOR DELETE
  USING (user_id = auth.uid()::text);
