-- MySQL dump 10.13  Distrib 8.4.11, for Linux (x86_64)
--
-- Host: localhost    Database: student_rental
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('21997c4e-e418-402d-afe8-71cba61bfac3','c0e3f95123f605adba886fdc77e6e280f3cba1280c43f1ddb575dc0589900693','2026-09-10 18:44:45.561','20260911010000_require_login_identifier',NULL,NULL,'2026-09-10 18:44:45.173',1),('6abd5468-4c78-4b68-a931-9ca8ee2d2aad','ac9d34ec3ed77174591f2406b7bf46ec9dfb39714c404d88506b37bc06797a49','2026-09-10 18:36:46.710','20260911000000_add_username_login',NULL,NULL,'2026-09-10 18:36:46.352',1),('e6986b33-12b5-4a86-a43e-abbd32db8255','98f03439ad1565f2bf536cdc40fa80a85a9cc76e23eb7022f3e53bf6d294ea2c','2026-09-09 01:09:37.216','20260907160000_init',NULL,NULL,'2026-09-09 01:09:21.646',1),('e6c206d4-253c-451c-9906-f9ebd6550c89','0fe02d0c16cfa6f1783f66e3aaa33b7ce3741c8771cac0cb6c4ad9b6a87f0185','2026-09-10 19:07:13.521','20260911020000_add_primary_university',NULL,NULL,'2026-09-10 19:07:13.397',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `amenities`
--

DROP TABLE IF EXISTS `amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amenities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `amenities_slug_key` (`slug`),
  UNIQUE KEY `amenities_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amenities`
--

LOCK TABLES `amenities` WRITE;
/*!40000 ALTER TABLE `amenities` DISABLE KEYS */;
INSERT INTO `amenities` VALUES (1,'wifi','Wifi','Kết nối','wifi','2026-09-09 01:09:49.018','2026-09-12 17:07:41.901'),(2,'air-conditioner','Điều hòa','Thiết bị','snow','2026-09-09 01:09:49.038','2026-09-12 17:07:41.919'),(3,'water-heater','Bình nóng lạnh','Thiết bị','thermometer-half','2026-09-09 01:09:49.053','2026-09-12 17:07:41.932'),(4,'private-bathroom','Nhà vệ sinh riêng','Phòng tắm','door-closed','2026-09-09 01:09:49.072','2026-09-12 17:07:41.947'),(5,'parking','Chỗ để xe','Dịch vụ','bicycle','2026-09-09 01:09:49.087','2026-09-12 17:07:41.961'),(6,'kitchen','Bếp','Không gian','cup-hot','2026-09-09 01:09:49.103','2026-09-12 17:07:41.975'),(7,'balcony','Ban công','Không gian','window','2026-09-09 01:09:49.123','2026-09-12 17:07:41.990'),(8,'washing-machine','Máy giặt','Thiết bị','water','2026-09-09 01:09:49.141','2026-09-12 17:07:42.007'),(9,'pet-friendly','Cho phép thú cưng','Quy định','heart','2026-09-09 01:09:49.154','2026-09-12 17:07:42.022'),(10,'security-camera','Camera an ninh','An ninh','camera-video','2026-09-09 01:09:49.171','2026-09-12 17:07:42.038'),(11,'elevator','Thang máy','Tòa nhà','arrows-expand','2026-09-09 01:09:49.185','2026-09-12 17:07:42.060'),(12,'bed','Giường ngủ','Nội thất','bed','2026-09-09 01:09:49.199','2026-09-12 17:07:42.075');
/*!40000 ALTER TABLE `amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contract_tenants`
--

DROP TABLE IF EXISTS `contract_tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract_tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_id` int NOT NULL,
  `student_id` int NOT NULL,
  `is_primary_tenant` tinyint(1) NOT NULL DEFAULT '0',
  `move_in_date` date DEFAULT NULL,
  `move_out_date` date DEFAULT NULL,
  `signed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contract_tenants_contract_id_student_id_key` (`contract_id`,`student_id`),
  KEY `contract_tenants_student_id_idx` (`student_id`),
  CONSTRAINT `contract_tenants_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `contract_tenants_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract_tenants`
--

LOCK TABLES `contract_tenants` WRITE;
/*!40000 ALTER TABLE `contract_tenants` DISABLE KEYS */;
INSERT INTO `contract_tenants` VALUES (1,1,2,1,'2026-08-01',NULL,'2026-07-28 03:00:00.000','2026-09-09 01:09:53.492','2026-09-12 17:07:44.988'),(2,1,3,0,'2026-08-01',NULL,'2026-07-28 03:00:00.000','2026-09-09 01:09:53.512','2026-09-12 17:07:45.005'),(3,2,4,1,'2026-09-01',NULL,'2026-08-27 03:00:00.000','2026-09-09 01:09:53.531','2026-09-12 17:07:45.027');
/*!40000 ALTER TABLE `contract_tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_number` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` int NOT NULL,
  `landlord_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `rent` decimal(12,2) NOT NULL,
  `deposit` decimal(12,2) NOT NULL,
  `terms` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','ACTIVE','EXPIRED','TERMINATED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `signed_at` datetime(3) DEFAULT NULL,
  `terminated_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contracts_contract_number_key` (`contract_number`),
  KEY `contracts_room_id_status_idx` (`room_id`,`status`),
  KEY `contracts_landlord_id_status_idx` (`landlord_id`,`status`),
  KEY `contracts_status_end_date_idx` (`status`,`end_date`),
  CONSTRAINT `contracts_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `contracts_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` VALUES (1,'HD-2026-001',7,10,'2026-08-01','2027-07-31',2800000.00,2800000.00,'Tiền phòng thanh toán trước ngày 05 hàng tháng. Người thuê giữ gìn tài sản và báo trước 30 ngày khi chấm dứt hợp đồng.','ACTIVE','2026-07-28 03:00:00.000',NULL,'2026-09-09 01:09:53.454','2026-09-12 17:07:44.949'),(2,'HD-2026-002',15,11,'2026-09-01','2027-08-31',2900000.00,2900000.00,'Điện, nước và dịch vụ được chốt theo chỉ số thực tế mỗi tháng. Người thuê không tự ý cho thuê lại.','ACTIVE','2026-08-27 03:00:00.000',NULL,'2026-09-09 01:09:53.473','2026-09-12 17:07:44.969');
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation_members`
--

DROP TABLE IF EXISTS `conversation_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `user_id` int NOT NULL,
  `last_read_at` datetime(3) DEFAULT NULL,
  `joined_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `left_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversation_members_conversation_id_user_id_key` (`conversation_id`,`user_id`),
  KEY `conversation_members_user_id_last_read_at_idx` (`user_id`,`last_read_at`),
  CONSTRAINT `conversation_members_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `conversation_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation_members`
--

LOCK TABLES `conversation_members` WRITE;
/*!40000 ALTER TABLE `conversation_members` DISABLE KEYS */;
INSERT INTO `conversation_members` VALUES (1,1,2,'2026-09-14 06:20:18.899','2026-09-09 01:09:53.198',NULL,'2026-09-09 01:09:53.198','2026-09-14 06:20:18.902'),(2,1,10,'2026-09-14 06:18:21.082','2026-09-09 01:09:53.216',NULL,'2026-09-09 01:09:53.216','2026-09-14 06:18:21.086'),(3,2,2,'2026-09-14 06:20:17.452','2026-09-09 01:09:53.237',NULL,'2026-09-09 01:09:53.237','2026-09-14 06:20:17.455'),(4,2,4,NULL,'2026-09-09 01:09:53.252',NULL,'2026-09-09 01:09:53.252','2026-09-12 17:07:44.843'),(29,15,33,'2026-09-14 07:03:23.482','2026-09-12 03:05:10.788',NULL,'2026-09-12 03:05:10.788','2026-09-14 07:03:23.484'),(30,15,2,'2026-09-14 06:19:56.725','2026-09-12 03:05:10.788',NULL,'2026-09-12 03:05:10.788','2026-09-14 06:19:56.740'),(31,16,3,'2026-09-12 03:09:49.786','2026-09-12 03:09:49.649',NULL,'2026-09-12 03:09:49.649','2026-09-12 03:09:49.787'),(32,16,5,'2026-09-12 03:09:51.294','2026-09-12 03:09:49.649',NULL,'2026-09-12 03:09:49.649','2026-09-12 03:09:51.295');
/*!40000 ALTER TABLE `conversation_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('DIRECT','GROUP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direct_pair_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rental_group_id` int DEFAULT NULL,
  `last_message_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversations_direct_pair_key_key` (`direct_pair_key`),
  UNIQUE KEY `conversations_rental_group_id_key` (`rental_group_id`),
  KEY `conversations_type_last_message_at_idx` (`type`,`last_message_at`),
  CONSTRAINT `conversations_rental_group_id_fkey` FOREIGN KEY (`rental_group_id`) REFERENCES `rental_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,'DIRECT',NULL,'2:10',NULL,'2026-09-02 04:15:00.000','2026-09-09 01:09:53.163','2026-09-12 17:07:44.753'),(2,'GROUP','Nhóm tìm phòng Bách Khoa tháng 10',NULL,1,'2026-09-03 04:20:00.000','2026-09-09 01:09:53.179','2026-09-12 17:07:44.770'),(15,'DIRECT',NULL,'2:33',NULL,'2026-09-14 06:19:56.419','2026-09-12 03:05:10.788','2026-09-14 06:19:56.428'),(16,'DIRECT',NULL,'3:5',NULL,NULL,'2026-09-12 03:09:49.649','2026-09-12 03:09:49.649');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `room_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_student_id_room_id_key` (`student_id`,`room_id`),
  KEY `favorites_room_id_idx` (`room_id`),
  CONSTRAINT `favorites_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `favorites_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (1,2,5,'2026-09-09 01:09:52.551'),(2,2,6,'2026-09-09 01:09:52.571'),(3,2,12,'2026-09-09 01:09:52.589'),(4,3,7,'2026-09-09 01:09:52.606'),(5,3,4,'2026-09-09 01:09:52.624'),(6,5,13,'2026-09-09 01:09:52.640'),(7,6,11,'2026-09-09 01:09:52.655'),(8,7,16,'2026-09-09 01:09:52.672'),(9,2,19,'2026-09-10 19:07:23.622'),(10,2,20,'2026-09-10 19:07:23.647');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `student_id` int NOT NULL,
  `role` enum('LEADER','MEMBER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEMBER',
  `joined_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `left_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_members_group_id_student_id_key` (`group_id`,`student_id`),
  KEY `group_members_student_id_idx` (`student_id`),
  CONSTRAINT `group_members_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `rental_groups` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `group_members_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_members`
--

LOCK TABLES `group_members` WRITE;
/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
INSERT INTO `group_members` VALUES (1,1,2,'LEADER','2026-09-03 03:30:00.000',NULL,'2026-09-09 01:09:53.126','2026-09-12 17:07:44.716'),(2,1,4,'MEMBER','2026-09-03 04:00:00.000',NULL,'2026-09-09 01:09:53.144','2026-09-12 17:07:44.734');
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `type` enum('RENT','ELECTRICITY','WATER','INTERNET','PARKING','SERVICE','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit_price` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `invoice_items_invoice_id_type_idx` (`invoice_id`,`type`),
  CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (1,1,'RENT','Tiền phòng',1.00,2800000.00,2800000.00,'2026-09-09 01:09:53.575'),(2,1,'ELECTRICITY','Tiền điện',35.00,3500.00,122500.00,'2026-09-09 01:09:53.594'),(3,1,'WATER','Tiền nước',5.00,20000.00,100000.00,'2026-09-09 01:09:53.616'),(4,1,'INTERNET','Internet',1.00,100000.00,100000.00,'2026-09-09 01:09:53.635'),(5,1,'PARKING','Gửi xe',1.00,100000.00,100000.00,'2026-09-09 01:09:53.652'),(6,1,'SERVICE','Phí dịch vụ',1.00,50000.00,50000.00,'2026-09-09 01:09:53.670'),(7,2,'RENT','Tiền phòng',1.00,2800000.00,2800000.00,'2026-09-09 01:09:53.713'),(8,2,'ELECTRICITY','Tiền điện',32.00,3500.00,112000.00,'2026-09-09 01:09:53.731'),(9,2,'WATER','Tiền nước',5.00,20000.00,100000.00,'2026-09-09 01:09:53.751'),(10,2,'INTERNET','Internet',1.00,100000.00,100000.00,'2026-09-09 01:09:53.769'),(11,2,'PARKING','Gửi xe',1.00,100000.00,100000.00,'2026-09-09 01:09:53.793'),(12,2,'SERVICE','Phí dịch vụ',1.00,50000.00,50000.00,'2026-09-09 01:09:53.811'),(13,3,'RENT','Tiền phòng',1.00,2900000.00,2900000.00,'2026-09-09 01:09:53.843'),(14,3,'ELECTRICITY','Tiền điện',26.00,3500.00,91000.00,'2026-09-09 01:09:53.863'),(15,3,'WATER','Tiền nước',4.00,20000.00,80000.00,'2026-09-09 01:09:53.881'),(16,3,'INTERNET','Internet',1.00,100000.00,100000.00,'2026-09-09 01:09:53.899'),(17,3,'PARKING','Gửi xe',1.00,80000.00,80000.00,'2026-09-09 01:09:53.920'),(18,3,'SERVICE','Phí dịch vụ',1.00,30000.00,30000.00,'2026-09-09 01:09:53.937'),(19,3,'OTHER','Dịch vụ khác',1.00,50000.00,50000.00,'2026-09-09 01:09:53.953');
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_id` int NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `due_date` date NOT NULL,
  `electricity_start` decimal(12,2) NOT NULL DEFAULT '0.00',
  `electricity_end` decimal(12,2) NOT NULL DEFAULT '0.00',
  `electricity_usage` decimal(12,2) NOT NULL DEFAULT '0.00',
  `electricity_unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `electricity_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `water_start` decimal(12,2) NOT NULL DEFAULT '0.00',
  `water_end` decimal(12,2) NOT NULL DEFAULT '0.00',
  `water_usage` decimal(12,2) NOT NULL DEFAULT '0.00',
  `water_unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `water_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rent_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `internet_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `parking_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `service_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `other_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `status` enum('UNPAID','PAID','OVERDUE','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `issued_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `paid_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoice_number_key` (`invoice_number`),
  UNIQUE KEY `invoices_contract_id_period_start_period_end_key` (`contract_id`,`period_start`,`period_end`),
  KEY `invoices_contract_id_status_due_date_idx` (`contract_id`,`status`,`due_date`),
  KEY `invoices_status_due_date_idx` (`status`,`due_date`),
  CONSTRAINT `invoices_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,'HD-2026-001-202608',1,'2026-08-01','2026-08-31','2026-09-05',120.00,155.00,35.00,3500.00,122500.00,10.00,15.00,5.00,20000.00,100000.00,2800000.00,100000.00,100000.00,50000.00,0.00,3272500.00,'PAID','2026-09-01 02:00:00.000','2026-09-03 04:00:00.000','2026-09-09 01:09:53.550','2026-09-12 17:07:45.045'),(2,'HD-2026-001-202609',1,'2026-09-01','2026-09-30','2026-10-05',155.00,187.00,32.00,3500.00,112000.00,15.00,20.00,5.00,20000.00,100000.00,2800000.00,100000.00,100000.00,50000.00,0.00,3262000.00,'UNPAID','2026-10-01 02:00:00.000',NULL,'2026-09-09 01:09:53.686','2026-09-12 17:07:45.113'),(3,'HD-2026-002-202609',2,'2026-09-01','2026-09-30','2026-10-05',45.00,71.00,26.00,3500.00,91000.00,4.00,8.00,4.00,20000.00,80000.00,2900000.00,100000.00,80000.00,30000.00,50000.00,3331000.00,'OVERDUE','2026-10-01 02:00:00.000',NULL,'2026-09-09 01:09:53.825','2026-09-12 17:07:45.172');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `landlord_profiles`
--

DROP TABLE IF EXISTS `landlord_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `landlord_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `business_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `national_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `landlord_profiles_user_id_key` (`user_id`),
  UNIQUE KEY `landlord_profiles_national_id_key` (`national_id`),
  CONSTRAINT `landlord_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `landlord_profiles`
--

LOCK TABLES `landlord_profiles` WRITE;
/*!40000 ALTER TABLE `landlord_profiles` DISABLE KEYS */;
INSERT INTO `landlord_profiles` VALUES (1,10,'Nhà trọ Huy Minh',NULL,'Khu vực Hai Bà Trưng, Hà Nội','Chủ trọ hỗ trợ sinh viên xem phòng theo lịch hẹn.','2026-09-09 01:09:48.909','2026-09-12 17:07:41.790'),(2,11,'Nhà trọ Hà My',NULL,'Khu vực Đống Đa, Hà Nội','Có kinh nghiệm quản lý phòng trọ cho sinh viên.','2026-09-09 01:09:48.928','2026-09-12 17:07:41.811'),(3,12,'Nhà trọ Anh Tuấn',NULL,'Khu vực Cầu Giấy, Hà Nội','Hồ sơ đang chờ xác minh trong dữ liệu demo.','2026-09-09 01:09:48.943','2026-09-12 17:07:41.830'),(4,34,NULL,NULL,NULL,NULL,'2026-09-14 06:13:31.803','2026-09-14 06:13:31.803');
/*!40000 ALTER TABLE `landlord_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('TEXT','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TEXT',
  `sent_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `edited_at` datetime(3) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `messages_conversation_id_sent_at_idx` (`conversation_id`,`sent_at`),
  KEY `messages_sender_id_sent_at_idx` (`sender_id`,`sent_at`),
  CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,2,'Chào anh, phòng B101 còn có thể xem vào chiều thứ bảy không?','TEXT','2026-09-02 04:00:00.000',NULL,0),(2,1,10,'Chào em, phòng còn lịch xem lúc 15:00 thứ bảy. Em đặt lịch trên hệ thống giúp anh nhé.','TEXT','2026-09-02 04:10:00.000',NULL,0),(3,1,2,'Vâng, em đã gửi yêu cầu xem phòng. Cảm ơn anh.','TEXT','2026-09-02 04:15:00.000',NULL,0),(4,2,2,'Mình đã lưu phòng B102, chiều mai chúng ta cùng xem nhé.','TEXT','2026-09-03 04:00:00.000',NULL,0),(5,2,4,'Ổn đó, mình sẽ kiểm tra thêm chi phí điện nước trước khi quyết định.','TEXT','2026-09-03 04:12:00.000',NULL,0),(6,2,2,'Mình đã nhắn chủ trọ và sẽ cập nhật lại sau.','TEXT','2026-09-03 04:20:00.000',NULL,0),(18,1,2,'anh rảnh không ạ','TEXT','2026-09-12 02:50:18.722',NULL,0),(20,15,33,'helooo','TEXT','2026-09-12 03:05:17.260',NULL,0),(21,15,2,'chào bạn nhó','TEXT','2026-09-12 03:05:44.298',NULL,0),(22,15,2,'heloooo cu','TEXT','2026-09-14 06:19:56.419',NULL,0);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nearby_places`
--

DROP TABLE IF EXISTS `nearby_places`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nearby_places` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('MARKET','SUPERMARKET','PHARMACY','HOSPITAL','BUS_STOP','RESTAURANT','CONVENIENCE_STORE','SCHOOL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `distance_meters` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nearby_places_property_id_category_idx` (`property_id`,`category`),
  KEY `nearby_places_latitude_longitude_idx` (`latitude`,`longitude`),
  CONSTRAINT `nearby_places_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nearby_places`
--

LOCK TABLES `nearby_places` WRITE;
/*!40000 ALTER TABLE `nearby_places` DISABLE KEYS */;
INSERT INTO `nearby_places` VALUES (1,1,'VinMart+ Minh Khai','CONVENIENCE_STORE','123 Minh Khai, Hai Bà Trưng, Hà Nội',20.9960000,105.8631000,180,'2026-09-09 01:09:54.246','2026-09-12 17:07:45.432'),(2,1,'Trạm xe buýt Minh Khai','BUS_STOP','Đường Minh Khai, Hai Bà Trưng, Hà Nội',20.9956000,105.8644000,120,'2026-09-09 01:09:54.263','2026-09-12 17:07:45.448'),(3,2,'Đại học Bách khoa Hà Nội','SCHOOL','Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',21.0045000,105.8431000,420,'2026-09-09 01:09:54.280','2026-09-12 17:07:45.466'),(4,2,'Nhà thuốc Tạ Quang Bửu','PHARMACY','Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',21.0041000,105.8474000,110,'2026-09-09 01:09:54.299','2026-09-12 17:07:45.480'),(5,3,'Chợ Yên Hòa','MARKET','Yên Hòa, Cầu Giấy, Hà Nội',21.0188000,105.8024000,280,'2026-09-09 01:09:54.319','2026-09-12 17:07:45.497'),(6,3,'Bến xe buýt Nguyễn Khang','BUS_STOP','Nguyễn Khang, Cầu Giấy, Hà Nội',21.0193000,105.8005000,170,'2026-09-09 01:09:54.338','2026-09-12 17:07:45.515'),(7,4,'Đại học Thủy lợi','SCHOOL','175 Tây Sơn, Đống Đa, Hà Nội',21.0072000,105.8286000,260,'2026-09-09 01:09:54.357','2026-09-12 17:07:45.535'),(8,4,'Siêu thị WinMart Tây Sơn','SUPERMARKET','Tây Sơn, Đống Đa, Hà Nội',21.0069000,105.8303000,150,'2026-09-09 01:09:54.373','2026-09-12 17:07:45.550'),(9,5,'Bệnh viện Đống Đa','HOSPITAL','192 Nguyễn Lương Bằng, Đống Đa, Hà Nội',21.0141000,105.8245000,480,'2026-09-09 01:09:54.389','2026-09-12 17:07:45.564'),(10,5,'Quán ăn Thái Hà','RESTAURANT','Thái Hà, Đống Đa, Hà Nội',21.0117000,105.8223000,130,'2026-09-09 01:09:54.405','2026-09-12 17:07:45.580'),(11,6,'Đại học Phenikaa','SCHOOL','Đường Nguyễn Trác, phường Dương Nội, thành phố Hà Nội',20.9612416,105.7474728,340,'2026-09-10 19:07:25.075','2026-09-12 17:07:45.413');
/*!40000 ALTER TABLE `nearby_places` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('ROOM_MATCH','PRICE_CHANGED','ROOMMATE_REQUEST','ROOMMATE_REQUEST_RESPONSE','MESSAGE','APPOINTMENT','CONTRACT','INVOICE','VERIFICATION','REPORT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_is_read_created_at_idx` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'ROOM_MATCH','Có phòng phù hợp mới','Phòng B101 phù hợp với mức ngân sách và bán kính bạn đã chọn.','/rooms/5',0,NULL,'2026-09-01 03:20:00.000'),(2,2,'PRICE_CHANGED','Giá phòng đã thay đổi','Giá phòng B102 đã được cập nhật trong lịch sử giá.','/rooms/6',1,'2026-09-02 03:00:00.000','2026-09-01 03:30:00.000'),(3,2,'ROOMMATE_REQUEST','Lời mời ở ghép mới','Quang Trần đã được thêm vào nhóm tìm phòng của bạn.','/groups/1',0,NULL,'2026-09-03 04:05:00.000'),(4,2,'APPOINTMENT','Lịch xem phòng được xác nhận','Chủ trọ đã xác nhận lịch xem phòng B101.','/appointments',0,NULL,'2026-09-02 04:12:00.000'),(5,2,'INVOICE','Hóa đơn tháng 8','Hóa đơn HD-2026-001-202608 đã được thanh toán.','/invoices/1',1,'2026-09-03 04:10:00.000','2026-09-01 02:05:00.000'),(6,3,'MESSAGE','Tin nhắn mới trong nhóm','Nhóm tìm phòng Bách Khoa có cập nhật lịch xem phòng.','/conversations/2',0,NULL,'2026-09-03 04:20:00.000'),(7,4,'VERIFICATION','Yêu cầu xác minh đang chờ duyệt','Admin sẽ thông báo khi yêu cầu xác minh sinh viên được xử lý.','/profile/verification',0,NULL,'2026-09-02 05:10:00.000'),(8,12,'REPORT','Báo cáo cần phản hồi','Có báo cáo liên quan đến trạng thái xác minh tài khoản của bạn.','/landlord/reports',0,NULL,'2026-09-04 05:30:00.000'),(44,10,'MESSAGE','Bạn có tin nhắn mới','Nguyễn Minh Anh đã gửi cho bạn một tin nhắn.','/conversations/1',0,NULL,'2026-09-12 02:50:18.759'),(48,8,'ROOMMATE_REQUEST','Bạn có lời mời ở ghép mới','LÊ ANH MINH đã gửi lời mời ở ghép cho bạn.','/roommate-requests/received',0,NULL,'2026-09-12 02:53:03.316'),(49,2,'ROOMMATE_REQUEST','Bạn có lời mời ở ghép mới','LÊ ANH MINH đã gửi lời mời ở ghép cho bạn.','/roommate-requests/received',0,NULL,'2026-09-12 02:54:47.840'),(50,33,'ROOMMATE_REQUEST_RESPONSE','Lời mời ở ghép đã được phản hồi','Nguyễn Minh Anh đã chấp nhận lời mời ở ghép.','/roommate-requests/sent',0,NULL,'2026-09-12 02:54:56.881'),(51,2,'MESSAGE','Bạn có tin nhắn mới','LÊ ANH MINH đã gửi cho bạn một tin nhắn.','/conversations/15',0,NULL,'2026-09-12 03:05:17.498'),(52,33,'MESSAGE','Bạn có tin nhắn mới','Nguyễn Minh Anh đã gửi cho bạn một tin nhắn.','/conversations/15',1,'2026-09-12 03:48:48.336','2026-09-12 03:05:44.441'),(53,3,'INVOICE','Trạng thái hóa đơn đã thay đổi','Hóa đơn HD-2026-001-202609 đã được đánh dấu đã thanh toán.','/invoices/2',0,NULL,'2026-09-12 03:20:57.060'),(54,2,'INVOICE','Trạng thái hóa đơn đã thay đổi','Hóa đơn HD-2026-001-202609 đã được đánh dấu đã thanh toán.','/invoices/2',0,NULL,'2026-09-12 03:20:57.060'),(55,10,'APPOINTMENT','Có lịch xem phòng mới','Nguyễn Minh Anh đã đặt lịch xem phòng.','/appointments',0,NULL,'2026-09-12 03:26:05.048'),(56,33,'MESSAGE','Bạn có tin nhắn mới','Nguyễn Minh Anh đã gửi cho bạn một tin nhắn.','/conversations/15',0,NULL,'2026-09-14 06:19:56.682');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `landlord_id` int NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Hà Nội',
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `rules` text COLLATE utf8mb4_unicode_ci,
  `opening_hours` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_status` enum('UNVERIFIED','PENDING','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNVERIFIED',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `properties_slug_key` (`slug`),
  KEY `properties_landlord_id_idx` (`landlord_id`),
  KEY `properties_city_district_idx` (`city`,`district`),
  KEY `properties_latitude_longitude_idx` (`latitude`,`longitude`),
  KEY `properties_verification_status_idx` (`verification_status`),
  CONSTRAINT `properties_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES (1,10,'khu-tro-minh-khai','Khu trọ Minh Khai','Khu trọ yên tĩnh, thuận tiện di chuyển tới các trường khu Bách Khoa.','Ngõ 121 Minh Khai, Hai Bà Trưng, Hà Nội','Vĩnh Tuy','Hai Bà Trưng','Hà Nội',20.9958000,105.8638000,'Không gây ồn sau 23:00, giữ gìn vệ sinh khu chung.','06:00 - 23:00','0900000021','VERIFIED','2026-09-09 01:09:49.215','2026-09-12 17:07:42.112'),(2,10,'nha-tro-bach-khoa','Nhà trọ Bách Khoa','Nhà trọ gần Đại học Bách khoa và Đại học Kinh tế Quốc dân.','Ngõ 48 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội','Bách Khoa','Hai Bà Trưng','Hà Nội',21.0039000,105.8468000,'Khách qua đêm cần báo trước với chủ trọ.','05:30 - 23:30','0900000021','VERIFIED','2026-09-09 01:09:49.233','2026-09-12 17:07:42.127'),(3,12,'residence-cau-giay','Residence Cầu Giấy','Phòng studio có thang máy, phù hợp nhóm hai sinh viên.','Ngõ 76 Nguyễn Khang, Cầu Giấy, Hà Nội','Yên Hòa','Cầu Giấy','Hà Nội',21.0198000,105.8017000,'Không nuôi thú cưng tại khu vực hành lang chung.','24/7','0900000023','PENDING','2026-09-09 01:09:49.249','2026-09-12 17:07:42.142'),(4,11,'khu-tro-khuong-thuong','Khu trọ Khương Thượng','Khu trọ gần Đại học Thủy lợi, có bãi xe và camera an ninh.','Ngõ 178 Tây Sơn, Đống Đa, Hà Nội','Khương Thượng','Đống Đa','Hà Nội',21.0064000,105.8294000,'Tôn trọng giờ nghỉ và phân loại rác tại khu chung.','06:00 - 24:00','0900000022','VERIFIED','2026-09-09 01:09:49.265','2026-09-12 17:07:42.160'),(5,11,'nha-tro-thai-ha','Nhà trọ Thái Hà','Căn hộ mini khu Thái Hà, di chuyển thuận tiện tới Đống Đa.','Ngõ 89 Thái Hà, Đống Đa, Hà Nội','Trung Liệt','Đống Đa','Hà Nội',21.0121000,105.8216000,'Không hút thuốc trong phòng và hành lang.','06:00 - 23:00','0900000022','VERIFIED','2026-09-09 01:09:49.281','2026-09-12 17:07:42.176'),(6,10,'khu-tro-duong-noi','Khu trọ Dương Nội','Khu trọ dành cho sinh viên, di chuyển thuận tiện tới Đại học Phenikaa.','Khu đô thị Dương Nội, phường Dương Nội, thành phố Hà Nội','Dương Nội','Hà Đông','Hà Nội',20.9632000,105.7500000,'Không gây ồn sau 23:00, giữ gìn vệ sinh khu chung.','06:00 - 23:00','0900000021','VERIFIED','2026-09-10 19:07:21.579','2026-09-12 17:07:42.095'),(7,10,'nha-tro-my-dinh','Nhà trọ Mỹ Đình','Khu studio có góc học tập và bếp nhỏ, phù hợp nhóm một đến hai sinh viên.','Ngõ 64 Lê Quang Đạo, phường Mỹ Đình 2, Nam Từ Liêm, Hà Nội','Mỹ Đình 2','Nam Từ Liêm','Hà Nội',21.0147000,105.7657000,'Giữ yên tĩnh tại khu hành lang sau 23:00.','06:00 - 23:30','0900000021','VERIFIED','2026-09-12 17:06:36.941','2026-09-12 17:07:42.193'),(8,11,'nha-tro-co-nhue','Nhà trọ Cổ Nhuế','Phòng khép kín yên tĩnh, thuận tiện di chuyển tới khu Phạm Văn Đồng.','Ngõ 7 Phạm Văn Đồng, phường Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội','Cổ Nhuế 1','Bắc Từ Liêm','Hà Nội',21.0651000,105.7868000,'Không để xe tại lối thoát hiểm.','06:00 - 23:00','0900000022','VERIFIED','2026-09-12 17:06:36.957','2026-09-12 17:07:42.212'),(9,10,'can-ho-nhan-chinh','Căn hộ Nhân Chính','Căn hộ mini có ban công và khu bếp độc lập tại Thanh Xuân.','Ngõ 116 Nhân Hòa, phường Nhân Chính, Thanh Xuân, Hà Nội','Nhân Chính','Thanh Xuân','Hà Nội',21.0012000,105.8091000,'Không hút thuốc trong phòng và khu vực chung.','24/7','0900000021','VERIFIED','2026-09-12 17:06:36.978','2026-09-12 17:07:42.230'),(10,11,'khu-tro-dai-kim','Khu trọ Đại Kim','Khu trọ có các phòng rộng cho nhóm sinh viên cùng thuê.','Ngõ 192 Kim Giang, phường Đại Kim, Hoàng Mai, Hà Nội','Đại Kim','Hoàng Mai','Hà Nội',20.9749000,105.8246000,'Tôn trọng không gian chung và phân loại rác.','06:00 - 24:00','0900000022','VERIFIED','2026-09-12 17:06:36.995','2026-09-12 17:07:42.245'),(11,10,'studio-ngoc-lam','Studio Ngọc Lâm','Studio sáng thoáng với bếp và khu giặt riêng tại Long Biên.','Ngõ 97 Nguyễn Văn Cừ, phường Ngọc Lâm, Long Biên, Hà Nội','Ngọc Lâm','Long Biên','Hà Nội',21.0439000,105.8793000,'Không gây ồn sau 23:00.','06:00 - 23:30','0900000021','VERIFIED','2026-09-12 17:06:37.011','2026-09-12 17:07:42.261'),(12,11,'nha-tro-xuan-la','Nhà trọ Xuân La','Nhà trọ có phòng khép kín, không gian sáng và chỗ để xe riêng.','Ngõ 445 Lạc Long Quân, phường Xuân La, Tây Hồ, Hà Nội','Xuân La','Tây Hồ','Hà Nội',21.0668000,105.8021000,'Khách tới thăm cần đăng ký tại cổng.','06:00 - 23:00','0900000022','VERIFIED','2026-09-12 17:06:37.025','2026-09-12 17:07:42.278'),(13,10,'residence-mo-lao','Residence Mỗ Lao','Studio có thang máy, bàn học và bếp nhỏ ở khu Mỗ Lao.','Ngõ 2 Nguyễn Văn Lộc, phường Mỗ Lao, Hà Đông, Hà Nội','Mỗ Lao','Hà Đông','Hà Nội',20.9954000,105.7820000,'Giữ gìn thang máy và khu hành lang chung.','24/7','0900000021','VERIFIED','2026-09-12 17:06:37.060','2026-09-12 17:07:42.295'),(14,11,'khu-tro-trau-quy','Khu trọ Trâu Quỳ','Khu ở ghép sạch sẽ, có giường và khu giặt chung.','Ngõ 24 Ngô Xuân Quảng, thị trấn Trâu Quỳ, Gia Lâm, Hà Nội','Trâu Quỳ','Gia Lâm','Hà Nội',21.0096000,105.9383000,'Không để đồ cá nhân tại lối đi chung.','06:00 - 23:30','0900000022','VERIFIED','2026-09-12 17:06:37.076','2026-09-12 17:07:42.311'),(15,10,'nha-tro-tan-trieu','Nhà trọ Tân Triều','Phòng khép kín gần các tuyến xe buýt, phù hợp ngân sách vừa phải.','Ngõ 300 Nguyễn Xiển, xã Tân Triều, Thanh Trì, Hà Nội','Tân Triều','Thanh Trì','Hà Nội',20.9819000,105.8009000,'Đóng cổng đúng giờ và bảo quản tài sản cá nhân.','06:00 - 23:00','0900000021','VERIFIED','2026-09-12 17:06:37.092','2026-09-12 17:07:42.328'),(16,11,'can-ho-ngoc-khanh','Căn hộ Ngọc Khánh','Căn hộ mini có phòng ngủ, bếp và ban công tại Ba Đình.','Ngõ 535 Kim Mã, phường Ngọc Khánh, Ba Đình, Hà Nội','Ngọc Khánh','Ba Đình','Hà Nội',21.0325000,105.8140000,'Không để đồ tại lối thoát hiểm và hành lang.','24/7','0900000022','VERIFIED','2026-09-12 17:06:37.109','2026-09-12 17:07:42.345'),(17,34,'bat-on','bất ổn',NULL,'dương nội','Dương Nội',NULL,'Hà Nội',20.9815340,105.7488750,NULL,NULL,'05168489','UNVERIFIED','2026-09-14 06:42:44.895','2026-09-14 06:42:44.895');
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rental_groups`
--

DROP TABLE IF EXISTS `rental_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rental_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `creator_id` int NOT NULL,
  `room_id` int DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_members` int NOT NULL,
  `budget_per_person` decimal(12,2) NOT NULL,
  `move_in_date` date DEFAULT NULL,
  `rules` text COLLATE utf8mb4_unicode_ci,
  `zalo_group_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram_group_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('OPEN','FULL','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rental_groups_creator_id_idx` (`creator_id`),
  KEY `rental_groups_room_id_idx` (`room_id`),
  KEY `rental_groups_status_move_in_date_idx` (`status`,`move_in_date`),
  CONSTRAINT `rental_groups_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `rental_groups_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rental_groups`
--

LOCK TABLES `rental_groups` WRITE;
/*!40000 ALTER TABLE `rental_groups` DISABLE KEYS */;
INSERT INTO `rental_groups` VALUES (1,2,6,'Nhóm tìm phòng Bách Khoa tháng 10',2,1700000.00,'2026-10-01','Cùng xác nhận chi phí trước khi ký hợp đồng, giữ yên tĩnh sau 23:00.','https://zalo.me/g/demo-bach-khoa','https://t.me/demo_bach_khoa','OPEN','2026-09-09 01:09:53.109','2026-09-12 17:07:44.693');
/*!40000 ALTER TABLE `rental_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` int NOT NULL,
  `target_type` enum('ROOM','USER','ROOMMATE_POST','REVIEW') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_user_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `roommate_post_id` int DEFAULT NULL,
  `review_id` int DEFAULT NULL,
  `reason` enum('WRONG_INFO','WRONG_IMAGE','WRONG_PRICE','ROOM_UNAVAILABLE','WRONG_ADDRESS','SCAM','FAKE_ACCOUNT','INAPPROPRIATE_CONTENT','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `evidence_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PROCESSING','RESOLVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reviewed_by_id` int DEFAULT NULL,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reports_reporter_id_created_at_idx` (`reporter_id`,`created_at`),
  KEY `reports_target_user_id_idx` (`target_user_id`),
  KEY `reports_room_id_idx` (`room_id`),
  KEY `reports_roommate_post_id_idx` (`roommate_post_id`),
  KEY `reports_review_id_idx` (`review_id`),
  KEY `reports_reviewed_by_id_idx` (`reviewed_by_id`),
  KEY `reports_target_type_idx` (`target_type`),
  KEY `reports_status_created_at_idx` (`status`,`created_at`),
  CONSTRAINT `reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reports_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reports_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reports_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reports_roommate_post_id_fkey` FOREIGN KEY (`roommate_post_id`) REFERENCES `roommate_posts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reports_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (1,2,'ROOM',NULL,10,NULL,NULL,'WRONG_PRICE','Sinh viên muốn admin kiểm tra lại phần phí dịch vụ được mô tả trong tin đăng.',NULL,'PENDING',NULL,NULL,NULL,'2026-09-09 01:09:54.012','2026-09-12 17:07:45.279'),(2,7,'USER',12,NULL,NULL,NULL,'OTHER','Người dùng đề nghị làm rõ trạng thái xác minh của chủ trọ trước khi đặt lịch xem.',NULL,'PROCESSING',1,'Admin đã tiếp nhận và đang kiểm tra hồ sơ xác minh.',NULL,'2026-09-09 01:09:54.032','2026-09-12 17:07:45.300'),(3,10,'REVIEW',NULL,NULL,NULL,2,'OTHER','Chủ trọ yêu cầu kiểm tra nội dung review trong luồng quản trị demo.',NULL,'RESOLVED',1,'Nội dung review có căn cứ từ hợp đồng và vẫn được giữ công khai.','2026-09-05 05:00:00.000','2026-09-09 01:09:54.055','2026-09-12 17:07:45.322'),(4,9,'ROOMMATE_POST',NULL,NULL,4,NULL,'INAPPROPRIATE_CONTENT','Yêu cầu admin rà soát bài đăng đã đóng trong dữ liệu demo.',NULL,'REJECTED',1,'Bài đăng không vi phạm; trạng thái đã đóng do nhóm đủ thành viên.','2026-09-04 06:00:00.000','2026-09-09 01:09:54.076','2026-09-12 17:07:45.341');
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_id` int NOT NULL,
  `student_id` int NOT NULL,
  `room_id` int NOT NULL,
  `landlord_id` int NOT NULL,
  `rating` int NOT NULL,
  `room_quality` int NOT NULL,
  `security` int NOT NULL,
  `cleanliness` int NOT NULL,
  `wifi_quality` int NOT NULL,
  `utility_price` int NOT NULL,
  `listing_accuracy` int NOT NULL,
  `landlord_attitude` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PUBLISHED','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLISHED',
  `moderated_by_id` int DEFAULT NULL,
  `moderation_note` text COLLATE utf8mb4_unicode_ci,
  `moderated_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_contract_id_student_id_key` (`contract_id`,`student_id`),
  KEY `reviews_student_id_created_at_idx` (`student_id`,`created_at`),
  KEY `reviews_room_id_status_created_at_idx` (`room_id`,`status`,`created_at`),
  KEY `reviews_landlord_id_status_idx` (`landlord_id`,`status`),
  KEY `reviews_moderated_by_id_fkey` (`moderated_by_id`),
  CONSTRAINT `reviews_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reviews_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reviews_moderated_by_id_fkey` FOREIGN KEY (`moderated_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reviews_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reviews_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,2,7,10,5,5,4,5,5,4,5,5,'Phòng đúng mô tả, wifi ổn định và chủ trọ phản hồi lịch xem nhanh.','PUBLISHED',1,'Đã kiểm tra hợp đồng và nội dung đánh giá demo.','2026-09-05 03:00:00.000','2026-09-09 01:09:53.967','2026-09-12 17:07:45.232'),(2,1,3,7,10,4,4,4,4,5,4,4,5,'Không gian phù hợp hai người; thông tin chi phí được chủ trọ giải thích rõ.','PUBLISHED',NULL,NULL,NULL,'2026-09-09 01:09:53.986','2026-09-12 17:07:45.254');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_amenities`
--

DROP TABLE IF EXISTS `room_amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_amenities` (
  `room_id` int NOT NULL,
  `amenity_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`room_id`,`amenity_id`),
  KEY `room_amenities_amenity_id_idx` (`amenity_id`),
  CONSTRAINT `room_amenities_amenity_id_fkey` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `room_amenities_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_amenities`
--

LOCK TABLES `room_amenities` WRITE;
/*!40000 ALTER TABLE `room_amenities` DISABLE KEYS */;
INSERT INTO `room_amenities` VALUES (1,1,'2026-09-09 01:09:49.654'),(1,2,'2026-09-09 01:09:49.673'),(1,3,'2026-09-09 01:09:49.690'),(1,4,'2026-09-09 01:09:49.702'),(1,5,'2026-09-09 01:09:49.719'),(1,6,'2026-09-09 01:09:49.731'),(1,10,'2026-09-09 01:09:49.751'),(2,1,'2026-09-09 01:09:49.831'),(2,3,'2026-09-09 01:09:49.846'),(2,4,'2026-09-09 01:09:49.862'),(2,5,'2026-09-09 01:09:49.879'),(2,7,'2026-09-09 01:09:49.894'),(3,1,'2026-09-09 01:09:49.976'),(3,4,'2026-09-09 01:09:49.991'),(3,5,'2026-09-09 01:09:50.007'),(3,6,'2026-09-09 01:09:50.023'),(4,1,'2026-09-09 01:09:50.103'),(4,2,'2026-09-09 01:09:50.121'),(4,3,'2026-09-09 01:09:50.138'),(4,4,'2026-09-09 01:09:50.155'),(4,5,'2026-09-09 01:09:50.170'),(4,7,'2026-09-09 01:09:50.184'),(4,8,'2026-09-09 01:09:50.199'),(5,1,'2026-09-09 01:09:50.276'),(5,2,'2026-09-09 01:09:50.291'),(5,3,'2026-09-09 01:09:50.307'),(5,4,'2026-09-09 01:09:50.323'),(5,5,'2026-09-09 01:09:50.338'),(5,10,'2026-09-09 01:09:50.353'),(6,1,'2026-09-09 01:09:50.431'),(6,2,'2026-09-09 01:09:50.445'),(6,3,'2026-09-09 01:09:50.459'),(6,4,'2026-09-09 01:09:50.475'),(6,5,'2026-09-09 01:09:50.490'),(6,6,'2026-09-09 01:09:50.507'),(6,10,'2026-09-09 01:09:50.537'),(6,12,'2026-09-09 01:09:50.523'),(7,1,'2026-09-09 01:09:50.614'),(7,2,'2026-09-09 01:09:50.629'),(7,3,'2026-09-09 01:09:50.645'),(7,4,'2026-09-09 01:09:50.660'),(7,5,'2026-09-09 01:09:50.676'),(7,6,'2026-09-09 01:09:50.693'),(8,1,'2026-09-09 01:09:50.776'),(8,3,'2026-09-09 01:09:50.792'),(8,4,'2026-09-09 01:09:50.806'),(8,5,'2026-09-09 01:09:50.822'),(8,10,'2026-09-09 01:09:50.838'),(9,1,'2026-09-09 01:09:50.917'),(9,2,'2026-09-09 01:09:50.932'),(9,3,'2026-09-09 01:09:50.948'),(9,4,'2026-09-09 01:09:50.963'),(9,5,'2026-09-09 01:09:50.979'),(9,11,'2026-09-09 01:09:50.995'),(9,12,'2026-09-09 01:09:51.010'),(10,1,'2026-09-09 01:09:51.092'),(10,2,'2026-09-09 01:09:51.107'),(10,3,'2026-09-09 01:09:51.123'),(10,4,'2026-09-09 01:09:51.136'),(10,6,'2026-09-09 01:09:51.152'),(10,7,'2026-09-09 01:09:51.165'),(10,11,'2026-09-09 01:09:51.180'),(11,1,'2026-09-09 01:09:51.270'),(11,3,'2026-09-09 01:09:51.287'),(11,4,'2026-09-09 01:09:51.305'),(11,5,'2026-09-09 01:09:51.322'),(11,11,'2026-09-09 01:09:51.339'),(12,1,'2026-09-09 01:09:51.434'),(12,2,'2026-09-09 01:09:51.449'),(12,3,'2026-09-09 01:09:51.466'),(12,4,'2026-09-09 01:09:51.480'),(12,5,'2026-09-09 01:09:51.497'),(12,10,'2026-09-09 01:09:51.514'),(13,1,'2026-09-09 01:09:51.594'),(13,2,'2026-09-09 01:09:51.611'),(13,3,'2026-09-09 01:09:51.626'),(13,4,'2026-09-09 01:09:51.643'),(13,5,'2026-09-09 01:09:51.660'),(13,8,'2026-09-09 01:09:51.677'),(13,12,'2026-09-09 01:09:51.692'),(14,1,'2026-09-09 01:09:51.776'),(14,3,'2026-09-09 01:09:51.793'),(14,4,'2026-09-09 01:09:51.811'),(14,5,'2026-09-09 01:09:51.827'),(15,1,'2026-09-09 01:09:51.911'),(15,2,'2026-09-09 01:09:51.926'),(15,3,'2026-09-09 01:09:51.940'),(15,4,'2026-09-09 01:09:51.957'),(15,5,'2026-09-09 01:09:51.973'),(15,6,'2026-09-09 01:09:51.990'),(16,1,'2026-09-09 01:09:52.076'),(16,2,'2026-09-09 01:09:52.092'),(16,3,'2026-09-09 01:09:52.110'),(16,4,'2026-09-09 01:09:52.125'),(16,5,'2026-09-09 01:09:52.140'),(16,6,'2026-09-09 01:09:52.155'),(16,7,'2026-09-09 01:09:52.172'),(16,12,'2026-09-09 01:09:52.187'),(17,1,'2026-09-09 01:09:52.270'),(17,2,'2026-09-09 01:09:52.285'),(17,3,'2026-09-09 01:09:52.302'),(17,4,'2026-09-09 01:09:52.319'),(17,5,'2026-09-09 01:09:52.336'),(17,10,'2026-09-09 01:09:52.366'),(17,11,'2026-09-09 01:09:52.351'),(18,1,'2026-09-09 01:09:52.447'),(18,3,'2026-09-09 01:09:52.463'),(18,4,'2026-09-09 01:09:52.481'),(18,5,'2026-09-09 01:09:52.497'),(19,1,'2026-09-10 19:07:22.187'),(19,2,'2026-09-10 19:07:22.212'),(19,3,'2026-09-10 19:07:22.239'),(19,4,'2026-09-10 19:07:22.259'),(19,5,'2026-09-10 19:07:22.283'),(19,10,'2026-09-10 19:07:22.307'),(20,1,'2026-09-10 19:07:22.407'),(20,2,'2026-09-10 19:07:22.427'),(20,3,'2026-09-10 19:07:22.445'),(20,4,'2026-09-10 19:07:22.463'),(20,5,'2026-09-10 19:07:22.484'),(20,6,'2026-09-10 19:07:22.503'),(20,10,'2026-09-10 19:07:22.541'),(20,12,'2026-09-10 19:07:22.522'),(21,1,'2026-09-10 19:07:22.640'),(21,3,'2026-09-10 19:07:22.661'),(21,4,'2026-09-10 19:07:22.678'),(21,5,'2026-09-10 19:07:22.698'),(21,6,'2026-09-10 19:07:22.741'),(21,7,'2026-09-10 19:07:22.723'),(22,1,'2026-09-12 17:06:38.926'),(22,2,'2026-09-12 17:06:38.942'),(22,3,'2026-09-12 17:06:38.958'),(22,4,'2026-09-12 17:06:38.975'),(22,5,'2026-09-12 17:06:38.989'),(22,6,'2026-09-12 17:06:39.011'),(22,10,'2026-09-12 17:06:39.040'),(22,12,'2026-09-12 17:06:39.025'),(23,1,'2026-09-12 17:06:39.128'),(23,2,'2026-09-12 17:06:39.145'),(23,3,'2026-09-12 17:06:39.162'),(23,4,'2026-09-12 17:06:39.179'),(23,5,'2026-09-12 17:06:39.193'),(23,10,'2026-09-12 17:06:39.208'),(24,1,'2026-09-12 17:06:39.295'),(24,2,'2026-09-12 17:06:39.312'),(24,3,'2026-09-12 17:06:39.331'),(24,4,'2026-09-12 17:06:39.346'),(24,5,'2026-09-12 17:06:39.362'),(24,6,'2026-09-12 17:06:39.378'),(24,7,'2026-09-12 17:06:39.394'),(24,12,'2026-09-12 17:06:39.411'),(25,1,'2026-09-12 17:06:39.492'),(25,3,'2026-09-12 17:06:39.510'),(25,4,'2026-09-12 17:06:39.525'),(25,5,'2026-09-12 17:06:39.540'),(25,6,'2026-09-12 17:06:39.556'),(25,8,'2026-09-12 17:06:39.572'),(26,1,'2026-09-12 17:06:39.662'),(26,2,'2026-09-12 17:06:39.679'),(26,3,'2026-09-12 17:06:39.694'),(26,4,'2026-09-12 17:06:39.710'),(26,5,'2026-09-12 17:06:39.727'),(26,6,'2026-09-12 17:06:39.743'),(26,8,'2026-09-12 17:06:39.761'),(26,12,'2026-09-12 17:06:39.780'),(27,1,'2026-09-12 17:06:39.861'),(27,2,'2026-09-12 17:06:39.878'),(27,3,'2026-09-12 17:06:39.893'),(27,4,'2026-09-12 17:06:39.911'),(27,5,'2026-09-12 17:06:39.927'),(27,7,'2026-09-12 17:06:39.944'),(27,10,'2026-09-12 17:06:39.958'),(28,1,'2026-09-12 17:06:40.047'),(28,2,'2026-09-12 17:06:40.065'),(28,3,'2026-09-12 17:06:40.080'),(28,4,'2026-09-12 17:06:40.095'),(28,5,'2026-09-12 17:06:40.111'),(28,6,'2026-09-12 17:06:40.127'),(28,11,'2026-09-12 17:06:40.144'),(28,12,'2026-09-12 17:06:40.159'),(29,1,'2026-09-12 17:06:40.245'),(29,2,'2026-09-12 17:06:40.261'),(29,3,'2026-09-12 17:06:40.279'),(29,5,'2026-09-12 17:06:40.295'),(29,8,'2026-09-12 17:06:40.311'),(29,10,'2026-09-12 17:06:40.329'),(29,12,'2026-09-12 17:06:40.345'),(30,1,'2026-09-12 17:06:40.429'),(30,3,'2026-09-12 17:06:40.445'),(30,4,'2026-09-12 17:06:40.463'),(30,5,'2026-09-12 17:06:40.480'),(30,7,'2026-09-12 17:06:40.496'),(30,10,'2026-09-12 17:06:40.512'),(31,1,'2026-09-12 17:06:40.595'),(31,2,'2026-09-12 17:06:40.614'),(31,3,'2026-09-12 17:06:40.631'),(31,4,'2026-09-12 17:06:40.647'),(31,5,'2026-09-12 17:06:40.662'),(31,6,'2026-09-12 17:06:40.678'),(31,7,'2026-09-12 17:06:40.695'),(31,11,'2026-09-12 17:06:40.712'),(31,12,'2026-09-12 17:06:40.733');
/*!40000 ALTER TABLE `room_amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_images`
--

DROP TABLE IF EXISTS `room_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_cover` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_images_room_id_sort_order_key` (`room_id`,`sort_order`),
  KEY `room_images_room_id_is_cover_idx` (`room_id`,`is_cover`),
  CONSTRAINT `room_images_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_images`
--

LOCK TABLES `room_images` WRITE;
/*!40000 ALTER TABLE `room_images` DISABLE KEYS */;
INSERT INTO `room_images` VALUES (1,1,'https://images.unsplash.com/photo-1774311237295-a65a4c1ff38a?auto=format&fit=crop&w=1200&q=80','Studio A101 sáng thoáng',0,1,'2026-09-09 01:09:49.618'),(2,1,'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80','Studio A101 sáng thoáng - góc nội thất',1,0,'2026-09-09 01:09:49.635'),(3,2,'https://images.unsplash.com/photo-1780777698633-283d4b7bf4a6?auto=format&fit=crop&w=1200&q=80','Phòng A102 khép kín',0,1,'2026-09-09 01:09:49.802'),(4,2,'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80','Phòng A102 khép kín - góc nội thất',1,0,'2026-09-09 01:09:49.816'),(5,3,'https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=1200&q=80','Không gian phòng A103 tiết kiệm',0,1,'2026-09-09 01:09:49.945'),(6,3,'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80','Không gian phòng A103 tiết kiệm - góc nội thất',1,0,'2026-09-09 01:09:49.960'),(7,4,'https://images.unsplash.com/photo-1650137938625-11576502aecd?auto=format&fit=crop&w=1200&q=80','Studio A201 có ban công',0,1,'2026-09-09 01:09:50.073'),(8,4,'https://images.unsplash.com/photo-1783962211635-ef0af72c7759?auto=format&fit=crop&w=1200&q=80','Studio A201 có ban công - góc nội thất',1,0,'2026-09-09 01:09:50.087'),(9,5,'https://images.unsplash.com/photo-1656122381069-9ec666d95cf1?auto=format&fit=crop&w=1200&q=80','Phòng B101 gần khu Bách Khoa',0,1,'2026-09-09 01:09:50.241'),(10,5,'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80','Phòng B101 gần khu Bách Khoa - góc nội thất',1,0,'2026-09-09 01:09:50.259'),(11,6,'https://images.unsplash.com/photo-1721738857280-f4e7c1c43f2f?auto=format&fit=crop&w=1200&q=80','Studio B102 đầy đủ nội thất',0,1,'2026-09-09 01:09:50.399'),(12,6,'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=1200&q=80','Studio B102 đầy đủ nội thất - góc nội thất',1,0,'2026-09-09 01:09:50.415'),(13,7,'https://images.unsplash.com/photo-1661006112431-26a5f60547a3?auto=format&fit=crop&w=1200&q=80','Phòng B201 cho hai sinh viên',0,1,'2026-09-09 01:09:50.583'),(14,7,'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80','Phòng B201 cho hai sinh viên - góc nội thất',1,0,'2026-09-09 01:09:50.599'),(15,8,'https://images.unsplash.com/photo-1770757587087-766db2874c21?auto=format&fit=crop&w=1200&q=80','Phòng B202 yên tĩnh',0,1,'2026-09-09 01:09:50.743'),(16,8,'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80','Phòng B202 yên tĩnh - góc nội thất',1,0,'2026-09-09 01:09:50.760'),(17,9,'https://images.unsplash.com/photo-1749878064232-1cc820ad561f?auto=format&fit=crop&w=1200&q=80','Studio C101 Cầu Giấy',0,1,'2026-09-09 01:09:50.884'),(18,9,'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80','Studio C101 Cầu Giấy - góc nội thất',1,0,'2026-09-09 01:09:50.901'),(19,10,'https://images.unsplash.com/photo-1774226905114-1daa47ee03dc?auto=format&fit=crop&w=1200&q=80','Phòng C102 có bếp',0,1,'2026-09-09 01:09:51.060'),(20,10,'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80','Phòng C102 có bếp - góc nội thất',1,0,'2026-09-09 01:09:51.077'),(21,11,'https://images.unsplash.com/photo-1651294846983-8f67b217fe64?auto=format&fit=crop&w=1200&q=80','Phòng C201 tiết kiệm',0,1,'2026-09-09 01:09:51.230'),(22,11,'https://images.unsplash.com/photo-1783962211635-ef0af72c7759?auto=format&fit=crop&w=1200&q=80','Phòng C201 tiết kiệm - góc nội thất',1,0,'2026-09-09 01:09:51.247'),(23,12,'https://images.unsplash.com/photo-1767348923171-f5535f88fb39?auto=format&fit=crop&w=1200&q=80','Phòng D101 gần khu Thủy lợi',0,1,'2026-09-09 01:09:51.397'),(24,12,'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80','Phòng D101 gần khu Thủy lợi - góc nội thất',1,0,'2026-09-09 01:09:51.416'),(25,13,'https://images.unsplash.com/photo-1757417983938-2c2a931d41aa?auto=format&fit=crop&w=1200&q=80','Studio D102 có máy giặt',0,1,'2026-09-09 01:09:51.562'),(26,13,'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=1200&q=80','Studio D102 có máy giặt - góc nội thất',1,0,'2026-09-09 01:09:51.577'),(27,14,'https://images.unsplash.com/photo-1560769407-8ee7b93c602c?auto=format&fit=crop&w=1200&q=80','Phòng D201 đang bảo trì',0,1,'2026-09-09 01:09:51.743'),(28,14,'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80','Phòng D201 đang bảo trì - góc nội thất',1,0,'2026-09-09 01:09:51.759'),(29,15,'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80','Phòng D202 cho nhóm hai bạn',0,1,'2026-09-09 01:09:51.878'),(30,15,'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80','Phòng D202 cho nhóm hai bạn - góc nội thất',1,0,'2026-09-09 01:09:51.895'),(31,16,'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80','Căn hộ mini E101 có ban công',0,1,'2026-09-09 01:09:52.040'),(32,16,'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80','Căn hộ mini E101 có ban công - góc nội thất',1,0,'2026-09-09 01:09:52.057'),(33,17,'https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=1200&q=80','Studio E102 có thang máy',0,1,'2026-09-09 01:09:52.238'),(34,17,'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80','Studio E102 có thang máy - góc nội thất',1,0,'2026-09-09 01:09:52.254'),(35,18,'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80','Phòng E201 tạm ẩn',0,1,'2026-09-09 01:09:52.417'),(36,18,'https://images.unsplash.com/photo-1783962211635-ef0af72c7759?auto=format&fit=crop&w=1200&q=80','Phòng E201 tạm ẩn - góc nội thất',1,0,'2026-09-09 01:09:52.432'),(49,19,'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80','Không gian phòng P101 gần Dương Nội',0,1,'2026-09-10 19:07:22.142'),(50,19,'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80','Không gian phòng P101 gần Dương Nội - góc nội thất',1,0,'2026-09-10 19:07:22.169'),(51,20,'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=80','Studio P102 có góc học tập',0,1,'2026-09-10 19:07:22.368'),(52,20,'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=1200&q=80','Studio P102 có góc học tập - góc nội thất',1,0,'2026-09-10 19:07:22.388'),(53,21,'https://images.unsplash.com/photo-1781249144484-f5969c55e54e?auto=format&fit=crop&w=1200&q=80','Phòng P201 có ánh sáng tự nhiên',0,1,'2026-09-10 19:07:22.601'),(54,21,'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80','Phòng P201 có ánh sáng tự nhiên - góc nội thất',1,0,'2026-09-10 19:07:22.619'),(58,22,'https://images.unsplash.com/photo-1628592102751-ba83b0314276?auto=format&fit=crop&w=1200&q=80','Studio F101 tại Mỹ Đình',0,1,'2026-09-12 17:06:38.891'),(59,22,'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80','Studio F101 tại Mỹ Đình - góc nội thất',1,0,'2026-09-12 17:06:38.910'),(60,23,'https://images.unsplash.com/photo-1613575831056-0acd5da8f085?auto=format&fit=crop&w=1200&q=80','Phòng G101 Cổ Nhuế',0,1,'2026-09-12 17:06:39.093'),(61,23,'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=1200&q=80','Phòng G101 Cổ Nhuế - góc nội thất',1,0,'2026-09-12 17:06:39.109'),(62,24,'https://images.unsplash.com/photo-1675279200694-8529c73b1fd0?auto=format&fit=crop&w=1200&q=80','Căn hộ mini H101 Nhân Chính',0,1,'2026-09-12 17:06:39.261'),(63,24,'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80','Căn hộ mini H101 Nhân Chính - góc nội thất',1,0,'2026-09-12 17:06:39.277'),(64,25,'https://images.unsplash.com/photo-1612320648993-61c1cd604b71?auto=format&fit=crop&w=1200&q=80','Phòng J101 cho nhóm ba bạn',0,1,'2026-09-12 17:06:39.461'),(65,25,'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80','Phòng J101 cho nhóm ba bạn - góc nội thất',1,0,'2026-09-12 17:06:39.477'),(66,26,'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80','Studio L101 Ngọc Lâm',0,1,'2026-09-12 17:06:39.627'),(67,26,'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80','Studio L101 Ngọc Lâm - góc nội thất',1,0,'2026-09-12 17:06:39.644'),(68,27,'https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=1200&q=80','Phòng M101 Xuân La',0,1,'2026-09-12 17:06:39.831'),(69,27,'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80','Phòng M101 Xuân La - góc nội thất',1,0,'2026-09-12 17:06:39.846'),(70,28,'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80','Studio N101 Mỗ Lao',0,1,'2026-09-12 17:06:40.011'),(71,28,'https://images.unsplash.com/photo-1783962211635-ef0af72c7759?auto=format&fit=crop&w=1200&q=80','Studio N101 Mỗ Lao - góc nội thất',1,0,'2026-09-12 17:06:40.031'),(72,29,'https://images.unsplash.com/photo-1665249934445-1de680641f50?auto=format&fit=crop&w=1200&q=80','Phòng ở ghép Q101 Trâu Quỳ',0,1,'2026-09-12 17:06:40.211'),(73,29,'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80','Phòng ở ghép Q101 Trâu Quỳ - góc nội thất',1,0,'2026-09-12 17:06:40.229'),(74,30,'https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?auto=format&fit=crop&w=1200&q=80','Phòng R101 Tân Triều',0,1,'2026-09-12 17:06:40.398'),(75,30,'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=1200&q=80','Phòng R101 Tân Triều - góc nội thất',1,0,'2026-09-12 17:06:40.412'),(76,31,'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1200&q=80','Căn hộ mini S101 Ngọc Khánh',0,1,'2026-09-12 17:06:40.562'),(77,31,'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80','Căn hộ mini S101 Ngọc Khánh - góc nội thất',1,0,'2026-09-12 17:06:40.578');
/*!40000 ALTER TABLE `room_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_price_histories`
--

DROP TABLE IF EXISTS `room_price_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_price_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `old_price` decimal(12,2) DEFAULT NULL,
  `new_price` decimal(12,2) NOT NULL,
  `changed_by_id` int DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `room_price_histories_room_id_changed_at_idx` (`room_id`,`changed_at`),
  KEY `room_price_histories_changed_by_id_idx` (`changed_by_id`),
  CONSTRAINT `room_price_histories_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `room_price_histories_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_price_histories`
--

LOCK TABLES `room_price_histories` WRITE;
/*!40000 ALTER TABLE `room_price_histories` DISABLE KEYS */;
INSERT INTO `room_price_histories` VALUES (1,1,NULL,2650000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(2,1,2650000.00,2800000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(3,2,NULL,2450000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(4,2,2450000.00,2600000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(5,3,NULL,2350000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(6,3,2350000.00,2500000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(7,4,NULL,3050000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(8,4,3050000.00,3200000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(9,5,NULL,2850000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(10,5,2850000.00,3000000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(11,6,NULL,3250000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(12,6,3250000.00,3400000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(13,7,NULL,2650000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(14,7,2650000.00,2800000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(15,8,NULL,2750000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(16,8,2750000.00,2900000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(17,9,NULL,3650000.00,12,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(18,9,3650000.00,3800000.00,12,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(19,10,NULL,3450000.00,12,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(20,10,3450000.00,3600000.00,12,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(21,11,NULL,2950000.00,12,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(22,11,2950000.00,3100000.00,12,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(23,12,NULL,2550000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(24,12,2550000.00,2700000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(25,13,NULL,3150000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(26,13,3150000.00,3300000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(27,14,NULL,2850000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(28,14,2850000.00,3000000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(29,15,NULL,2750000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(30,15,2750000.00,2900000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(31,16,NULL,4050000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(32,16,4050000.00,4200000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(33,17,NULL,3750000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(34,17,3750000.00,3900000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(35,18,NULL,3350000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(36,18,3350000.00,3500000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(37,19,NULL,2650000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(38,19,2650000.00,2800000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(39,20,NULL,3150000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(40,20,3150000.00,3300000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(41,21,NULL,2850000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(42,21,2850000.00,3000000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(43,22,NULL,4050000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(44,22,4050000.00,4200000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(45,23,NULL,2750000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(46,23,2750000.00,2900000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(47,24,NULL,4450000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(48,24,4450000.00,4600000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(49,25,NULL,3150000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(50,25,3150000.00,3300000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(51,26,NULL,3550000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(52,26,3550000.00,3700000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(53,27,NULL,3150000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(54,27,3150000.00,3300000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(55,28,NULL,3350000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(56,28,3350000.00,3500000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(57,29,NULL,1650000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(58,29,1650000.00,1800000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(59,30,NULL,2700000.00,10,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(60,30,2700000.00,2850000.00,10,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000'),(61,31,NULL,5050000.00,11,'Giá đăng ban đầu cho dữ liệu demo.','2026-05-01 03:00:00.000'),(62,31,5050000.00,5200000.00,11,'Điều chỉnh giá theo chi phí vận hành.','2026-08-01 03:00:00.000');
/*!40000 ALTER TABLE `room_price_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_views`
--

DROP TABLE IF EXISTS `room_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_views` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `viewer_id` int DEFAULT NULL,
  `session_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `viewed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `room_views_room_id_viewed_at_idx` (`room_id`,`viewed_at`),
  KEY `room_views_viewer_id_viewed_at_idx` (`viewer_id`,`viewed_at`),
  CONSTRAINT `room_views_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `room_views_viewer_id_fkey` FOREIGN KEY (`viewer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_views`
--

LOCK TABLES `room_views` WRITE;
/*!40000 ALTER TABLE `room_views` DISABLE KEYS */;
INSERT INTO `room_views` VALUES (1,5,2,'seed-student-bk-b101','2026-09-01 03:05:00.000'),(2,6,2,'seed-student-bk-b102','2026-09-01 03:10:00.000'),(3,12,2,'seed-student-kt-d101','2026-09-01 03:16:00.000'),(4,7,3,'seed-linh-bk-b201','2026-09-02 02:20:00.000'),(5,13,5,'seed-thao-kt-d102','2026-09-02 08:30:00.000'),(6,11,6,'seed-duc-cg-c201','2026-09-03 01:45:00.000');
/*!40000 ALTER TABLE `room_views` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roommate_posts`
--

DROP TABLE IF EXISTS `roommate_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roommate_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `room_id` int DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `area` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget_per_person` decimal(12,2) NOT NULL,
  `needed_people` int NOT NULL,
  `preferred_gender` enum('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `move_in_date` date DEFAULT NULL,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `status` enum('OPEN','CLOSED','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `roommate_posts_student_id_status_idx` (`student_id`,`status`),
  KEY `roommate_posts_room_id_idx` (`room_id`),
  KEY `roommate_posts_status_created_at_idx` (`status`,`created_at`),
  CONSTRAINT `roommate_posts_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `roommate_posts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roommate_posts`
--

LOCK TABLES `roommate_posts` WRITE;
/*!40000 ALTER TABLE `roommate_posts` DISABLE KEYS */;
INSERT INTO `roommate_posts` VALUES (1,2,6,'Tìm một bạn nam ở ghép gần Bách Khoa','Mình đã xem phòng B102, muốn tìm bạn cùng ngân sách để đi xem và ký hợp đồng nếu phù hợp.','Bách Khoa, Hai Bà Trưng',1700000.00,1,'MALE','2026-10-01','Không hút thuốc, tôn trọng giờ học buổi tối.','OPEN','2026-09-09 01:09:52.959','2026-09-12 17:07:44.540'),(2,3,4,'Tìm bạn nữ ở ghép khu Hai Bà Trưng','Ưu tiên bạn nữ sạch sẽ, có thể cùng đi xem phòng vào cuối tuần.','Hai Bà Trưng',1600000.00,1,'FEMALE','2026-09-20','Không hút thuốc, chia sẻ việc dọn dẹp công bằng.','OPEN','2026-09-09 01:09:52.979','2026-09-12 17:07:44.559'),(3,5,13,'Tìm bạn nữ ở ghép gần Đại học Thủy lợi','Phòng studio có máy giặt, cần thêm một bạn nữ cùng giữ nếp sinh hoạt yên tĩnh.','Đống Đa',1650000.00,1,'FEMALE','2026-10-05','Ưu tiên không nuôi thú cưng và ngủ trước nửa đêm.','OPEN','2026-09-09 01:09:52.997','2026-09-12 17:07:44.580'),(4,4,10,'Tìm bạn ở ghép khu Cầu Giấy','Bài đăng đã đóng vì nhóm đã đủ thành viên trong dữ liệu demo.','Cầu Giấy',1800000.00,1,'MALE','2026-09-15','Cùng trao đổi trước khi đi xem phòng.','CLOSED','2026-09-09 01:09:53.019','2026-09-12 17:07:44.597');
/*!40000 ALTER TABLE `roommate_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roommate_profiles`
--

DROP TABLE IF EXISTS `roommate_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roommate_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `university_id` int DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `hometown` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `faculty` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `academic_year` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget_min` decimal(12,2) NOT NULL,
  `budget_max` decimal(12,2) NOT NULL,
  `preferred_area` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_distance_km` decimal(5,2) DEFAULT NULL,
  `is_smoking` tinyint(1) NOT NULL DEFAULT '0',
  `accepts_smoking` tinyint(1) NOT NULL DEFAULT '0',
  `has_pets` tinyint(1) NOT NULL DEFAULT '0',
  `accepts_pets` tinyint(1) NOT NULL DEFAULT '0',
  `cooks_often` tinyint(1) NOT NULL DEFAULT '0',
  `sleep_time` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wake_up_time` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cleanliness_level` int NOT NULL DEFAULT '3',
  `social_preference` enum('QUIET','BALANCED','SOCIAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BALANCED',
  `preferred_roommates` int NOT NULL DEFAULT '1',
  `bio` text COLLATE utf8mb4_unicode_ci,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roommate_profiles_student_id_key` (`student_id`),
  KEY `roommate_profiles_university_id_idx` (`university_id`),
  KEY `roommate_profiles_is_visible_budget_min_budget_max_idx` (`is_visible`,`budget_min`,`budget_max`),
  CONSTRAINT `roommate_profiles_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `roommate_profiles_university_id_fkey` FOREIGN KEY (`university_id`) REFERENCES `universities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roommate_profiles`
--

LOCK TABLES `roommate_profiles` WRITE;
/*!40000 ALTER TABLE `roommate_profiles` DISABLE KEYS */;
INSERT INTO `roommate_profiles` VALUES (1,2,5,'MALE','Hà Nội','Công nghệ thông tin','K68',2200000.00,3300000.00,'Dương Nội, Hà Đông',3.00,0,0,0,1,1,'23:30','07:00',4,'BALANCED',1,'Tìm một bạn ở cùng, ưu tiên khu vực gần Đại học Phenikaa và lịch sinh hoạt gọn gàng.',1,'2026-09-09 01:09:52.804','2026-09-12 17:07:44.391'),(2,3,2,'FEMALE','Hải Phòng','Kế toán','K66',2200000.00,3200000.00,'Hai Bà Trưng',3.00,0,0,0,1,1,'23:00','06:30',4,'QUIET',1,'Muốn tìm bạn nữ cùng trường hoặc khu vực Bách Khoa.',1,'2026-09-09 01:09:52.823','2026-09-12 17:07:44.412'),(3,4,3,'MALE','Nam Định','Kỹ thuật xây dựng','K68',2500000.00,3800000.00,'Hai Bà Trưng, Cầu Giấy',5.00,0,0,0,0,1,'00:00','07:30',3,'SOCIAL',1,'Ưu tiên phòng gần trường, có bếp và chỗ để xe.',1,'2026-09-09 01:09:52.842','2026-09-12 17:07:44.430'),(4,5,1,'FEMALE','Nghệ An','Điện tử viễn thông','K68',2500000.00,3600000.00,'Hai Bà Trưng, Đống Đa',4.00,0,0,0,1,0,'23:30','06:45',5,'QUIET',1,'Tìm bạn nữ tôn trọng không gian học tập và giữ phòng sạch.',1,'2026-09-09 01:09:52.860','2026-09-12 17:07:44.450'),(5,6,4,'MALE','Thái Bình','Công nghệ thông tin','K65',2200000.00,3200000.00,'Đống Đa',3.50,0,0,0,1,1,'00:30','07:30',3,'BALANCED',1,'Thân thiện, thường tự nấu ăn vào cuối tuần.',1,'2026-09-09 01:09:52.877','2026-09-12 17:07:44.465'),(6,7,2,'FEMALE','Hà Nội','Marketing','K66',3000000.00,4500000.00,'Đống Đa, Cầu Giấy',5.00,0,0,0,1,0,'23:00','07:00',4,'SOCIAL',1,'Muốn ở ghép với bạn nữ, thích không gian có ánh sáng tự nhiên.',1,'2026-09-09 01:09:52.895','2026-09-12 17:07:44.481'),(7,8,3,'MALE','Bắc Ninh','Kiến trúc','K68',2500000.00,3500000.00,'Hai Bà Trưng',3.00,0,0,0,0,1,'00:00','07:00',4,'BALANCED',1,'Ưu tiên phòng có bàn học và internet ổn định.',1,'2026-09-09 01:09:52.919','2026-09-12 17:07:44.500'),(8,9,4,'FEMALE','Hưng Yên','Kinh tế','K65',2000000.00,3000000.00,'Đống Đa',3.00,0,0,0,1,0,'22:30','06:30',4,'QUIET',1,'Hồ sơ demo đang chờ cập nhật xác minh.',0,'2026-09-09 01:09:52.937','2026-09-12 17:07:44.518'),(9,33,5,'FEMALE',NULL,NULL,NULL,2200000.00,3300000.00,'Dương Nội, Hà Đông',3.00,0,0,0,0,1,NULL,NULL,3,'BALANCED',1,NULL,1,'2026-09-12 02:53:56.790','2026-09-12 02:53:56.790');
/*!40000 ALTER TABLE `roommate_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roommate_requests`
--

DROP TABLE IF EXISTS `roommate_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roommate_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `recipient_id` int NOT NULL,
  `post_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','ACCEPTED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `active_pair_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responded_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roommate_requests_active_pair_key_key` (`active_pair_key`),
  KEY `roommate_requests_recipient_id_status_idx` (`recipient_id`,`status`),
  KEY `roommate_requests_sender_id_status_idx` (`sender_id`,`status`),
  KEY `roommate_requests_post_id_idx` (`post_id`),
  KEY `roommate_requests_room_id_idx` (`room_id`),
  CONSTRAINT `roommate_requests_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `roommate_posts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `roommate_requests_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `roommate_requests_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `roommate_requests_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roommate_requests`
--

LOCK TABLES `roommate_requests` WRITE;
/*!40000 ALTER TABLE `roommate_requests` DISABLE KEYS */;
INSERT INTO `roommate_requests` VALUES (1,2,4,1,6,'Mình thấy tiêu chí của bạn khá phù hợp, cùng trao đổi thêm nhé.','CANCELLED',NULL,'2026-09-12 02:43:21.377','2026-09-03 03:00:00.000','2026-09-12 02:43:21.379'),(2,3,5,2,4,'Mình muốn mời bạn cùng xem phòng cuối tuần này.','ACCEPTED',NULL,'2026-09-01 08:00:00.000','2026-08-30 03:00:00.000','2026-09-12 17:07:44.635'),(3,6,8,NULL,12,'Bạn có muốn ghép nhóm tìm phòng gần Thủy lợi không?','REJECTED',NULL,'2026-09-02 05:00:00.000','2026-09-01 04:00:00.000','2026-09-12 17:07:44.659'),(4,7,9,3,13,'Mình gửi lời mời trước khi chốt lịch xem phòng.','CANCELLED',NULL,'2026-09-04 05:00:00.000','2026-09-03 04:00:00.000','2026-09-12 17:07:44.675'),(5,2,4,1,6,'Mình thấy tiêu chí của bạn khá phù hợp, cùng trao đổi thêm nhé.','PENDING','2:4',NULL,'2026-09-03 03:00:00.000','2026-09-12 17:07:44.615'),(6,33,8,NULL,NULL,NULL,'PENDING','8:33',NULL,'2026-09-12 02:53:03.267','2026-09-12 02:53:03.267'),(7,33,2,NULL,NULL,NULL,'ACCEPTED',NULL,'2026-09-12 02:54:56.858','2026-09-12 02:54:47.789','2026-09-12 02:54:56.859');
/*!40000 ALTER TABLE `roommate_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `deposit` decimal(12,2) NOT NULL,
  `area` decimal(8,2) NOT NULL,
  `capacity` int NOT NULL,
  `available_slots` int NOT NULL,
  `type` enum('PRIVATE_ROOM','SHARED_ROOM','STUDIO','APARTMENT','DORMITORY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('AVAILABLE','RESERVED','RENTED','MAINTENANCE','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `electricity_price` decimal(12,2) NOT NULL,
  `water_price` decimal(12,2) NOT NULL,
  `internet_fee` decimal(12,2) NOT NULL,
  `parking_fee` decimal(12,2) NOT NULL,
  `service_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `location_score` decimal(3,1) DEFAULT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_property_id_code_key` (`property_id`,`code`),
  KEY `rooms_property_id_idx` (`property_id`),
  KEY `rooms_price_idx` (`price`),
  KEY `rooms_status_price_idx` (`status`,`price`),
  KEY `rooms_type_status_idx` (`type`,`status`),
  KEY `rooms_created_at_idx` (`created_at`),
  CONSTRAINT `rooms_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,1,'A101','Studio A101 sáng thoáng','Studio có cửa sổ lớn, phù hợp một đến hai sinh viên.',2800000.00,2800000.00,24.00,2,1,'STUDIO','AVAILABLE',3500.00,20000.00,100000.00,100000.00,50000.00,8.6,'2026-07-15 03:00:00.000','2026-09-09 01:09:49.298','2026-09-12 17:07:42.411'),(2,1,'A102','Phòng A102 khép kín','Phòng khép kín tầng hai, có chỗ phơi đồ riêng.',2600000.00,2600000.00,20.00,2,1,'PRIVATE_ROOM','RESERVED',3500.00,20000.00,100000.00,80000.00,30000.00,8.2,'2026-07-20 03:00:00.000','2026-09-09 01:09:49.317','2026-09-12 17:07:42.425'),(3,1,'A103','Phòng A103 tiết kiệm','Phòng dành cho hai bạn cùng học tại khu Bách Khoa.',2500000.00,2500000.00,22.00,2,0,'SHARED_ROOM','RENTED',3500.00,20000.00,100000.00,80000.00,30000.00,8.0,'2026-06-01 03:00:00.000','2026-09-09 01:09:49.339','2026-09-12 17:07:42.443'),(4,1,'A201','Studio A201 có ban công','Studio tầng hai có ban công và ánh sáng tự nhiên.',3200000.00,3200000.00,28.00,2,2,'STUDIO','AVAILABLE',3500.00,20000.00,100000.00,100000.00,50000.00,8.8,'2026-08-01 03:00:00.000','2026-09-09 01:09:49.356','2026-09-12 17:07:42.459'),(5,2,'B101','Phòng B101 gần Bách Khoa','Phòng tầng một, đi bộ tới cổng trường trong vài phút.',3000000.00,3000000.00,25.00,2,1,'PRIVATE_ROOM','AVAILABLE',3800.00,22000.00,100000.00,100000.00,50000.00,9.1,'2026-08-10 03:00:00.000','2026-09-09 01:09:49.371','2026-09-12 17:07:42.477'),(6,2,'B102','Studio B102 đầy đủ nội thất','Có giường, tủ, bàn học và bếp nhỏ.',3400000.00,3400000.00,30.00,2,2,'STUDIO','AVAILABLE',3800.00,22000.00,120000.00,100000.00,50000.00,9.2,'2026-08-12 03:00:00.000','2026-09-09 01:09:49.390','2026-09-12 17:07:42.492'),(7,2,'B201','Phòng B201 cho hai sinh viên','Phòng đang có hợp đồng demo với hai sinh viên.',2800000.00,2800000.00,26.00,2,0,'SHARED_ROOM','RENTED',3500.00,20000.00,100000.00,100000.00,50000.00,9.0,'2026-05-01 03:00:00.000','2026-09-09 01:09:49.410','2026-09-12 17:07:42.510'),(8,2,'B202','Phòng B202 yên tĩnh','Phòng sát khu học tập, phù hợp bạn cần không gian yên tĩnh.',2900000.00,2900000.00,23.00,2,1,'PRIVATE_ROOM','RESERVED',3500.00,20000.00,100000.00,80000.00,30000.00,8.9,'2026-08-18 03:00:00.000','2026-09-09 01:09:49.426','2026-09-12 17:07:42.527'),(9,3,'C101','Studio C101 Cầu Giấy','Studio có thang máy, diện tích phù hợp hai người.',3800000.00,3800000.00,32.00,2,0,'STUDIO','RENTED',4000.00,25000.00,150000.00,120000.00,80000.00,8.4,'2026-06-15 03:00:00.000','2026-09-09 01:09:49.444','2026-09-12 17:07:42.542'),(10,3,'C102','Phòng C102 có bếp','Phòng mới hoàn thiện, có bếp và ban công nhỏ.',3600000.00,3600000.00,29.00,2,2,'STUDIO','AVAILABLE',4000.00,25000.00,150000.00,120000.00,80000.00,8.3,'2026-08-22 03:00:00.000','2026-09-09 01:09:49.463','2026-09-12 17:07:42.556'),(11,3,'C201','Phòng C201 tiết kiệm','Phòng khép kín, thích hợp sinh viên có ngân sách vừa phải.',3100000.00,3100000.00,24.00,2,1,'PRIVATE_ROOM','AVAILABLE',4000.00,25000.00,120000.00,100000.00,50000.00,7.9,'2026-08-25 03:00:00.000','2026-09-09 01:09:49.484','2026-09-12 17:07:42.571'),(12,4,'D101','Phòng D101 gần Thủy lợi','Tầng một dễ di chuyển, khu vực có nhiều dịch vụ ăn uống.',2700000.00,2700000.00,23.00,2,1,'PRIVATE_ROOM','AVAILABLE',3500.00,20000.00,100000.00,80000.00,30000.00,9.0,'2026-08-05 03:00:00.000','2026-09-09 01:09:49.500','2026-09-12 17:07:42.587'),(13,4,'D102','Studio D102 có máy giặt','Studio nội thất cơ bản, dùng máy giặt chung của tầng.',3300000.00,3300000.00,29.00,2,2,'STUDIO','AVAILABLE',3500.00,20000.00,120000.00,100000.00,50000.00,9.1,'2026-08-07 03:00:00.000','2026-09-09 01:09:49.516','2026-09-12 17:07:42.604'),(14,4,'D201','Phòng D201 đang bảo trì','Phòng tạm ngừng đăng do đang thay mới thiết bị vệ sinh.',3000000.00,3000000.00,25.00,2,0,'PRIVATE_ROOM','MAINTENANCE',3500.00,20000.00,100000.00,80000.00,30000.00,8.5,'2026-07-28 03:00:00.000','2026-09-09 01:09:49.532','2026-09-12 17:07:42.619'),(15,4,'D202','Phòng D202 cho nhóm hai bạn','Phòng đang thuê, dùng để demo hợp đồng và hóa đơn thứ hai.',2900000.00,2900000.00,27.00,2,0,'SHARED_ROOM','RENTED',3500.00,20000.00,100000.00,80000.00,30000.00,8.8,'2026-05-10 03:00:00.000','2026-09-09 01:09:49.548','2026-09-12 17:07:42.634'),(16,5,'E101','Căn hộ mini E101','Căn hộ mini có ban công, không gian học tập riêng.',4200000.00,4200000.00,35.00,2,2,'APARTMENT','AVAILABLE',4000.00,25000.00,150000.00,120000.00,80000.00,8.7,'2026-08-15 03:00:00.000','2026-09-09 01:09:49.567','2026-09-12 17:07:42.649'),(17,5,'E102','Studio E102 có thang máy','Studio hướng sáng, có thang máy và camera tầng.',3900000.00,3900000.00,31.00,2,1,'STUDIO','AVAILABLE',4000.00,25000.00,150000.00,120000.00,80000.00,8.6,'2026-08-19 03:00:00.000','2026-09-09 01:09:49.584','2026-09-12 17:07:42.666'),(18,5,'E201','Phòng E201 tạm ẩn','Phòng được tạm ẩn trong khi chủ trọ cập nhật thông tin.',3500000.00,3500000.00,27.00,2,0,'PRIVATE_ROOM','HIDDEN',4000.00,25000.00,120000.00,100000.00,50000.00,8.1,'2026-07-10 03:00:00.000','2026-09-09 01:09:49.601','2026-09-12 17:07:42.680'),(19,6,'P101','Phòng P101 gần Đại học Phenikaa','Phòng khép kín, phù hợp sinh viên muốn đi học trong vài phút.',2800000.00,2800000.00,24.00,2,1,'PRIVATE_ROOM','AVAILABLE',3500.00,20000.00,100000.00,100000.00,50000.00,9.4,'2026-08-20 03:00:00.000','2026-09-10 19:07:21.705','2026-09-12 17:07:42.363'),(20,6,'P102','Studio P102 có bàn học','Studio sáng thoáng, có bếp nhỏ và bàn học riêng.',3300000.00,3300000.00,29.00,2,2,'STUDIO','AVAILABLE',3500.00,20000.00,120000.00,100000.00,50000.00,9.5,'2026-08-22 03:00:00.000','2026-09-10 19:07:21.727','2026-09-12 17:07:42.381'),(21,6,'P201','Phòng P201 yên tĩnh tại Dương Nội','Phòng có ban công, thuận tiện cho hai bạn cùng học tại Phenikaa.',3000000.00,3000000.00,26.00,2,1,'SHARED_ROOM','AVAILABLE',3500.00,20000.00,100000.00,80000.00,30000.00,9.2,'2026-08-24 03:00:00.000','2026-09-10 19:07:21.747','2026-09-12 17:07:42.396'),(22,7,'F101','Studio F101 gần Mỹ Đình','Studio 32m² thoáng sáng, có bếp nhỏ và góc học tập riêng.',4200000.00,4200000.00,32.00,2,2,'STUDIO','AVAILABLE',4000.00,25000.00,150000.00,120000.00,80000.00,9.1,'2026-09-02 03:00:00.000','2026-09-12 17:06:37.479','2026-09-12 17:07:42.695'),(23,8,'G101','Phòng G101 Cổ Nhuế','Phòng khép kín yên tĩnh, thuận tiện di chuyển tới khu Phạm Văn Đồng.',2900000.00,2900000.00,23.00,2,1,'PRIVATE_ROOM','AVAILABLE',3500.00,20000.00,100000.00,80000.00,30000.00,8.8,'2026-09-03 03:00:00.000','2026-09-12 17:06:37.497','2026-09-12 17:07:42.709'),(24,9,'H101','Căn hộ mini H101 Nhân Chính','Căn hộ mini đầy đủ nội thất, có ban công và khu bếp độc lập.',4600000.00,4600000.00,36.00,2,2,'APARTMENT','AVAILABLE',4000.00,25000.00,150000.00,120000.00,80000.00,9.0,'2026-09-04 03:00:00.000','2026-09-12 17:06:37.513','2026-09-12 17:07:42.724'),(25,10,'J101','Phòng J101 cho nhóm ba bạn','Phòng rộng, phù hợp nhóm sinh viên cần tiết kiệm chi phí thuê.',3300000.00,3300000.00,28.00,3,2,'SHARED_ROOM','AVAILABLE',3500.00,20000.00,100000.00,80000.00,30000.00,8.5,'2026-09-05 03:00:00.000','2026-09-12 17:06:37.531','2026-09-12 17:07:42.742'),(26,11,'L101','Studio L101 Ngọc Lâm','Studio có cửa sổ lớn, bếp và khu giặt riêng trong phòng.',3700000.00,3700000.00,28.00,2,1,'STUDIO','AVAILABLE',4000.00,25000.00,120000.00,100000.00,50000.00,8.7,'2026-09-06 03:00:00.000','2026-09-12 17:06:37.550','2026-09-12 17:07:42.756'),(27,12,'M101','Phòng M101 Xuân La','Phòng khép kín gần hồ, không gian sáng và có chỗ để xe riêng.',3300000.00,3300000.00,22.00,2,2,'PRIVATE_ROOM','AVAILABLE',4000.00,25000.00,100000.00,100000.00,50000.00,8.6,'2026-09-07 03:00:00.000','2026-09-12 17:06:37.566','2026-09-12 17:07:42.771'),(28,13,'N101','Studio N101 Mỗ Lao','Studio có thang máy, bàn học và bếp nhỏ; phù hợp hai sinh viên.',3500000.00,3500000.00,30.00,2,2,'STUDIO','AVAILABLE',3500.00,20000.00,120000.00,100000.00,50000.00,9.0,'2026-09-08 03:00:00.000','2026-09-12 17:06:37.582','2026-09-12 17:07:42.788'),(29,14,'Q101','Phòng ở ghép Q101 Trâu Quỳ','Phòng ở ghép sạch sẽ, giá theo một chỗ ở, có giường và máy giặt chung.',1800000.00,1800000.00,40.00,4,2,'DORMITORY','AVAILABLE',3500.00,20000.00,100000.00,80000.00,30000.00,8.6,'2026-09-09 03:00:00.000','2026-09-12 17:06:37.603','2026-09-12 17:07:42.813'),(30,15,'R101','Phòng R101 Tân Triều','Phòng khép kín gần nhiều tuyến xe buýt, phù hợp ngân sách vừa phải.',2850000.00,2850000.00,24.00,2,1,'PRIVATE_ROOM','AVAILABLE',3500.00,20000.00,100000.00,80000.00,30000.00,8.4,'2026-09-10 03:00:00.000','2026-09-12 17:06:37.619','2026-09-12 17:07:42.831'),(31,16,'S101','Căn hộ mini S101 Ngọc Khánh','Căn hộ mini có phòng ngủ, bếp và ban công; thuận tiện đi học, đi làm.',5200000.00,5200000.00,38.00,2,2,'APARTMENT','AVAILABLE',4000.00,25000.00,150000.00,120000.00,80000.00,8.9,'2026-09-11 03:00:00.000','2026-09-12 17:06:37.637','2026-09-12 17:07:42.845');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_profiles`
--

DROP TABLE IF EXISTS `student_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `student_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `university_id` int DEFAULT NULL,
  `school_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `faculty` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `academic_year` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hometown` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_profiles_user_id_key` (`user_id`),
  UNIQUE KEY `student_profiles_student_code_key` (`student_code`),
  UNIQUE KEY `student_profiles_school_email_key` (`school_email`),
  KEY `student_profiles_university_id_idx` (`university_id`),
  CONSTRAINT `student_profiles_university_id_fkey` FOREIGN KEY (`university_id`) REFERENCES `universities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_profiles`
--

LOCK TABLES `student_profiles` WRITE;
/*!40000 ALTER TABLE `student_profiles` DISABLE KEYS */;
INSERT INTO `student_profiles` VALUES (1,2,'SV23010228',5,'minh.anh@phenikaa-uni.edu.vn','Công nghệ thông tin','K68','Hà Nội','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.770','2026-09-12 17:07:41.664'),(2,3,'SV23010229',2,'linh.nguyen@neu.edu.vn','Kế toán','K66','Hải Phòng','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.794','2026-09-12 17:07:41.680'),(3,4,'SV23010230',3,'quang.tran@huce.edu.vn','Kỹ thuật xây dựng','K68','Nam Định','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.814','2026-09-12 17:07:41.702'),(4,5,'SV23010231',1,'thao.le@hust.edu.vn','Điện tử viễn thông','K68','Nghệ An','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.829','2026-09-12 17:07:41.716'),(5,6,'SV23010232',4,'duc.pham@tlu.edu.vn','Công nghệ thông tin','K65','Thái Bình','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.844','2026-09-12 17:07:41.730'),(6,7,'SV23010233',2,'mai.vu@neu.edu.vn','Marketing','K66','Hà Nội','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.860','2026-09-12 17:07:41.747'),(7,8,'SV23010234',3,'nam.do@huce.edu.vn','Kiến trúc','K68','Bắc Ninh','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.876','2026-09-12 17:07:41.760'),(8,9,'SV23010235',4,'han.bui@tlu.edu.vn','Kinh tế','K65','Hưng Yên','Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.','2026-09-09 01:09:48.891','2026-09-12 17:07:41.774'),(29,33,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-12 02:52:34.709','2026-09-12 02:52:34.709');
/*!40000 ALTER TABLE `student_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `universities`
--

DROP TABLE IF EXISTS `universities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `universities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `website` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `universities_code_key` (`code`),
  UNIQUE KEY `universities_name_key` (`name`),
  KEY `universities_latitude_longitude_idx` (`latitude`,`longitude`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `universities`
--

LOCK TABLES `universities` WRITE;
/*!40000 ALTER TABLE `universities` DISABLE KEYS */;
INSERT INTO `universities` VALUES (1,'HUST','Đại học Bách khoa Hà Nội','Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',21.0045000,105.8431000,'https://hust.edu.vn','2026-09-09 01:09:48.702','2026-09-12 17:07:41.634',0),(2,'NEU','Đại học Kinh tế Quốc dân','207 Giải Phóng, Hai Bà Trưng, Hà Nội',21.0019000,105.8418000,'https://neu.edu.vn','2026-09-09 01:09:48.720','2026-09-12 17:07:41.634',0),(3,'NUCE','Đại học Xây dựng Hà Nội','55 Giải Phóng, Hai Bà Trưng, Hà Nội',21.0030000,105.8455000,'https://huce.edu.vn','2026-09-09 01:09:48.738','2026-09-12 17:07:41.634',0),(4,'TLU','Đại học Thủy lợi','175 Tây Sơn, Đống Đa, Hà Nội',21.0072000,105.8286000,'https://tlu.edu.vn','2026-09-09 01:09:48.754','2026-09-12 17:07:41.634',0),(5,'PHENIKAA','Đại học Phenikaa','Đường Nguyễn Trác, phường Dương Nội, thành phố Hà Nội',20.9612416,105.7474728,'https://phenikaa-uni.edu.vn','2026-09-10 19:07:20.971','2026-09-12 17:07:41.650',1);
/*!40000 ALTER TABLE `universities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('STUDENT','LANDLORD','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','DISABLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `verification_status` enum('UNVERIFIED','PENDING','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNVERIFIED',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `username` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_phone_key` (`phone`),
  UNIQUE KEY `users_username_key` (`username`),
  KEY `users_role_status_idx` (`role`,`status`),
  KEY `users_verification_status_idx` (`verification_status`),
  CONSTRAINT `users_login_identifier_check` CHECK (((`username` is not null) or (`email` is not null)))
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Quản trị viên Demo','0900000001',NULL,'ADMIN','ACTIVE','VERIFIED','2026-09-09 01:09:48.491','2026-09-12 17:07:41.328','admin'),(2,'student@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Nguyễn Minh Anh','0900000011',NULL,'STUDENT','ACTIVE','VERIFIED','2026-09-09 01:09:48.526','2026-09-12 17:07:41.348','student'),(3,'linh.nguyen@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Nguyễn Khánh Linh','0900000012',NULL,'STUDENT','ACTIVE','VERIFIED','2026-09-09 01:09:48.546','2026-09-12 17:07:41.368','linh.nguyen'),(4,'quang.tran@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Trần Đức Quang','0900000013',NULL,'STUDENT','ACTIVE','PENDING','2026-09-09 01:09:48.561','2026-09-12 17:07:41.388','quang.tran'),(5,'thao.le@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Lê Phương Thảo','0900000014',NULL,'STUDENT','ACTIVE','VERIFIED','2026-09-09 01:09:48.577','2026-09-12 17:07:41.404','thao.le'),(6,'duc.pham@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Phạm Hoàng Đức','0900000015',NULL,'STUDENT','ACTIVE','UNVERIFIED','2026-09-09 01:09:48.594','2026-09-12 17:07:41.420','duc.pham'),(7,'mai.vu@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Vũ Thu Mai','0900000016',NULL,'STUDENT','ACTIVE','VERIFIED','2026-09-09 01:09:48.608','2026-09-12 17:07:41.439','mai.vu'),(8,'nam.do@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Đỗ Quốc Nam','0900000017',NULL,'STUDENT','ACTIVE','VERIFIED','2026-09-09 01:09:48.625','2026-09-12 17:07:41.454','nam.do'),(9,'han.bui@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Bùi Ngọc Hân','0900000018',NULL,'STUDENT','ACTIVE','REJECTED','2026-09-09 01:09:48.640','2026-09-12 17:07:41.480','han.bui'),(10,'chutro@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Trần Quốc Huy','0900000021',NULL,'LANDLORD','ACTIVE','VERIFIED','2026-09-09 01:09:48.658','2026-09-12 17:07:41.501','landlord'),(11,'ha.my@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Lê Hà My','0900000022',NULL,'LANDLORD','ACTIVE','VERIFIED','2026-09-09 01:09:48.671','2026-09-12 17:07:41.517','ha.my'),(12,'tuan.nguyen@gmail.com','$2b$12$ne1SN3gvUDxiXfBxp3j1guzwpLuLTnm5vB6rk0K8Lgewo5YqcA2oG','Nguyễn Anh Tuấn','0900000023',NULL,'LANDLORD','ACTIVE','PENDING','2026-09-09 01:09:48.686','2026-09-12 17:07:41.536','tuan.nguyen'),(33,'ahihi@gmail.com','$2b$12$jdcIBn7b1hPhMavhH955reLn.e6Mz2WTi/t/LpBlhsGCOILfOlfJa','LÊ ANH MINH','0522165135',NULL,'STUDENT','ACTIVE','PENDING','2026-09-12 02:52:34.709','2026-09-12 16:49:51.260','minzzz'),(34,NULL,'$2b$12$P5nImH5D7OI2UAJ4pi4mjelzO53iB7QptudWxmkJ6EGF2xfqo6GPa','thắng cùi bắp',NULL,NULL,'LANDLORD','ACTIVE','UNVERIFIED','2026-09-14 06:13:31.803','2026-09-14 06:13:31.803','thang');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verification_requests`
--

DROP TABLE IF EXISTS `verification_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `reviewed_by_id` int DEFAULT NULL,
  `type` enum('STUDENT','LANDLORD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('UNVERIFIED','PENDING','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `student_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `reviewer_note` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `verification_requests_user_id_status_created_at_idx` (`user_id`,`status`,`created_at`),
  KEY `verification_requests_reviewed_by_id_idx` (`reviewed_by_id`),
  KEY `verification_requests_status_created_at_idx` (`status`,`created_at`),
  CONSTRAINT `verification_requests_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `verification_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification_requests`
--

LOCK TABLES `verification_requests` WRITE;
/*!40000 ALTER TABLE `verification_requests` DISABLE KEYS */;
INSERT INTO `verification_requests` VALUES (1,2,1,'STUDENT','VERIFIED','SV23010228','minh.anh@phenikaa-uni.edu.vn','https://example.com/demo/student-card-minh-anh',NULL,'Đã đối chiếu mã sinh viên trong dữ liệu demo.','2026-08-12 03:00:00.000','2026-09-09 01:09:48.962','2026-09-12 17:07:41.847'),(2,10,1,'LANDLORD','VERIFIED',NULL,NULL,'https://example.com/demo/landlord-huy-id',NULL,'Đã xác minh thông tin liên hệ cho môi trường demo.','2026-08-13 03:00:00.000','2026-09-09 01:09:48.980','2026-09-12 17:07:41.866'),(3,12,NULL,'LANDLORD','PENDING',NULL,NULL,'https://example.com/demo/landlord-tuan-id','Yêu cầu chờ admin kiểm tra trong luồng demo.',NULL,NULL,'2026-09-09 01:09:49.003','2026-09-12 17:07:41.885'),(4,33,NULL,'STUDENT','PENDING','23010228','23010228@st.phenikaa-uni.edu.vn',NULL,NULL,NULL,NULL,'2026-09-12 16:49:51.241','2026-09-12 16:49:51.241');
/*!40000 ALTER TABLE `verification_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `viewing_appointments`
--

DROP TABLE IF EXISTS `viewing_appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `viewing_appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `student_id` int NOT NULL,
  `landlord_id` int NOT NULL,
  `scheduled_at` datetime(3) NOT NULL,
  `proposed_at` datetime(3) DEFAULT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','RESCHEDULED','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `student_note` text COLLATE utf8mb4_unicode_ci,
  `landlord_note` text COLLATE utf8mb4_unicode_ci,
  `responded_at` datetime(3) DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `viewing_appointments_room_id_scheduled_at_idx` (`room_id`,`scheduled_at`),
  KEY `viewing_appointments_landlord_id_status_scheduled_at_idx` (`landlord_id`,`status`,`scheduled_at`),
  KEY `viewing_appointments_student_id_status_scheduled_at_idx` (`student_id`,`status`,`scheduled_at`),
  CONSTRAINT `viewing_appointments_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `viewing_appointments_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `viewing_appointments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `viewing_appointments`
--

LOCK TABLES `viewing_appointments` WRITE;
/*!40000 ALTER TABLE `viewing_appointments` DISABLE KEYS */;
INSERT INTO `viewing_appointments` VALUES (1,5,2,10,'2026-09-12 08:00:00.000',NULL,'ACCEPTED','Em muốn xem kỹ hợp đồng mẫu và chi phí dịch vụ.','Anh sẽ mở phòng và chuẩn bị thông tin chi phí.','2026-09-02 04:12:00.000',NULL,'2026-09-09 01:09:53.383','2026-09-12 17:07:44.874'),(2,12,6,11,'2026-09-13 03:00:00.000',NULL,'PENDING','Em muốn xem phòng vào buổi sáng cuối tuần.',NULL,NULL,NULL,'2026-09-09 01:09:53.402','2026-09-12 17:07:44.898'),(3,10,4,12,'2026-09-11 10:00:00.000','2026-09-12 08:30:00.000','RESCHEDULED','Nhóm em có hai người cùng đi xem.','Chủ trọ đề xuất chuyển sang sáng thứ bảy.','2026-09-04 03:00:00.000',NULL,'2026-09-09 01:09:53.423','2026-09-12 17:07:44.918'),(4,4,3,10,'2026-08-29 08:00:00.000',NULL,'COMPLETED','Đã xem phòng cùng bạn ở ghép.','Đã dẫn khách xem phòng.','2026-08-28 03:00:00.000',NULL,'2026-09-09 01:09:53.442','2026-09-12 17:07:44.933'),(5,21,2,10,'2026-09-25 03:43:00.000',NULL,'PENDING',NULL,NULL,NULL,NULL,'2026-09-12 03:26:05.010','2026-09-12 03:26:05.010');
/*!40000 ALTER TABLE `viewing_appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'student_rental'
--

--
-- Dumping routines for database 'student_rental'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-14 13:45:59
