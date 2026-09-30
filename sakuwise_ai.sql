-- ========================================================
-- SAKUWISE AI — COMPLETE DATABASE DUMP (MySQL 8.0+)
-- Smart Finance, Brighter Future
-- Akun Demo: andrian@sakuwise.ai | Kata Sandi: password123
-- Tanggal Ekspor: 30 September 2026
-- ========================================================

CREATE DATABASE IF NOT EXISTS sakuwise_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sakuwise_ai;

-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: sakuwise_ai
-- ------------------------------------------------------
-- Server version	8.0.30

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
-- Current Database: `sakuwise_ai`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `sakuwise_ai` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `sakuwise_ai`;

--
-- Table structure for table `ai_conversations`
--

DROP TABLE IF EXISTS `ai_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_conversations` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_conversations_user_id_idx` (`user_id`),
  CONSTRAINT `ai_conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_conversations`
--

LOCK TABLES `ai_conversations` WRITE;
/*!40000 ALTER TABLE `ai_conversations` DISABLE KEYS */;
INSERT INTO `ai_conversations` VALUES ('024ef9d6-7954-4fc8-8a5f-3fa16c31b381','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Analisis Pengeluaran & Rencana Investasi','2026-09-30 07:10:14.950','2026-09-30 07:10:14.950'),('9b4c85b2-b19a-482e-8bbe-a761428771f9','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Berapa total pengeluaran dan pemasukanku...','2026-09-30 07:36:13.017','2026-09-30 07:36:13.017'),('a0ad749e-cd0d-444f-a42b-16e6247153b8','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Berapa total pengeluaran dan pemasukanku...','2026-09-30 07:35:22.592','2026-09-30 07:35:22.592'),('ef13d3ba-ee43-4976-b786-e7b86db0b115','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Berapa total pengeluaran dan pemasukanku...','2026-09-30 07:36:36.176','2026-09-30 07:36:36.176');
/*!40000 ALTER TABLE `ai_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_memories`
--

DROP TABLE IF EXISTS `ai_memories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_memories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `memory_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `consent_status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'APPROVED',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_memories_user_id_idx` (`user_id`),
  CONSTRAINT `ai_memories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_memories`
--

LOCK TABLES `ai_memories` WRITE;
/*!40000 ALTER TABLE `ai_memories` DISABLE KEYS */;
INSERT INTO `ai_memories` VALUES ('06f76f77-4645-48a4-afb3-8cdf06582539','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','GOAL','Fokus utama tahun 2026: Mengamankan Dana Darurat 6 bulan dan upgrade laptop kerja.','APPROVED','2026-09-30 07:10:14.958','2026-09-30 07:10:14.958'),('4b072b04-358a-40f4-9d1a-8b54a586a4d6','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','PREFERENCE','Pengguna tertarik dengan: \"Berapa total pengeluaran dan pemasukanku?\"','APPROVED','2026-09-30 07:35:22.641','2026-09-30 07:35:22.641'),('58af95e5-80d4-4a38-9766-3897e7481f98','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','PREFERENCE','Pengguna tertarik dengan: \"Berapa total pengeluaran dan pemasukanku?\"','APPROVED','2026-09-30 07:36:13.042','2026-09-30 07:36:13.042'),('815b8eb3-675e-439f-b89b-8c178acfab91','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','PREFERENCE','Pengguna tertarik dengan: \"Berapa total pengeluaran dan pemasukanku?\"','APPROVED','2026-09-30 07:36:36.205','2026-09-30 07:36:36.205'),('dafa414d-0b1d-40b8-8261-a12419e5489a','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','PREFERENCE','Pengguna memprioritaskan alokasi dana tabungan minimal 25% dari setiap penghasilan rutin.','APPROVED','2026-09-30 07:10:14.958','2026-09-30 07:10:14.958');
/*!40000 ALTER TABLE `ai_memories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_messages`
--

DROP TABLE IF EXISTS `ai_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_messages` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversation_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tool_metadata_json` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ai_messages_conversation_id_idx` (`conversation_id`),
  CONSTRAINT `ai_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_messages`
--

LOCK TABLES `ai_messages` WRITE;
/*!40000 ALTER TABLE `ai_messages` DISABLE KEYS */;
INSERT INTO `ai_messages` VALUES ('3502946c-cdd1-4993-9f7f-d587bdae56d4','a0ad749e-cd0d-444f-a42b-16e6247153b8','assistant','Berikut adalah ringkasan analisis keuangan pribadimu dalam 30 hari terakhir:\n\n📊 **Arus Kas:**\n* Total Pemasukan: **Rp 18.150.000**\n* Total Pengeluaran: **Rp 3.919.000**\n* Sisa Kas Bersih (Net): **Rp 14.231.000**\n* Tingkat Tabungan: **78%** (✅ Sangat Sehat)\n\n🏷️ **3 Pos Pengeluaran Terbesar:**\n1. **Belanja**: Rp 1.170.000 (30%)\n2. **Makan & Minum**: Rp 738.000 (19%)\n3. **Tempat Tinggal**: Rp 450.000 (11%)\n\n💡 **Saran Tindakan:**\n1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.\n2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.\n3. Kamu bisa tanyakan padaku kapan saja: *\"Bantu aku membuat anggaran bulanan\"* atau *\"Bantu rencana menabung\"*!','{\"thoughtProcess\":[\"[1. Memahami Maksud]: Menganalisis pesan pengguna \\\"Berapa total pengeluaran dan pemasukanku?\\\" untuk menentukan kebutuhan analisis finansial.\",\"[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.\",\"[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: 17.\",\"[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.\"],\"toolsUsed\":[{\"tool\":\"get_financial_summary\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Pemasukan: Rp 18.150.000, Pengeluaran: Rp 3.919.000, Rasio Tabungan: 78%\"},{\"tool\":\"get_expense_breakdown\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Ditemukan 9 kategori pengeluaran aktif.\"}]}','2026-09-30 07:35:22.649'),('3736bd2b-40ca-485b-8977-12ce49291a8d','ef13d3ba-ee43-4976-b786-e7b86db0b115','user','Berapa total pengeluaran dan pemasukanku?',NULL,'2026-09-30 07:36:36.183'),('4fa7d5f9-1126-4277-90e9-e9fd7b827014','ef13d3ba-ee43-4976-b786-e7b86db0b115','assistant','Berikut adalah ringkasan analisis keuangan pribadimu dalam 30 hari terakhir:\n\n📊 **Arus Kas:**\n* Total Pemasukan: **Rp 18.150.000**\n* Total Pengeluaran: **Rp 3.919.000**\n* Sisa Kas Bersih (Net): **Rp 14.231.000**\n* Tingkat Tabungan: **78%** (✅ Sangat Sehat)\n\n🏷️ **3 Pos Pengeluaran Terbesar:**\n1. **Belanja**: Rp 1.170.000 (30%)\n2. **Makan & Minum**: Rp 738.000 (19%)\n3. **Tempat Tinggal**: Rp 450.000 (11%)\n\n💡 **Saran Tindakan:**\n1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.\n2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.\n3. Kamu bisa tanyakan padaku kapan saja: *\"Bantu aku membuat anggaran bulanan\"* atau *\"Bantu rencana menabung\"*!','{\"thoughtProcess\":[\"[1. Memahami Maksud]: Menganalisis pesan pengguna \\\"Berapa total pengeluaran dan pemasukanku?\\\" untuk menentukan kebutuhan analisis finansial.\",\"[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.\",\"[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: 17.\",\"[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.\"],\"toolsUsed\":[{\"tool\":\"get_financial_summary\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Pemasukan: Rp 18.150.000, Pengeluaran: Rp 3.919.000, Rasio Tabungan: 78%\"},{\"tool\":\"get_expense_breakdown\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Ditemukan 9 kategori pengeluaran aktif.\"}]}','2026-09-30 07:36:36.209'),('6be91060-57a3-4d7f-8840-db5cd3e1c42d','024ef9d6-7954-4fc8-8a5f-3fa16c31b381','assistant','Halo Andrian! Berdasarkan data transaksi 30 hari terakhir, total pengeluaranmu terkontrol sangat baik dengan rasio tabungan mencapai 42%. Kategori pengeluaran terbesarmu saat ini adalah Makan & Minum (Rp 1.141.000) dan Belanja (Rp 1.170.000). Sangat direkomendasikan untuk mempertahankan rasio ini agar target Dana Daruratmu tercapai lebih cepat!',NULL,'2026-09-30 07:10:14.950'),('82beaa5f-f0db-40b5-9211-7525429e6479','9b4c85b2-b19a-482e-8bbe-a761428771f9','user','Berapa total pengeluaran dan pemasukanku?',NULL,'2026-09-30 07:36:13.022'),('b475f502-a4d7-4b7e-8583-847183e50a25','024ef9d6-7954-4fc8-8a5f-3fa16c31b381','user','Halo SAKUWISE AI, tolong analisis pengeluaranku bulan ini.',NULL,'2026-09-30 07:10:14.950'),('c61ed550-b1b1-4eeb-9e07-a329abe71b78','9b4c85b2-b19a-482e-8bbe-a761428771f9','assistant','Berikut adalah ringkasan analisis keuangan pribadimu dalam 30 hari terakhir:\n\n📊 **Arus Kas:**\n* Total Pemasukan: **Rp 18.150.000**\n* Total Pengeluaran: **Rp 3.919.000**\n* Sisa Kas Bersih (Net): **Rp 14.231.000**\n* Tingkat Tabungan: **78%** (✅ Sangat Sehat)\n\n🏷️ **3 Pos Pengeluaran Terbesar:**\n1. **Belanja**: Rp 1.170.000 (30%)\n2. **Makan & Minum**: Rp 738.000 (19%)\n3. **Tempat Tinggal**: Rp 450.000 (11%)\n\n💡 **Saran Tindakan:**\n1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.\n2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.\n3. Kamu bisa tanyakan padaku kapan saja: *\"Bantu aku membuat anggaran bulanan\"* atau *\"Bantu rencana menabung\"*!','{\"thoughtProcess\":[\"[1. Memahami Maksud]: Menganalisis pesan pengguna \\\"Berapa total pengeluaran dan pemasukanku?\\\" untuk menentukan kebutuhan analisis finansial.\",\"[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.\",\"[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: 17.\",\"[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.\"],\"toolsUsed\":[{\"tool\":\"get_financial_summary\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Pemasukan: Rp 18.150.000, Pengeluaran: Rp 3.919.000, Rasio Tabungan: 78%\"},{\"tool\":\"get_expense_breakdown\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Ditemukan 9 kategori pengeluaran aktif.\"}]}','2026-09-30 07:36:13.046'),('e671edca-8adc-4649-ae94-a12b28a7004d','a0ad749e-cd0d-444f-a42b-16e6247153b8','user','Berapa total pengeluaran dan pemasukanku?',NULL,'2026-09-30 07:35:22.612');
/*!40000 ALTER TABLE `ai_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `period_start` datetime(3) NOT NULL,
  `period_end` datetime(3) NOT NULL,
  `alert_threshold` int NOT NULL DEFAULT '80',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `budgets_user_id_idx` (`user_id`),
  KEY `budgets_category_id_idx` (`category_id`),
  CONSTRAINT `budgets_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `budgets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES ('1e609607-3d10-4e5b-bb63-1fd813da4a13','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','3218f0e8-0d6d-4bd8-8382-7fe3a414ea64','Anggaran Kuliner & Kopi',2000000.00,'2026-08-31 17:00:00.000','2026-09-30 16:59:59.999',75,'2026-09-30 07:10:14.924','2026-09-30 07:10:14.924'),('b0ec4a50-b668-4729-b5c3-13fe8100a00b','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','4365b6ed-81b7-48bf-9937-8a6ef674efeb','Anggaran Hobi & Liburan Akhir Pekan',800000.00,'2026-08-31 17:00:00.000','2026-09-30 16:59:59.999',90,'2026-09-30 07:10:14.924','2026-09-30 07:10:14.924'),('be4f8ab8-dcd0-46e2-997d-a5b5420ae8b3','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','148b8dee-85a1-4c9f-95ad-f79b3909687c','Anggaran Belanja Kebutuhan',1800000.00,'2026-08-31 17:00:00.000','2026-09-30 16:59:59.999',80,'2026-09-30 07:10:14.924','2026-09-30 07:10:14.924'),('da5d59e4-283a-45fc-acd9-d41a2a38018d','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3',NULL,'Batas Belanja Bulanan Total',7000000.00,'2026-08-31 17:00:00.000','2026-09-30 16:59:59.999',80,'2026-09-30 07:10:14.924','2026-09-30 07:10:14.924');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `categories_user_id_idx` (`user_id`),
  CONSTRAINT `categories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('148b8dee-85a1-4c9f-95ad-f79b3909687c','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Belanja','EXPENSE','ShoppingBag','#EC4899','2026-09-30 07:10:14.785'),('3218f0e8-0d6d-4bd8-8382-7fe3a414ea64','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Makan & Minum','EXPENSE','Utensils','#EF4444','2026-09-30 07:10:14.773'),('4365b6ed-81b7-48bf-9937-8a6ef674efeb','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Hiburan','EXPENSE','Film','#8B5CF6','2026-09-30 07:10:14.792'),('43b40c16-1193-4ada-86a1-bb2a3288b831','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Lainnya (Pengeluaran)','EXPENSE','MoreHorizontal','#64748B','2026-09-30 07:10:14.811'),('54151493-ab62-45fb-a348-408e00899dd0','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Langganan','EXPENSE','CreditCard','#6366F1','2026-09-30 07:10:14.807'),('5b710631-0805-43b1-8021-e3f2ec8789fc','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Pendidikan','EXPENSE','BookOpen','#3B82F6','2026-09-30 07:10:14.801'),('64020066-e496-4ce6-a959-a4a3dd83e4ce','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Kesehatan','EXPENSE','Activity','#06B6D4','2026-09-30 07:10:14.797'),('7e6298d4-ad2f-49a6-b406-3cdac1e83c9b','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Bisnis Sampingan','INCOME','TrendingUp','#14B8A6','2026-09-30 07:10:14.821'),('82ffe2d2-7325-4c62-b205-6f8c211a85d1','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Gaji Pokok','INCOME','Briefcase','#16A34A','2026-09-30 07:10:14.815'),('88ba121e-6f10-4293-afd4-3bbb89cfa7dc','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Freelance & Proyek','INCOME','Laptop','#0EA5E9','2026-09-30 07:10:14.818'),('8ddd0be7-334f-4d3e-8914-d87839199c82','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Investasi & Dividen','INCOME','BarChart2','#8B5CF6','2026-09-30 07:10:14.824'),('8e650814-8821-4852-b8a8-0e77954a8833','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Transportasi','EXPENSE','Car','#F97316','2026-09-30 07:10:14.782'),('be1c00c4-52fe-4e50-95c5-2bf117069528','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Tempat Tinggal','EXPENSE','Home','#10B981','2026-09-30 07:10:14.804'),('c6e55032-e061-4951-869a-2dd0664148ef','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Bonus & Hadiah','INCOME','Gift','#F59E0B','2026-09-30 07:10:14.828'),('ee5694ea-9b7e-4055-b9ac-32e5a8f3e0a2','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Tagihan & Utilitas','EXPENSE','FileText','#EAB308','2026-09-30 07:10:14.789');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_idx` (`user_id`),
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('30b5b884-a44e-4eca-9af0-0cdb3e186677','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','GOAL_MILESTONE','Milestone Tercapai: Dana Darurat! 🎯','Selamat! Target tabungan Dana Daruratmu kini telah mencapai 70% dari target Rp 25.000.000.','2026-09-29 07:10:14.815','2026-09-30 07:10:14.947'),('96c50c86-1209-46de-b647-c557d909fa41','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','BUDGET_ALERT','Peringatan Anggaran: Makan & Minum','Pengeluaran kategori Makan & Minum telah mencapai 78% dari batas anggaran bulanan.',NULL,'2026-09-30 07:10:14.947'),('9f550d9f-5d01-48e8-a8e9-3a66ada52533','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','SYSTEM','Laporan Keuangan Bulanan Siap','Ringkasan arus kas dan analisis kebiasaan belanja untuk bulan lalu sudah siap diunduh.','2026-09-27 07:10:14.815','2026-09-30 07:10:14.947');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `password_reset_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ocr_status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `extracted_data_json` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `receipts_user_id_idx` (`user_id`),
  CONSTRAINT `receipts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savings_contributions`
--

DROP TABLE IF EXISTS `savings_contributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savings_contributions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `goal_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `contribution_date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `savings_contributions_goal_id_idx` (`goal_id`),
  KEY `savings_contributions_user_id_idx` (`user_id`),
  CONSTRAINT `savings_contributions_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `savings_goals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `savings_contributions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savings_contributions`
--

LOCK TABLES `savings_contributions` WRITE;
/*!40000 ALTER TABLE `savings_contributions` DISABLE KEYS */;
INSERT INTO `savings_contributions` VALUES ('0d0f97f2-e22e-421a-985d-3e040771ac1e','0ccdfcc3-6a53-4e06-acf3-ce8191917771','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3',1200000.00,'2026-09-30 07:10:14.942','Tabungan tiket pesawat','2026-09-30 07:10:14.942'),('31555529-44d9-486c-b428-32432ca20d2d','e283427f-17cd-4aa7-b824-1ac891ed9601','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3',2000000.00,'2026-09-30 07:10:14.942','Bonus freelance tambahan','2026-09-30 07:10:14.942'),('3db8a698-90b1-44e1-9886-a71f83c9cd4b','e283427f-17cd-4aa7-b824-1ac891ed9601','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3',2500000.00,'2026-09-30 07:10:14.942','Setoran gajian bulan ini','2026-09-30 07:10:14.942'),('da7239d0-ced2-4398-9556-02eb1255ab56','b31e9d90-feab-4c36-b2cd-28c255cfed72','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3',3000000.00,'2026-09-30 07:10:14.942','Alokasi khusus gadget kerja','2026-09-30 07:10:14.942');
/*!40000 ALTER TABLE `savings_contributions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savings_goals`
--

DROP TABLE IF EXISTS `savings_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savings_goals` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `target_amount` decimal(15,2) NOT NULL,
  `current_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `target_date` datetime(3) NOT NULL,
  `priority` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_PROGRESS',
  `icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `savings_goals_user_id_idx` (`user_id`),
  CONSTRAINT `savings_goals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savings_goals`
--

LOCK TABLES `savings_goals` WRITE;
/*!40000 ALTER TABLE `savings_goals` DISABLE KEYS */;
INSERT INTO `savings_goals` VALUES ('0ccdfcc3-6a53-4e06-acf3-ce8191917771','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Liburan Akhir Tahun ke Labuan Bajo','Paket tur sailing komodo 4D3N bersama sahabat.',8500000.00,6200000.00,'2026-12-19 17:00:00.000','MEDIUM','IN_PROGRESS','Palmtree','2026-09-30 07:10:14.938','2026-09-30 07:10:14.938'),('b31e9d90-feab-4c36-b2cd-28c255cfed72','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','MacBook Pro M3 Max untuk Kerja','Upgrade workstation utama untuk menunjang performa pengembangan aplikasi AI.',32000000.00,21500000.00,'2027-01-14 17:00:00.000','HIGH','IN_PROGRESS','Laptop','2026-09-30 07:10:14.935','2026-09-30 07:10:14.935'),('e283427f-17cd-4aa7-b824-1ac891ed9601','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Dana Darurat Siaga (6 Bulan)','Tabungan likuid di reksadana pasar uang untuk keamanan finansial keluarga.',25000000.00,17500000.00,'2027-02-27 17:00:00.000','HIGH','IN_PROGRESS','ShieldCheck','2026-09-30 07:10:14.930','2026-09-30 07:10:14.930');
/*!40000 ALTER TABLE `savings_goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_idx` (`user_id`),
  CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `merchant` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_date` datetime(3) NOT NULL,
  `receipt_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transactions_user_id_idx` (`user_id`),
  KEY `transactions_category_id_idx` (`category_id`),
  KEY `transactions_transaction_date_idx` (`transaction_date`),
  KEY `transactions_receipt_id_fkey` (`receipt_id`),
  CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `transactions_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES ('18dc8570-c68d-4e0c-8727-5aa8d8f5d222','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','ee5694ea-9b7e-4055-b9ac-32e5a8f3e0a2','EXPENSE','Internet Fiber Indihome 50Mbps',385000.00,'Transaksi otomatis demo Internet Fiber Indihome 50Mbps','Telkom','Transfer Bank','2026-08-26 07:10:14.815',NULL,'2026-09-30 07:10:14.912','2026-09-30 07:10:14.912'),('1dde9e78-3830-4e2e-b63e-4d2829635612','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','148b8dee-85a1-4c9f-95ad-f79b3909687c','EXPENSE','Beli Keyboard Mechanical Wireless',750000.00,'Transaksi otomatis demo Beli Keyboard Mechanical Wireless','Tokopedia','Kartu Debit','2026-09-13 07:10:14.815',NULL,'2026-09-30 07:10:14.899','2026-09-30 07:10:14.899'),('206430b0-4394-4e3b-b257-9f53638a8370','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','3218f0e8-0d6d-4bd8-8382-7fe3a414ea64','EXPENSE','Dinner Sushi Tei Weekend',380000.00,'Transaksi otomatis demo Dinner Sushi Tei Weekend','Sushi Tei','Kartu Kredit','2026-09-24 07:10:14.815',NULL,'2026-09-30 07:10:14.877','2026-09-30 07:10:14.877'),('2660865a-3dea-4cac-bcd3-4e2be9b42390','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','4365b6ed-81b7-48bf-9937-8a6ef674efeb','EXPENSE','Tiket Bioskop IMAX 2 Pax',140000.00,'Transaksi otomatis demo Tiket Bioskop IMAX 2 Pax','Cinema XXI','E-Wallet','2026-09-19 07:10:14.815',NULL,'2026-09-30 07:10:14.891','2026-09-30 07:10:14.891'),('2a63794f-3cb9-4b2c-a1b6-123a1bb90b8d','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','8ddd0be7-334f-4d3e-8914-d87839199c82','INCOME','Dividen Reksadana & Saham BBCA',850000.00,'Transaksi otomatis demo Dividen Reksadana & Saham BBCA','Bibit / Stockbit','E-Wallet','2026-09-12 07:10:14.815',NULL,'2026-09-30 07:10:14.849','2026-09-30 07:10:14.849'),('30b5e9b5-0e16-4672-99df-f5ffc5f7a786','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','64020066-e496-4ce6-a959-a4a3dd83e4ce','EXPENSE','Vitamin C & Suplemen Imunitas',185000.00,'Transaksi otomatis demo Vitamin C & Suplemen Imunitas','Guardian Pharmacy','E-Wallet','2026-09-20 07:10:14.815',NULL,'2026-09-30 07:10:14.887','2026-09-30 07:10:14.887'),('40f4db59-e1d9-464b-8c60-74230fa2a582','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','148b8dee-85a1-4c9f-95ad-f79b3909687c','EXPENSE','Belanja Mingguan Sayur & Buah',420000.00,'Transaksi otomatis demo Belanja Mingguan Sayur & Buah','Superindo','Kartu Debit','2026-09-27 07:10:14.815',NULL,'2026-09-30 07:10:14.867','2026-09-30 07:10:14.867'),('65658ce7-207c-4074-a3d7-29736e35c5df','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','5b710631-0805-43b1-8021-e3f2ec8789fc','EXPENSE','Kursus Online Advanced TypeScript',320000.00,'Transaksi otomatis demo Kursus Online Advanced TypeScript','Udemy','Kartu Kredit','2026-09-06 07:10:14.815',NULL,'2026-09-30 07:10:14.905','2026-09-30 07:10:14.905'),('65a65138-0d9d-4b8f-8b17-304658acba21','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','82ffe2d2-7325-4c62-b205-6f8c211a85d1','INCOME','Gaji Pokok Bulan Lalu',12500000.00,'Transaksi otomatis demo Gaji Pokok Bulan Lalu','PT Tech Nusantara','Transfer Bank','2026-08-29 07:10:14.815',NULL,'2026-09-30 07:10:14.852','2026-09-30 07:10:14.852'),('67283647-3231-4c5a-a8e0-062ca6234d52','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','8e650814-8821-4852-b8a8-0e77954a8833','EXPENSE','Bensin Pertamax Full Tank',200000.00,'Transaksi otomatis demo Bensin Pertamax Full Tank','SPBU Pertamina','E-Wallet','2026-09-26 07:10:14.815',NULL,'2026-09-30 07:10:14.870','2026-09-30 07:10:14.870'),('71104354-d496-4b26-b31d-d04f96c3f22b','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','82ffe2d2-7325-4c62-b205-6f8c211a85d1','INCOME','Gaji Bulanan PT Tech Nusantara',12500000.00,'Transaksi otomatis demo Gaji Bulanan PT Tech Nusantara','PT Tech Nusantara','Transfer Bank','2026-09-28 07:10:14.815',NULL,'2026-09-30 07:10:14.834','2026-09-30 07:10:14.834'),('844a706c-6d44-455a-927a-75bd7ef51013','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','8e650814-8821-4852-b8a8-0e77954a8833','EXPENSE','Servis Berkala & Ganti Oli Motor',320000.00,'Transaksi otomatis demo Servis Berkala & Ganti Oli Motor','Bengkel Resmi Honda','Tunai','2026-08-19 07:10:14.815',NULL,'2026-09-30 07:10:14.919','2026-09-30 07:10:14.919'),('9e17f45e-9b29-4270-b06f-ed1ebcb8379e','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','3218f0e8-0d6d-4bd8-8382-7fe3a414ea64','EXPENSE','Makan Malam Bersama Tim',245000.00,'Transaksi otomatis demo Makan Malam Bersama Tim','Sate Khas Senayan','E-Wallet','2026-09-10 07:10:14.815',NULL,'2026-09-30 07:10:14.902','2026-09-30 07:10:14.902'),('a28f2bd8-defc-432e-b2ab-a01574c51faf','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','8e650814-8821-4852-b8a8-0e77954a8833','EXPENSE','Saldo Tol e-Toll Mandiri',150000.00,'Transaksi otomatis demo Saldo Tol e-Toll Mandiri','Indomaret','E-Wallet','2026-09-21 07:10:14.815',NULL,'2026-09-30 07:10:14.884','2026-09-30 07:10:14.884'),('b16e818a-833e-4293-bcf5-802d37ce75c4','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','54151493-ab62-45fb-a348-408e00899dd0','EXPENSE','Langganan Netflix Premium & Spotify',216000.00,'Transaksi otomatis demo Langganan Netflix Premium & Spotify','Netflix & Spotify','Kartu Kredit','2026-09-23 07:10:14.815',NULL,'2026-09-30 07:10:14.881','2026-09-30 07:10:14.881'),('c046a88c-463a-436f-b4ed-a9a2c9a9bba7','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','ee5694ea-9b7e-4055-b9ac-32e5a8f3e0a2','EXPENSE','Token Listrik PLN Rumah',350000.00,'Transaksi otomatis demo Token Listrik PLN Rumah','PLN Mobile','Transfer Bank','2026-09-25 07:10:14.815',NULL,'2026-09-30 07:10:14.873','2026-09-30 07:10:14.873'),('cddbc59d-dc59-4e5e-afd5-4d5fa97a675b','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','88ba121e-6f10-4293-afd4-3bbb89cfa7dc','INCOME','Pembuatan Landing Page Produk',3500000.00,'Transaksi otomatis demo Pembuatan Landing Page Produk','Startup Studio','Transfer Bank','2026-08-21 07:10:14.815',NULL,'2026-09-30 07:10:14.856','2026-09-30 07:10:14.856'),('d281beb8-1966-4295-a45a-ad62905ffaa0','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','3218f0e8-0d6d-4bd8-8382-7fe3a414ea64','EXPENSE','Traktir Ulang Tahun Keluarga',950000.00,'Transaksi otomatis demo Traktir Ulang Tahun Keluarga','Bandar Djakarta','Kartu Kredit','2026-08-23 07:10:14.815',NULL,'2026-09-30 07:10:14.916','2026-09-30 07:10:14.916'),('d6dfbe0a-96f7-404c-8a7e-848672938792','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','148b8dee-85a1-4c9f-95ad-f79b3909687c','EXPENSE','Belanja Bulanan Lengkap',1250000.00,'Transaksi otomatis demo Belanja Bulanan Lengkap','Lotte Mart','Kartu Debit','2026-08-28 07:10:14.815',NULL,'2026-09-30 07:10:14.908','2026-09-30 07:10:14.908'),('d9249851-1910-46f3-b407-4a0bdf51d6d0','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','be1c00c4-52fe-4e50-95c5-2bf117069528','EXPENSE','Iuran Pemeliharaan Lingkungan (IPL)',450000.00,'Transaksi otomatis demo Iuran Pemeliharaan Lingkungan (IPL)','Pengelola Cluster','Transfer Bank','2026-09-15 07:10:14.815',NULL,'2026-09-30 07:10:14.894','2026-09-30 07:10:14.894'),('dc0332d7-d99b-4023-be03-e3467b7e2194','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','3218f0e8-0d6d-4bd8-8382-7fe3a414ea64','EXPENSE','Makan Siang Bebek Kaleyo',65000.00,'Transaksi otomatis demo Makan Siang Bebek Kaleyo','Bebek Kaleyo','E-Wallet','2026-09-29 07:10:14.815',NULL,'2026-09-30 07:10:14.859','2026-09-30 07:10:14.859'),('f1832882-6ac4-446d-9f68-1e5c1f3fc80a','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','88ba121e-6f10-4293-afd4-3bbb89cfa7dc','INCOME','Pembayaran UI/UX Web App Fintech',4800000.00,'Transaksi otomatis demo Pembayaran UI/UX Web App Fintech','Klien Singapura','Transfer Bank','2026-09-18 07:10:14.815',NULL,'2026-09-30 07:10:14.844','2026-09-30 07:10:14.844'),('fe661cf7-d603-4f0b-84b7-2a0fbc008fb2','d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','3218f0e8-0d6d-4bd8-8382-7fe3a414ea64','EXPENSE','Kopi Susu & Pastry',48000.00,'Transaksi otomatis demo Kopi Susu & Pastry','Kopi Kenangan','QRIS','2026-09-28 07:10:14.815',NULL,'2026-09-30 07:10:14.863','2026-09-30 07:10:14.863');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `preference_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `preference_value_json` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_preferences_user_id_preference_key_key` (`user_id`,`preference_key`),
  KEY `user_preferences_user_id_idx` (`user_id`),
  CONSTRAINT `user_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
  `timezone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Jakarta',
  `theme_preference` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dark',
  `onboarding_completed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('d0a70882-c57d-4ec9-90b7-dd8ccb2962b3','Andrian Pratama','andrian@sakuwise.ai','$2a$10$aGcpDU2zDxHj0Ma5VVj3cuwx3oPoDDpwy4i7Zf.2wVTJv.h/fjCNi','https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80','IDR','Asia/Jakarta','dark',1,'2026-09-30 07:10:14.744','2026-09-30 07:10:14.744');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-30 15:29:41
