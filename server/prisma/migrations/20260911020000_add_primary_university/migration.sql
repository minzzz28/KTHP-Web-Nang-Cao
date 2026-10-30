-- Store the campus the product should prioritize in a data field rather than
-- hard-coding it in the client. The seed designates Phenikaa as primary.
ALTER TABLE `universities`
    ADD COLUMN `is_primary` TINYINT(1) NOT NULL DEFAULT 0;
