  ((auth.uid() = buyer_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.admin = true)))))

  -- Je propose de le changer par

  (auth.uid() = buyer_id) OR (SELECT admin FROM profiles WHERE id = auth.uid()) = true