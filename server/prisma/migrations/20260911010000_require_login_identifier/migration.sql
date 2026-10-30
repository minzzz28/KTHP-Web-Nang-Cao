-- Keep the database invariant aligned with the registration API: every user
-- must have at least one login identifier, while still allowing username-only
-- and email-only accounts.
ALTER TABLE `users`
    ADD CONSTRAINT `users_login_identifier_check`
    CHECK (`username` IS NOT NULL OR `email` IS NOT NULL);
