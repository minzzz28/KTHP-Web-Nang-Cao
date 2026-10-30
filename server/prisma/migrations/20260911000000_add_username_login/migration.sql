-- Permit an account to use a username, an email address, or both as its login identifier.
-- Existing email accounts remain valid and receive usernames through the idempotent demo seed.
ALTER TABLE `users`
    ADD COLUMN `username` VARCHAR(30) NULL,
    MODIFY COLUMN `email` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `users_username_key`(`username`);
