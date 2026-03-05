CREATE POLICY "trainings_select_policy" ON "public"."trainings"
AS PERMISSIVE FOR SELECT
TO public
USING (
  seller_email = ((SELECT auth.jwt() AS jwt) ->> 'email'::text)
);
