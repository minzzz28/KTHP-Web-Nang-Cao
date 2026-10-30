-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `role` ENUM('STUDENT', 'LANDLORD', 'ADMIN') NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `verification_status` ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    INDEX `users_role_status_idx`(`role`, `status`),
    INDEX `users_verification_status_idx`(`verification_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `student_code` VARCHAR(50) NULL,
    `university_id` INTEGER NULL,
    `school_email` VARCHAR(191) NULL,
    `faculty` VARCHAR(120) NULL,
    `academic_year` VARCHAR(30) NULL,
    `hometown` VARCHAR(120) NULL,
    `bio` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_profiles_user_id_key`(`user_id`),
    UNIQUE INDEX `student_profiles_student_code_key`(`student_code`),
    UNIQUE INDEX `student_profiles_school_email_key`(`school_email`),
    INDEX `student_profiles_university_id_idx`(`university_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landlord_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `business_name` VARCHAR(191) NULL,
    `national_id` VARCHAR(32) NULL,
    `contact_address` VARCHAR(500) NULL,
    `bio` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `landlord_profiles_user_id_key`(`user_id`),
    UNIQUE INDEX `landlord_profiles_national_id_key`(`national_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `reviewed_by_id` INTEGER NULL,
    `type` ENUM('STUDENT', 'LANDLORD') NOT NULL,
    `status` ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `student_code` VARCHAR(50) NULL,
    `school_email` VARCHAR(191) NULL,
    `document_url` VARCHAR(500) NULL,
    `note` TEXT NULL,
    `reviewer_note` TEXT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `verification_requests_user_id_status_created_at_idx`(`user_id`, `status`, `created_at`),
    INDEX `verification_requests_reviewed_by_id_idx`(`reviewed_by_id`),
    INDEX `verification_requests_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `universities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(500) NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `website` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `universities_code_key`(`code`),
    UNIQUE INDEX `universities_name_key`(`name`),
    INDEX `universities_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `landlord_id` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `address` VARCHAR(500) NOT NULL,
    `ward` VARCHAR(120) NULL,
    `district` VARCHAR(120) NULL,
    `city` VARCHAR(120) NOT NULL DEFAULT 'Hà Nội',
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `rules` TEXT NULL,
    `opening_hours` VARCHAR(120) NULL,
    `contact_phone` VARCHAR(30) NULL,
    `verification_status` ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `properties_slug_key`(`slug`),
    INDEX `properties_landlord_id_idx`(`landlord_id`),
    INDEX `properties_city_district_idx`(`city`, `district`),
    INDEX `properties_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `properties_verification_status_idx`(`verification_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `deposit` DECIMAL(12, 2) NOT NULL,
    `area` DECIMAL(8, 2) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `available_slots` INTEGER NOT NULL,
    `type` ENUM('PRIVATE_ROOM', 'SHARED_ROOM', 'STUDIO', 'APARTMENT', 'DORMITORY') NOT NULL,
    `status` ENUM('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'HIDDEN') NOT NULL DEFAULT 'AVAILABLE',
    `electricity_price` DECIMAL(12, 2) NOT NULL,
    `water_price` DECIMAL(12, 2) NOT NULL,
    `internet_fee` DECIMAL(12, 2) NOT NULL,
    `parking_fee` DECIMAL(12, 2) NOT NULL,
    `service_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `location_score` DECIMAL(3, 1) NULL,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rooms_property_id_idx`(`property_id`),
    INDEX `rooms_price_idx`(`price`),
    INDEX `rooms_status_price_idx`(`status`, `price`),
    INDEX `rooms_type_status_idx`(`type`, `status`),
    INDEX `rooms_created_at_idx`(`created_at`),
    UNIQUE INDEX `rooms_property_id_code_key`(`property_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_cover` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `room_images_room_id_is_cover_idx`(`room_id`, `is_cover`),
    UNIQUE INDEX `room_images_room_id_sort_order_key`(`room_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `amenities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(100) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `category` VARCHAR(80) NULL,
    `icon` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `amenities_slug_key`(`slug`),
    UNIQUE INDEX `amenities_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_amenities` (
    `room_id` INTEGER NOT NULL,
    `amenity_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `room_amenities_amenity_id_idx`(`amenity_id`),
    PRIMARY KEY (`room_id`, `amenity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `room_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_room_id_idx`(`room_id`),
    UNIQUE INDEX `favorites_student_id_room_id_key`(`student_id`, `room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_price_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `old_price` DECIMAL(12, 2) NULL,
    `new_price` DECIMAL(12, 2) NOT NULL,
    `changed_by_id` INTEGER NULL,
    `reason` VARCHAR(255) NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `room_price_histories_room_id_changed_at_idx`(`room_id`, `changed_at`),
    INDEX `room_price_histories_changed_by_id_idx`(`changed_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `viewer_id` INTEGER NULL,
    `session_id` VARCHAR(191) NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `room_views_room_id_viewed_at_idx`(`room_id`, `viewed_at`),
    INDEX `room_views_viewer_id_viewed_at_idx`(`viewer_id`, `viewed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roommate_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `university_id` INTEGER NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NOT NULL,
    `hometown` VARCHAR(120) NULL,
    `faculty` VARCHAR(120) NULL,
    `academic_year` VARCHAR(30) NULL,
    `budget_min` DECIMAL(12, 2) NOT NULL,
    `budget_max` DECIMAL(12, 2) NOT NULL,
    `preferred_area` VARCHAR(255) NULL,
    `max_distance_km` DECIMAL(5, 2) NULL,
    `is_smoking` BOOLEAN NOT NULL DEFAULT false,
    `accepts_smoking` BOOLEAN NOT NULL DEFAULT false,
    `has_pets` BOOLEAN NOT NULL DEFAULT false,
    `accepts_pets` BOOLEAN NOT NULL DEFAULT false,
    `cooks_often` BOOLEAN NOT NULL DEFAULT false,
    `sleep_time` VARCHAR(5) NULL,
    `wake_up_time` VARCHAR(5) NULL,
    `cleanliness_level` INTEGER NOT NULL DEFAULT 3,
    `social_preference` ENUM('QUIET', 'BALANCED', 'SOCIAL') NOT NULL DEFAULT 'BALANCED',
    `preferred_roommates` INTEGER NOT NULL DEFAULT 1,
    `bio` TEXT NULL,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roommate_profiles_student_id_key`(`student_id`),
    INDEX `roommate_profiles_university_id_idx`(`university_id`),
    INDEX `roommate_profiles_is_visible_budget_min_budget_max_idx`(`is_visible`, `budget_min`, `budget_max`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roommate_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `room_id` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `area` VARCHAR(255) NULL,
    `budget_per_person` DECIMAL(12, 2) NOT NULL,
    `needed_people` INTEGER NOT NULL,
    `preferred_gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    `move_in_date` DATE NULL,
    `requirements` TEXT NULL,
    `status` ENUM('OPEN', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `roommate_posts_student_id_status_idx`(`student_id`, `status`),
    INDEX `roommate_posts_room_id_idx`(`room_id`),
    INDEX `roommate_posts_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roommate_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sender_id` INTEGER NOT NULL,
    `recipient_id` INTEGER NOT NULL,
    `post_id` INTEGER NULL,
    `room_id` INTEGER NULL,
    `message` TEXT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `active_pair_key` VARCHAR(191) NULL,
    `responded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roommate_requests_active_pair_key_key`(`active_pair_key`),
    INDEX `roommate_requests_recipient_id_status_idx`(`recipient_id`, `status`),
    INDEX `roommate_requests_sender_id_status_idx`(`sender_id`, `status`),
    INDEX `roommate_requests_post_id_idx`(`post_id`),
    INDEX `roommate_requests_room_id_idx`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creator_id` INTEGER NOT NULL,
    `room_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `max_members` INTEGER NOT NULL,
    `budget_per_person` DECIMAL(12, 2) NOT NULL,
    `move_in_date` DATE NULL,
    `rules` TEXT NULL,
    `zalo_group_url` VARCHAR(500) NULL,
    `telegram_group_url` VARCHAR(500) NULL,
    `status` ENUM('OPEN', 'FULL', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rental_groups_creator_id_idx`(`creator_id`),
    INDEX `rental_groups_room_id_idx`(`room_id`),
    INDEX `rental_groups_status_move_in_date_idx`(`status`, `move_in_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `role` ENUM('LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `left_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `group_members_student_id_idx`(`student_id`),
    UNIQUE INDEX `group_members_group_id_student_id_key`(`group_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('DIRECT', 'GROUP') NOT NULL,
    `title` VARCHAR(191) NULL,
    `direct_pair_key` VARCHAR(191) NULL,
    `rental_group_id` INTEGER NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `conversations_direct_pair_key_key`(`direct_pair_key`),
    UNIQUE INDEX `conversations_rental_group_id_key`(`rental_group_id`),
    INDEX `conversations_type_last_message_at_idx`(`type`, `last_message_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `last_read_at` DATETIME(3) NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `left_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `conversation_members_user_id_last_read_at_idx`(`user_id`, `last_read_at`),
    UNIQUE INDEX `conversation_members_conversation_id_user_id_key`(`conversation_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('TEXT', 'SYSTEM') NOT NULL DEFAULT 'TEXT',
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `edited_at` DATETIME(3) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `messages_conversation_id_sent_at_idx`(`conversation_id`, `sent_at`),
    INDEX `messages_sender_id_sent_at_idx`(`sender_id`, `sent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `viewing_appointments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `landlord_id` INTEGER NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `proposed_at` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `student_note` TEXT NULL,
    `landlord_note` TEXT NULL,
    `responded_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `viewing_appointments_room_id_scheduled_at_idx`(`room_id`, `scheduled_at`),
    INDEX `viewing_appointments_landlord_id_status_scheduled_at_idx`(`landlord_id`, `status`, `scheduled_at`),
    INDEX `viewing_appointments_student_id_status_scheduled_at_idx`(`student_id`, `status`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contract_number` VARCHAR(80) NOT NULL,
    `room_id` INTEGER NOT NULL,
    `landlord_id` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `rent` DECIMAL(12, 2) NOT NULL,
    `deposit` DECIMAL(12, 2) NOT NULL,
    `terms` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED') NOT NULL DEFAULT 'DRAFT',
    `signed_at` DATETIME(3) NULL,
    `terminated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contracts_contract_number_key`(`contract_number`),
    INDEX `contracts_room_id_status_idx`(`room_id`, `status`),
    INDEX `contracts_landlord_id_status_idx`(`landlord_id`, `status`),
    INDEX `contracts_status_end_date_idx`(`status`, `end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_tenants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contract_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `is_primary_tenant` BOOLEAN NOT NULL DEFAULT false,
    `move_in_date` DATE NULL,
    `move_out_date` DATE NULL,
    `signed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contract_tenants_student_id_idx`(`student_id`),
    UNIQUE INDEX `contract_tenants_contract_id_student_id_key`(`contract_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_number` VARCHAR(80) NOT NULL,
    `contract_id` INTEGER NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `electricity_start` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `electricity_end` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `electricity_usage` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `electricity_unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `electricity_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `water_start` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `water_end` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `water_usage` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `water_unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `water_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `rent_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `internet_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `parking_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `service_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `other_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_invoice_number_key`(`invoice_number`),
    INDEX `invoices_contract_id_status_due_date_idx`(`contract_id`, `status`, `due_date`),
    INDEX `invoices_status_due_date_idx`(`status`, `due_date`),
    UNIQUE INDEX `invoices_contract_id_period_start_period_end_key`(`contract_id`, `period_start`, `period_end`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `type` ENUM('RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'PARKING', 'SERVICE', 'OTHER') NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `invoice_items_invoice_id_type_idx`(`invoice_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contract_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `room_id` INTEGER NOT NULL,
    `landlord_id` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `room_quality` INTEGER NOT NULL,
    `security` INTEGER NOT NULL,
    `cleanliness` INTEGER NOT NULL,
    `wifi_quality` INTEGER NOT NULL,
    `utility_price` INTEGER NOT NULL,
    `listing_accuracy` INTEGER NOT NULL,
    `landlord_attitude` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `status` ENUM('PUBLISHED', 'HIDDEN') NOT NULL DEFAULT 'PUBLISHED',
    `moderated_by_id` INTEGER NULL,
    `moderation_note` TEXT NULL,
    `moderated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reviews_student_id_created_at_idx`(`student_id`, `created_at`),
    INDEX `reviews_room_id_status_created_at_idx`(`room_id`, `status`, `created_at`),
    INDEX `reviews_landlord_id_status_idx`(`landlord_id`, `status`),
    UNIQUE INDEX `reviews_contract_id_student_id_key`(`contract_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reporter_id` INTEGER NOT NULL,
    `target_type` ENUM('ROOM', 'USER', 'ROOMMATE_POST', 'REVIEW') NOT NULL,
    `target_user_id` INTEGER NULL,
    `room_id` INTEGER NULL,
    `roommate_post_id` INTEGER NULL,
    `review_id` INTEGER NULL,
    `reason` ENUM('WRONG_INFO', 'WRONG_IMAGE', 'WRONG_PRICE', 'ROOM_UNAVAILABLE', 'WRONG_ADDRESS', 'SCAM', 'FAKE_ACCOUNT', 'INAPPROPRIATE_CONTENT', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `evidence_url` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewed_by_id` INTEGER NULL,
    `admin_note` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reports_reporter_id_created_at_idx`(`reporter_id`, `created_at`),
    INDEX `reports_target_user_id_idx`(`target_user_id`),
    INDEX `reports_room_id_idx`(`room_id`),
    INDEX `reports_roommate_post_id_idx`(`roommate_post_id`),
    INDEX `reports_review_id_idx`(`review_id`),
    INDEX `reports_reviewed_by_id_idx`(`reviewed_by_id`),
    INDEX `reports_target_type_idx`(`target_type`),
    INDEX `reports_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('ROOM_MATCH', 'PRICE_CHANGED', 'ROOMMATE_REQUEST', 'ROOMMATE_REQUEST_RESPONSE', 'MESSAGE', 'APPOINTMENT', 'CONTRACT', 'INVOICE', 'VERIFICATION', 'REPORT') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `link_url` VARCHAR(500) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_is_read_created_at_idx`(`user_id`, `is_read`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nearby_places` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('MARKET', 'SUPERMARKET', 'PHARMACY', 'HOSPITAL', 'BUS_STOP', 'RESTAURANT', 'CONVENIENCE_STORE', 'SCHOOL') NOT NULL,
    `address` VARCHAR(500) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `distance_meters` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `nearby_places_property_id_category_idx`(`property_id`, `category`),
    INDEX `nearby_places_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_university_id_fkey` FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `landlord_profiles` ADD CONSTRAINT `landlord_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_requests` ADD CONSTRAINT `verification_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_requests` ADD CONSTRAINT `verification_requests_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_images` ADD CONSTRAINT `room_images_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_amenities` ADD CONSTRAINT `room_amenities_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_amenities` ADD CONSTRAINT `room_amenities_amenity_id_fkey` FOREIGN KEY (`amenity_id`) REFERENCES `amenities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_price_histories` ADD CONSTRAINT `room_price_histories_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_price_histories` ADD CONSTRAINT `room_price_histories_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_views` ADD CONSTRAINT `room_views_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_views` ADD CONSTRAINT `room_views_viewer_id_fkey` FOREIGN KEY (`viewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_profiles` ADD CONSTRAINT `roommate_profiles_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_profiles` ADD CONSTRAINT `roommate_profiles_university_id_fkey` FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_posts` ADD CONSTRAINT `roommate_posts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_posts` ADD CONSTRAINT `roommate_posts_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_requests` ADD CONSTRAINT `roommate_requests_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_requests` ADD CONSTRAINT `roommate_requests_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_requests` ADD CONSTRAINT `roommate_requests_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `roommate_posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roommate_requests` ADD CONSTRAINT `roommate_requests_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_groups` ADD CONSTRAINT `rental_groups_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_groups` ADD CONSTRAINT `rental_groups_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `rental_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_rental_group_id_fkey` FOREIGN KEY (`rental_group_id`) REFERENCES `rental_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viewing_appointments` ADD CONSTRAINT `viewing_appointments_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viewing_appointments` ADD CONSTRAINT `viewing_appointments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viewing_appointments` ADD CONSTRAINT `viewing_appointments_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_tenants` ADD CONSTRAINT `contract_tenants_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_tenants` ADD CONSTRAINT `contract_tenants_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_moderated_by_id_fkey` FOREIGN KEY (`moderated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_roommate_post_id_fkey` FOREIGN KEY (`roommate_post_id`) REFERENCES `roommate_posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nearby_places` ADD CONSTRAINT `nearby_places_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
