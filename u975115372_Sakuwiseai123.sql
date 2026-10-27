-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 27, 2026 at 03:51 AM
-- Server version: 11.8.9-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u975115372_Sakuwiseai123`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_conversations`
--

CREATE TABLE `ai_conversations` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_conversations`
--

INSERT INTO `ai_conversations` (`id`, `user_id`, `title`, `created_at`, `updated_at`) VALUES
('024ef9d6-7954-4fc8-8a5f-3fa16c31b381', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Analisis Pengeluaran & Rencana Investasi', '2026-09-30 07:10:14.950', '2026-09-30 07:10:14.950'),
('554dddcd-ee01-4d97-b971-93d2b5bb2a0b', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Analisis pengeluaranku bulan ini.', '2026-10-27 03:50:15.000', '2026-10-27 03:50:15.000'),
('9b4c85b2-b19a-482e-8bbe-a761428771f9', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Berapa total pengeluaran dan pemasukanku...', '2026-09-30 07:36:13.017', '2026-09-30 07:36:13.017'),
('a0ad749e-cd0d-444f-a42b-16e6247153b8', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Berapa total pengeluaran dan pemasukanku...', '2026-09-30 07:35:22.592', '2026-09-30 07:35:22.592'),
('ef13d3ba-ee43-4976-b786-e7b86db0b115', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Berapa total pengeluaran dan pemasukanku...', '2026-09-30 07:36:36.176', '2026-09-30 07:36:36.176');

-- --------------------------------------------------------

--
-- Table structure for table `ai_memories`
--

CREATE TABLE `ai_memories` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `memory_type` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `consent_status` varchar(191) NOT NULL DEFAULT 'APPROVED',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_memories`
--

INSERT INTO `ai_memories` (`id`, `user_id`, `memory_type`, `content`, `consent_status`, `created_at`, `updated_at`) VALUES
('06f76f77-4645-48a4-afb3-8cdf06582539', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'GOAL', 'Fokus utama tahun 2026: Mengamankan Dana Darurat 6 bulan dan upgrade laptop kerja.', 'APPROVED', '2026-09-30 07:10:14.958', '2026-09-30 07:10:14.958'),
('4b072b04-358a-40f4-9d1a-8b54a586a4d6', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'PREFERENCE', 'Pengguna tertarik dengan: \"Berapa total pengeluaran dan pemasukanku?\"', 'APPROVED', '2026-09-30 07:35:22.641', '2026-09-30 07:35:22.641'),
('58af95e5-80d4-4a38-9766-3897e7481f98', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'PREFERENCE', 'Pengguna tertarik dengan: \"Berapa total pengeluaran dan pemasukanku?\"', 'APPROVED', '2026-09-30 07:36:13.042', '2026-09-30 07:36:13.042'),
('815b8eb3-675e-439f-b89b-8c178acfab91', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'PREFERENCE', 'Pengguna tertarik dengan: \"Berapa total pengeluaran dan pemasukanku?\"', 'APPROVED', '2026-09-30 07:36:36.205', '2026-09-30 07:36:36.205'),
('dafa414d-0b1d-40b8-8261-a12419e5489a', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'PREFERENCE', 'Pengguna memprioritaskan alokasi dana tabungan minimal 25% dari setiap penghasilan rutin.', 'APPROVED', '2026-09-30 07:10:14.958', '2026-09-30 07:10:14.958');

-- --------------------------------------------------------

--
-- Table structure for table `ai_messages`
--

CREATE TABLE `ai_messages` (
  `id` varchar(191) NOT NULL,
  `conversation_id` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `tool_metadata_json` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_messages`
--

INSERT INTO `ai_messages` (`id`, `conversation_id`, `role`, `content`, `tool_metadata_json`, `created_at`) VALUES
('1fcdf3f4-9616-4d75-b750-67db0d235f43', '554dddcd-ee01-4d97-b971-93d2b5bb2a0b', 'user', 'Analisis pengeluaranku bulan ini.', NULL, '2026-10-27 03:50:15.000'),
('3502946c-cdd1-4993-9f7f-d587bdae56d4', 'a0ad749e-cd0d-444f-a42b-16e6247153b8', 'assistant', 'Berikut adalah ringkasan analisis keuangan pribadimu dalam 30 hari terakhir:\n\n📊 **Arus Kas:**\n* Total Pemasukan: **Rp 18.150.000**\n* Total Pengeluaran: **Rp 3.919.000**\n* Sisa Kas Bersih (Net): **Rp 14.231.000**\n* Tingkat Tabungan: **78%** (✅ Sangat Sehat)\n\n🏷️ **3 Pos Pengeluaran Terbesar:**\n1. **Belanja**: Rp 1.170.000 (30%)\n2. **Makan & Minum**: Rp 738.000 (19%)\n3. **Tempat Tinggal**: Rp 450.000 (11%)\n\n💡 **Saran Tindakan:**\n1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.\n2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.\n3. Kamu bisa tanyakan padaku kapan saja: *\"Bantu aku membuat anggaran bulanan\"* atau *\"Bantu rencana menabung\"*!', '{\"thoughtProcess\":[\"[1. Memahami Maksud]: Menganalisis pesan pengguna \\\"Berapa total pengeluaran dan pemasukanku?\\\" untuk menentukan kebutuhan analisis finansial.\",\"[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.\",\"[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: 17.\",\"[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.\"],\"toolsUsed\":[{\"tool\":\"get_financial_summary\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Pemasukan: Rp 18.150.000, Pengeluaran: Rp 3.919.000, Rasio Tabungan: 78%\"},{\"tool\":\"get_expense_breakdown\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Ditemukan 9 kategori pengeluaran aktif.\"}]}', '2026-09-30 07:35:22.649'),
('3736bd2b-40ca-485b-8977-12ce49291a8d', 'ef13d3ba-ee43-4976-b786-e7b86db0b115', 'user', 'Berapa total pengeluaran dan pemasukanku?', NULL, '2026-09-30 07:36:36.183'),
('4256d5c9-43f4-4291-8752-7a163c687185', '554dddcd-ee01-4d97-b971-93d2b5bb2a0b', 'user', 'Analisis Bulan Ini', NULL, '2026-10-27 03:50:33.000'),
('4fa7d5f9-1126-4277-90e9-e9fd7b827014', 'ef13d3ba-ee43-4976-b786-e7b86db0b115', 'assistant', 'Berikut adalah ringkasan analisis keuangan pribadimu dalam 30 hari terakhir:\n\n📊 **Arus Kas:**\n* Total Pemasukan: **Rp 18.150.000**\n* Total Pengeluaran: **Rp 3.919.000**\n* Sisa Kas Bersih (Net): **Rp 14.231.000**\n* Tingkat Tabungan: **78%** (✅ Sangat Sehat)\n\n🏷️ **3 Pos Pengeluaran Terbesar:**\n1. **Belanja**: Rp 1.170.000 (30%)\n2. **Makan & Minum**: Rp 738.000 (19%)\n3. **Tempat Tinggal**: Rp 450.000 (11%)\n\n💡 **Saran Tindakan:**\n1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.\n2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.\n3. Kamu bisa tanyakan padaku kapan saja: *\"Bantu aku membuat anggaran bulanan\"* atau *\"Bantu rencana menabung\"*!', '{\"thoughtProcess\":[\"[1. Memahami Maksud]: Menganalisis pesan pengguna \\\"Berapa total pengeluaran dan pemasukanku?\\\" untuk menentukan kebutuhan analisis finansial.\",\"[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.\",\"[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: 17.\",\"[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.\"],\"toolsUsed\":[{\"tool\":\"get_financial_summary\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Pemasukan: Rp 18.150.000, Pengeluaran: Rp 3.919.000, Rasio Tabungan: 78%\"},{\"tool\":\"get_expense_breakdown\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Ditemukan 9 kategori pengeluaran aktif.\"}]}', '2026-09-30 07:36:36.209'),
('6be91060-57a3-4d7f-8840-db5cd3e1c42d', '024ef9d6-7954-4fc8-8a5f-3fa16c31b381', 'assistant', 'Halo Andrian! Berdasarkan data transaksi 30 hari terakhir, total pengeluaranmu terkontrol sangat baik dengan rasio tabungan mencapai 42%. Kategori pengeluaran terbesarmu saat ini adalah Makan & Minum (Rp 1.141.000) dan Belanja (Rp 1.170.000). Sangat direkomendasikan untuk mempertahankan rasio ini agar target Dana Daruratmu tercapai lebih cepat!', NULL, '2026-09-30 07:10:14.950'),
('82beaa5f-f0db-40b5-9211-7525429e6479', '9b4c85b2-b19a-482e-8bbe-a761428771f9', 'user', 'Berapa total pengeluaran dan pemasukanku?', NULL, '2026-09-30 07:36:13.022'),
('b475f502-a4d7-4b7e-8583-847183e50a25', '024ef9d6-7954-4fc8-8a5f-3fa16c31b381', 'user', 'Halo SAKUWISE AI, tolong analisis pengeluaranku bulan ini.', NULL, '2026-09-30 07:10:14.950'),
('c61ed550-b1b1-4eeb-9e07-a329abe71b78', '9b4c85b2-b19a-482e-8bbe-a761428771f9', 'assistant', 'Berikut adalah ringkasan analisis keuangan pribadimu dalam 30 hari terakhir:\n\n📊 **Arus Kas:**\n* Total Pemasukan: **Rp 18.150.000**\n* Total Pengeluaran: **Rp 3.919.000**\n* Sisa Kas Bersih (Net): **Rp 14.231.000**\n* Tingkat Tabungan: **78%** (✅ Sangat Sehat)\n\n🏷️ **3 Pos Pengeluaran Terbesar:**\n1. **Belanja**: Rp 1.170.000 (30%)\n2. **Makan & Minum**: Rp 738.000 (19%)\n3. **Tempat Tinggal**: Rp 450.000 (11%)\n\n💡 **Saran Tindakan:**\n1. Pertahankan rasio tabungan di atas 20% dari penghasilan rutinmu.\n2. Pasang batas anggaran untuk kategori teratas agar tidak mengalami overspending di akhir bulan.\n3. Kamu bisa tanyakan padaku kapan saja: *\"Bantu aku membuat anggaran bulanan\"* atau *\"Bantu rencana menabung\"*!', '{\"thoughtProcess\":[\"[1. Memahami Maksud]: Menganalisis pesan pengguna \\\"Berapa total pengeluaran dan pemasukanku?\\\" untuk menentukan kebutuhan analisis finansial.\",\"[2. Rencana]: Memilih perangkat analisis data keuangan yang relevan dari Tool Registry.\",\"[3. Verifikasi Data]: Memvalidasi akurasi perhitungan agregat database MySQL. Total transaksi: 17.\",\"[4. Analisis Pola Keuangan]: Mengevaluasi pola belanja dan potensi kebocoran dana.\"],\"toolsUsed\":[{\"tool\":\"get_financial_summary\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Pemasukan: Rp 18.150.000, Pengeluaran: Rp 3.919.000, Rasio Tabungan: 78%\"},{\"tool\":\"get_expense_breakdown\",\"args\":{\"periodDays\":30},\"resultSummary\":\"Ditemukan 9 kategori pengeluaran aktif.\"}]}', '2026-09-30 07:36:13.046'),
('e671edca-8adc-4649-ae94-a12b28a7004d', 'a0ad749e-cd0d-444f-a42b-16e6247153b8', 'user', 'Berapa total pengeluaran dan pemasukanku?', NULL, '2026-09-30 07:35:22.612');

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `category_id` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `period_start` datetime(3) NOT NULL,
  `period_end` datetime(3) NOT NULL,
  `alert_threshold` int(11) NOT NULL DEFAULT 80,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`id`, `user_id`, `category_id`, `name`, `amount`, `period_start`, `period_end`, `alert_threshold`, `created_at`, `updated_at`) VALUES
('1e609607-3d10-4e5b-bb63-1fd813da4a13', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '3218f0e8-0d6d-4bd8-8382-7fe3a414ea64', 'Anggaran Kuliner & Kopi', 2000000.00, '2026-08-31 17:00:00.000', '2026-09-30 16:59:59.999', 75, '2026-09-30 07:10:14.924', '2026-09-30 07:10:14.924'),
('b0ec4a50-b668-4729-b5c3-13fe8100a00b', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '4365b6ed-81b7-48bf-9937-8a6ef674efeb', 'Anggaran Hobi & Liburan Akhir Pekan', 800000.00, '2026-08-31 17:00:00.000', '2026-09-30 16:59:59.999', 90, '2026-09-30 07:10:14.924', '2026-09-30 07:10:14.924'),
('be4f8ab8-dcd0-46e2-997d-a5b5420ae8b3', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '148b8dee-85a1-4c9f-95ad-f79b3909687c', 'Anggaran Belanja Kebutuhan', 1800000.00, '2026-08-31 17:00:00.000', '2026-09-30 16:59:59.999', 80, '2026-09-30 07:10:14.924', '2026-09-30 07:10:14.924'),
('da5d59e4-283a-45fc-acd9-d41a2a38018d', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', NULL, 'Batas Belanja Bulanan Total', 7000000.00, '2026-08-31 17:00:00.000', '2026-09-30 16:59:59.999', 80, '2026-09-30 07:10:14.924', '2026-09-30 07:10:14.924'),
('da7e4581-5ef8-461a-bd38-d309f81916d1', '11eba4a0-8c36-4337-a8c2-62c49874bc57', NULL, 'Batas Belanja Operasional', 4488401.00, '2026-10-23 00:00:00.000', '2026-11-25 00:00:00.000', 80, '2026-10-23 08:46:02.000', '2026-10-23 08:50:17.000');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `icon` varchar(191) NOT NULL,
  `color` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `user_id`, `name`, `type`, `icon`, `color`, `created_at`) VALUES
('13cf283f-58e1-424c-8eab-66ee7b10119f', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Transportasi', 'EXPENSE', 'Car', '#F97316', '2026-09-30 10:38:18.000'),
('148b8dee-85a1-4c9f-95ad-f79b3909687c', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Belanja', 'EXPENSE', 'ShoppingBag', '#EC4899', '2026-09-30 07:10:14.785'),
('18df1558-13e6-431a-88f3-62d3f9eec81d', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Tempat Tinggal', 'EXPENSE', 'Home', '#10B981', '2026-09-30 10:38:18.000'),
('258d673b-d3b3-4db0-8988-8e51db41afc0', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Hiburan', 'EXPENSE', 'Film', '#8B5CF6', '2026-09-30 10:38:18.000'),
('29e70eff-1374-4700-aa7c-854be95bf4eb', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Investasi', 'INCOME', 'BarChart2', '#8B5CF6', '2026-09-30 10:38:18.000'),
('3218f0e8-0d6d-4bd8-8382-7fe3a414ea64', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Makan & Minum', 'EXPENSE', 'Utensils', '#EF4444', '2026-09-30 07:10:14.773'),
('35562801-e96e-4392-8adc-44689c9c38c9', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Belanja', 'EXPENSE', 'ShoppingBag', '#EC4899', '2026-09-30 10:38:18.000'),
('3b473220-aba7-46d7-b112-345ed3662719', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Gaji', 'INCOME', 'Briefcase', '#16A34A', '2026-09-30 10:38:18.000'),
('4365b6ed-81b7-48bf-9937-8a6ef674efeb', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Hiburan', 'EXPENSE', 'Film', '#8B5CF6', '2026-09-30 07:10:14.792'),
('43b40c16-1193-4ada-86a1-bb2a3288b831', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Lainnya (Pengeluaran)', 'EXPENSE', 'MoreHorizontal', '#64748B', '2026-09-30 07:10:14.811'),
('54151493-ab62-45fb-a348-408e00899dd0', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Langganan', 'EXPENSE', 'CreditCard', '#6366F1', '2026-09-30 07:10:14.807'),
('5b710631-0805-43b1-8021-e3f2ec8789fc', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Pendidikan', 'EXPENSE', 'BookOpen', '#3B82F6', '2026-09-30 07:10:14.801'),
('64020066-e496-4ce6-a959-a4a3dd83e4ce', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Kesehatan', 'EXPENSE', 'Activity', '#06B6D4', '2026-09-30 07:10:14.797'),
('701920bd-754f-47e7-8d9a-591a556baba3', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Tagihan', 'EXPENSE', 'FileText', '#EAB308', '2026-09-30 10:38:18.000'),
('72704e27-19a8-4f3b-ac5a-fb670e8d99a4', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Kesehatan', 'EXPENSE', 'Activity', '#06B6D4', '2026-09-30 10:38:18.000'),
('79dea59c-28b2-4084-8478-8a90c3719bc1', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Pendidikan', 'EXPENSE', 'BookOpen', '#3B82F6', '2026-09-30 10:38:18.000'),
('7e6298d4-ad2f-49a6-b406-3cdac1e83c9b', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Bisnis Sampingan', 'INCOME', 'TrendingUp', '#14B8A6', '2026-09-30 07:10:14.821'),
('82ffe2d2-7325-4c62-b205-6f8c211a85d1', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Gaji Pokok', 'INCOME', 'Briefcase', '#16A34A', '2026-09-30 07:10:14.815'),
('83c60085-eeeb-42b2-b955-1fdbf1ba0a2b', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Bisnis', 'INCOME', 'TrendingUp', '#14B8A6', '2026-09-30 10:38:18.000'),
('88ba121e-6f10-4293-afd4-3bbb89cfa7dc', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Freelance & Proyek', 'INCOME', 'Laptop', '#0EA5E9', '2026-09-30 07:10:14.818'),
('8ddd0be7-334f-4d3e-8914-d87839199c82', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Investasi & Dividen', 'INCOME', 'BarChart2', '#8B5CF6', '2026-09-30 07:10:14.824'),
('8e650814-8821-4852-b8a8-0e77954a8833', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Transportasi', 'EXPENSE', 'Car', '#F97316', '2026-09-30 07:10:14.782'),
('a843f2e3-71ec-425f-bef4-714dee4fcc44', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Freelance', 'INCOME', 'Laptop', '#0EA5E9', '2026-09-30 10:38:18.000'),
('b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Makan & Minum', 'EXPENSE', 'Utensils', '#EF4444', '2026-09-30 10:38:18.000'),
('be1c00c4-52fe-4e50-95c5-2bf117069528', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Tempat Tinggal', 'EXPENSE', 'Home', '#10B981', '2026-09-30 07:10:14.804'),
('c519151b-fcdc-4dc7-9415-cde4850aac6e', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Langganan', 'EXPENSE', 'CreditCard', '#6366F1', '2026-09-30 10:38:18.000'),
('c6e55032-e061-4951-869a-2dd0664148ef', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Bonus & Hadiah', 'INCOME', 'Gift', '#F59E0B', '2026-09-30 07:10:14.828'),
('d2dfaa0a-81c7-4e2a-b580-ec46bbf11278', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Hadiah', 'INCOME', 'Gift', '#F59E0B', '2026-09-30 10:38:18.000'),
('ee5694ea-9b7e-4055-b9ac-32e5a8f3e0a2', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Tagihan & Utilitas', 'EXPENSE', 'FileText', '#EAB308', '2026-09-30 07:10:14.789'),
('fa9673f6-bff5-42e5-b544-0ebb4bb63552', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Lainnya (Pengeluaran)', 'EXPENSE', 'MoreHorizontal', '#64748B', '2026-09-30 10:38:18.000');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `read_at`, `created_at`) VALUES
('1fc3e3df-2bdb-474c-9768-63d3c1ceedcd', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'SYSTEM', 'Selamat Datang di SAKUWISE AI! 🎉', 'Mulai kelola keuanganmu dengan bijak dan raih tujuan finansialmu bersama kami.', NULL, '2026-09-30 10:38:18.000'),
('30b5b884-a44e-4eca-9af0-0cdb3e186677', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'GOAL_MILESTONE', 'Milestone Tercapai: Dana Darurat! 🎯', 'Selamat! Target tabungan Dana Daruratmu kini telah mencapai 70% dari target Rp 25.000.000.', '2026-09-29 07:10:14.815', '2026-09-30 07:10:14.947'),
('96c50c86-1209-46de-b647-c557d909fa41', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'BUDGET_ALERT', 'Peringatan Anggaran: Makan & Minum', 'Pengeluaran kategori Makan & Minum telah mencapai 78% dari batas anggaran bulanan.', NULL, '2026-09-30 07:10:14.947'),
('9f550d9f-5d01-48e8-a8e9-3a66ada52533', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'SYSTEM', 'Laporan Keuangan Bulanan Siap', 'Ringkasan arus kas dan analisis kebiasaan belanja untuk bulan lalu sudah siap diunduh.', '2026-09-27 07:10:14.815', '2026-09-30 07:10:14.947');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `token_hash` varchar(191) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `storage_key` varchar(191) NOT NULL,
  `original_filename` varchar(191) NOT NULL,
  `mime_type` varchar(191) NOT NULL,
  `ocr_status` varchar(191) NOT NULL DEFAULT 'COMPLETED',
  `extracted_data_json` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `savings_contributions`
--

CREATE TABLE `savings_contributions` (
  `id` varchar(191) NOT NULL,
  `goal_id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `contribution_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `note` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `savings_contributions`
--

INSERT INTO `savings_contributions` (`id`, `goal_id`, `user_id`, `amount`, `contribution_date`, `note`, `created_at`) VALUES
('0d0f97f2-e22e-421a-985d-3e040771ac1e', '0ccdfcc3-6a53-4e06-acf3-ce8191917771', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 1200000.00, '2026-09-30 07:10:14.942', 'Tabungan tiket pesawat', '2026-09-30 07:10:14.942'),
('31555529-44d9-486c-b428-32432ca20d2d', 'e283427f-17cd-4aa7-b824-1ac891ed9601', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 2000000.00, '2026-09-30 07:10:14.942', 'Bonus freelance tambahan', '2026-09-30 07:10:14.942'),
('3db8a698-90b1-44e1-9886-a71f83c9cd4b', 'e283427f-17cd-4aa7-b824-1ac891ed9601', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 2500000.00, '2026-09-30 07:10:14.942', 'Setoran gajian bulan ini', '2026-09-30 07:10:14.942'),
('da7239d0-ced2-4398-9556-02eb1255ab56', 'b31e9d90-feab-4c36-b2cd-28c255cfed72', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 3000000.00, '2026-09-30 07:10:14.942', 'Alokasi khusus gadget kerja', '2026-09-30 07:10:14.942');

-- --------------------------------------------------------

--
-- Table structure for table `savings_goals`
--

CREATE TABLE `savings_goals` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `target_amount` decimal(15,2) NOT NULL,
  `current_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `target_date` datetime(3) NOT NULL,
  `priority` varchar(191) NOT NULL DEFAULT 'MEDIUM',
  `status` varchar(191) NOT NULL DEFAULT 'IN_PROGRESS',
  `icon` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `savings_goals`
--

INSERT INTO `savings_goals` (`id`, `user_id`, `name`, `description`, `target_amount`, `current_amount`, `target_date`, `priority`, `status`, `icon`, `created_at`, `updated_at`) VALUES
('0ccdfcc3-6a53-4e06-acf3-ce8191917771', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Liburan Akhir Tahun ke Labuan Bajo', 'Paket tur sailing komodo 4D3N bersama sahabat.', 8500000.00, 6200000.00, '2026-12-19 17:00:00.000', 'MEDIUM', 'IN_PROGRESS', 'Palmtree', '2026-09-30 07:10:14.938', '2026-09-30 07:10:14.938'),
('9c03afcb-56fe-4959-abd2-b98b6dea1492', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Tabungan Akumulasi Target', 'Masa Depan', 10000000.00, 2700000.00, '2027-04-25 00:00:00.000', 'HIGH', 'IN_PROGRESS', 'ShieldCheck', '2026-10-23 08:47:47.000', '2026-10-23 08:56:49.000'),
('b31e9d90-feab-4c36-b2cd-28c255cfed72', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'MacBook Pro M3 Max untuk Kerja', 'Upgrade workstation utama untuk menunjang performa pengembangan aplikasi AI.', 32000000.00, 21500000.00, '2027-01-14 17:00:00.000', 'HIGH', 'IN_PROGRESS', 'Laptop', '2026-09-30 07:10:14.935', '2026-09-30 07:10:14.935'),
('e283427f-17cd-4aa7-b824-1ac891ed9601', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Dana Darurat Siaga (6 Bulan)', 'Tabungan likuid di reksadana pasar uang untuk keamanan finansial keluarga.', 25000000.00, 17500000.00, '2027-02-27 17:00:00.000', 'HIGH', 'IN_PROGRESS', 'ShieldCheck', '2026-09-30 07:10:14.930', '2026-09-30 07:10:14.930');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `token_hash` varchar(191) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `category_id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `merchant` varchar(191) DEFAULT NULL,
  `payment_method` varchar(191) NOT NULL,
  `transaction_date` datetime(3) NOT NULL,
  `receipt_id` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `category_id`, `type`, `title`, `amount`, `description`, `merchant`, `payment_method`, `transaction_date`, `receipt_id`, `created_at`, `updated_at`) VALUES
('0819c933-e6d0-4a9e-9575-98462e265a33', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', 'EXPENSE', 'Beli Dimsum', 48000.00, '', '', 'Transfer Bank', '2026-10-23 00:00:00.000', NULL, '2026-10-23 10:34:31.000', '2026-10-23 10:34:31.000'),
('0b15b67f-1dab-4cee-b48c-4d4588b7eaf5', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', 'EXPENSE', 'Beli Jajanan', 34900.00, '', '', 'Transfer Bank', '2026-10-18 00:00:00.000', NULL, '2026-10-23 05:46:02.000', '2026-10-23 05:46:02.000'),
('0f57c998-61bc-43f7-9368-94194b6113c8', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '701920bd-754f-47e7-8d9a-591a556baba3', 'EXPENSE', 'Bayar Listrik', 449200.00, '', '', 'Transfer Bank', '2026-10-02 00:00:00.000', NULL, '2026-10-23 05:38:59.000', '2026-10-23 05:38:59.000'),
('112e8278-8b22-40f8-b745-31fd193d3808', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '35562801-e96e-4392-8adc-44689c9c38c9', 'EXPENSE', 'Pembelian Barang', 225000.00, '', '', 'Transfer Bank', '2026-10-03 00:00:00.000', NULL, '2026-10-23 05:40:02.000', '2026-10-23 05:40:02.000'),
('18dc8570-c68d-4e0c-8727-5aa8d8f5d222', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'ee5694ea-9b7e-4055-b9ac-32e5a8f3e0a2', 'EXPENSE', 'Internet Fiber Indihome 50Mbps', 385000.00, 'Transaksi otomatis demo Internet Fiber Indihome 50Mbps', 'Telkom', 'Transfer Bank', '2026-08-26 07:10:14.815', NULL, '2026-09-30 07:10:14.912', '2026-09-30 07:10:14.912'),
('1dde9e78-3830-4e2e-b63e-4d2829635612', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '148b8dee-85a1-4c9f-95ad-f79b3909687c', 'EXPENSE', 'Beli Keyboard Mechanical Wireless', 750000.00, 'Transaksi otomatis demo Beli Keyboard Mechanical Wireless', 'Tokopedia', 'Kartu Debit', '2026-09-13 07:10:14.815', NULL, '2026-09-30 07:10:14.899', '2026-09-30 07:10:14.899'),
('206430b0-4394-4e3b-b257-9f53638a8370', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '3218f0e8-0d6d-4bd8-8382-7fe3a414ea64', 'EXPENSE', 'Dinner Sushi Tei Weekend', 380000.00, 'Transaksi otomatis demo Dinner Sushi Tei Weekend', 'Sushi Tei', 'Kartu Kredit', '2026-09-24 07:10:14.815', NULL, '2026-09-30 07:10:14.877', '2026-09-30 07:10:14.877'),
('2660865a-3dea-4cac-bcd3-4e2be9b42390', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '4365b6ed-81b7-48bf-9937-8a6ef674efeb', 'EXPENSE', 'Tiket Bioskop IMAX 2 Pax', 140000.00, 'Transaksi otomatis demo Tiket Bioskop IMAX 2 Pax', 'Cinema XXI', 'E-Wallet', '2026-09-19 07:10:14.815', NULL, '2026-09-30 07:10:14.891', '2026-09-30 07:10:14.891'),
('2840ca5b-99df-4a18-8cbf-b6b471e2942a', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'fa9673f6-bff5-42e5-b544-0ebb4bb63552', 'EXPENSE', 'Kondangan', 58500.00, '', '', 'Transfer Bank', '2026-10-10 00:00:00.000', NULL, '2026-10-23 05:41:58.000', '2026-10-23 05:41:58.000'),
('29ce22b4-6d43-4d6e-b7e4-0a29ec6a2d3f', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '3b473220-aba7-46d7-b112-345ed3662719', 'INCOME', 'Gaji Bulan September', 5800000.00, '', '', 'Transfer Bank', '2026-09-25 00:00:00.000', NULL, '2026-09-30 11:52:36.000', '2026-09-30 11:53:01.000'),
('2a63794f-3cb9-4b2c-a1b6-123a1bb90b8d', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '8ddd0be7-334f-4d3e-8914-d87839199c82', 'INCOME', 'Dividen Reksadana & Saham BBCA', 850000.00, 'Transaksi otomatis demo Dividen Reksadana & Saham BBCA', 'Bibit / Stockbit', 'E-Wallet', '2026-09-12 07:10:14.815', NULL, '2026-09-30 07:10:14.849', '2026-09-30 07:10:14.849'),
('30b5e9b5-0e16-4672-99df-f5ffc5f7a786', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '64020066-e496-4ce6-a959-a4a3dd83e4ce', 'EXPENSE', 'Vitamin C & Suplemen Imunitas', 185000.00, 'Transaksi otomatis demo Vitamin C & Suplemen Imunitas', 'Guardian Pharmacy', 'E-Wallet', '2026-09-20 07:10:14.815', NULL, '2026-09-30 07:10:14.887', '2026-09-30 07:10:14.887'),
('32932ef7-91ae-4f08-aed1-4b0872cc6d5a', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '3b473220-aba7-46d7-b112-345ed3662719', 'INCOME', 'Sisa Uang Bulan Agustus', 480173.00, '', '', 'Transfer Bank', '2026-09-25 00:00:00.000', NULL, '2026-09-30 12:09:26.000', '2026-09-30 12:09:26.000'),
('331971b1-596a-4b78-a37c-5e58002b9e1f', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '701920bd-754f-47e7-8d9a-591a556baba3', 'EXPENSE', 'Biaya ADMIN', 6000.00, '', '', 'Transfer Bank', '2026-09-30 00:00:00.000', NULL, '2026-10-23 05:36:57.000', '2026-10-23 05:36:57.000'),
('40f4db59-e1d9-464b-8c60-74230fa2a582', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '148b8dee-85a1-4c9f-95ad-f79b3909687c', 'EXPENSE', 'Belanja Mingguan Sayur & Buah', 420000.00, 'Transaksi otomatis demo Belanja Mingguan Sayur & Buah', 'Superindo', 'Kartu Debit', '2026-09-27 07:10:14.815', NULL, '2026-09-30 07:10:14.867', '2026-09-30 07:10:14.867'),
('43691928-b1df-413a-af9e-f1f25f7a0a8b', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'fa9673f6-bff5-42e5-b544-0ebb4bb63552', 'EXPENSE', 'Bayar Kebutuhan Rumah', 1500000.00, '', '', 'Transfer Bank', '2026-10-23 00:00:00.000', NULL, '2026-10-23 05:48:40.000', '2026-10-23 05:48:40.000'),
('4d1b48fb-8a5f-4fed-84ce-468f49c75f9c', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '701920bd-754f-47e7-8d9a-591a556baba3', 'EXPENSE', 'Tagihan Dana', 101000.00, '', '', 'Transfer Bank', '2026-10-20 00:00:00.000', NULL, '2026-10-23 05:46:55.000', '2026-10-23 05:46:55.000'),
('548762d4-5cd7-4c60-8f34-c02922af9c8a', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'fa9673f6-bff5-42e5-b544-0ebb4bb63552', 'EXPENSE', 'Tak Terduga', 1001.00, '', '', 'Transfer Bank', '2026-10-23 00:00:00.000', NULL, '2026-10-23 05:54:08.000', '2026-10-23 05:54:08.000'),
('5d910fad-e7fa-4a7b-aa12-d6acae379c19', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '701920bd-754f-47e7-8d9a-591a556baba3', 'EXPENSE', 'Bayar Tagihan', 315000.00, '', '', 'Transfer Bank', '2026-09-25 00:00:00.000', NULL, '2026-09-30 11:56:16.000', '2026-09-30 11:56:16.000'),
('65658ce7-207c-4074-a3d7-29736e35c5df', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '5b710631-0805-43b1-8021-e3f2ec8789fc', 'EXPENSE', 'Kursus Online Advanced TypeScript', 320000.00, 'Transaksi otomatis demo Kursus Online Advanced TypeScript', 'Udemy', 'Kartu Kredit', '2026-09-06 07:10:14.815', NULL, '2026-09-30 07:10:14.905', '2026-09-30 07:10:14.905'),
('65a65138-0d9d-4b8f-8b17-304658acba21', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '82ffe2d2-7325-4c62-b205-6f8c211a85d1', 'INCOME', 'Gaji Pokok Bulan Lalu', 12500000.00, 'Transaksi otomatis demo Gaji Pokok Bulan Lalu', 'PT Tech Nusantara', 'Transfer Bank', '2026-08-29 07:10:14.815', NULL, '2026-09-30 07:10:14.852', '2026-09-30 07:10:14.852'),
('67283647-3231-4c5a-a8e0-062ca6234d52', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '8e650814-8821-4852-b8a8-0e77954a8833', 'EXPENSE', 'Bensin Pertamax Full Tank', 200000.00, 'Transaksi otomatis demo Bensin Pertamax Full Tank', 'SPBU Pertamina', 'E-Wallet', '2026-09-26 07:10:14.815', NULL, '2026-09-30 07:10:14.870', '2026-09-30 07:10:14.870'),
('6919d353-b642-40e1-b927-b3f6b6d70e7c', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', 'EXPENSE', 'Beli Jajan', 33452.00, '', '', 'Transfer Bank', '2026-10-11 00:00:00.000', NULL, '2026-10-23 05:43:09.000', '2026-10-23 05:43:09.000'),
('71104354-d496-4b26-b31d-d04f96c3f22b', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '82ffe2d2-7325-4c62-b205-6f8c211a85d1', 'INCOME', 'Gaji Bulanan PT Tech Nusantara', 12500000.00, 'Transaksi otomatis demo Gaji Bulanan PT Tech Nusantara', 'PT Tech Nusantara', 'Transfer Bank', '2026-09-28 07:10:14.815', NULL, '2026-09-30 07:10:14.834', '2026-09-30 07:10:14.834'),
('79c12849-7381-4027-8cae-ffdbca5f8f22', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', 'EXPENSE', 'Beli Bakso', 42000.00, '', '', 'Transfer Bank', '2026-10-25 00:00:00.000', NULL, '2026-10-25 11:18:16.000', '2026-10-25 11:18:16.000'),
('7eed2736-abf3-475e-bf5e-9b0810babf5f', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'fa9673f6-bff5-42e5-b544-0ebb4bb63552', 'EXPENSE', 'Transfer Bank Mahfudin (Utang Ibu)', 500000.00, '', '', 'Transfer Bank', '2026-09-25 00:00:00.000', NULL, '2026-09-30 11:54:23.000', '2026-09-30 11:54:23.000'),
('844a706c-6d44-455a-927a-75bd7ef51013', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '8e650814-8821-4852-b8a8-0e77954a8833', 'EXPENSE', 'Servis Berkala & Ganti Oli Motor', 320000.00, 'Transaksi otomatis demo Servis Berkala & Ganti Oli Motor', 'Bengkel Resmi Honda', 'Tunai', '2026-08-19 07:10:14.815', NULL, '2026-09-30 07:10:14.919', '2026-09-30 07:10:14.919'),
('8bb760e0-46a9-4ef7-b849-3e573a92f4df', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'a843f2e3-71ec-425f-bef4-714dee4fcc44', 'INCOME', 'Tambahan Jajan', 100000.00, '', '', 'Transfer Bank', '2026-10-12 00:00:00.000', NULL, '2026-10-23 05:43:33.000', '2026-10-23 05:43:33.000'),
('9e17f45e-9b29-4270-b06f-ed1ebcb8379e', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '3218f0e8-0d6d-4bd8-8382-7fe3a414ea64', 'EXPENSE', 'Makan Malam Bersama Tim', 245000.00, 'Transaksi otomatis demo Makan Malam Bersama Tim', 'Sate Khas Senayan', 'E-Wallet', '2026-09-10 07:10:14.815', NULL, '2026-09-30 07:10:14.902', '2026-09-30 07:10:14.902'),
('9ee6dc2e-e898-4add-b232-eaed2a76e3d0', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '35562801-e96e-4392-8adc-44689c9c38c9', 'EXPENSE', 'Tarik Tunai', 1000000.00, '', '', 'Transfer Bank', '2026-09-25 00:00:00.000', NULL, '2026-09-30 11:54:52.000', '2026-09-30 11:54:52.000'),
('a28f2bd8-defc-432e-b2ab-a01574c51faf', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '8e650814-8821-4852-b8a8-0e77954a8833', 'EXPENSE', 'Saldo Tol e-Toll Mandiri', 150000.00, 'Transaksi otomatis demo Saldo Tol e-Toll Mandiri', 'Indomaret', 'E-Wallet', '2026-09-21 07:10:14.815', NULL, '2026-09-30 07:10:14.884', '2026-09-30 07:10:14.884'),
('a48080d9-f530-4304-97e9-9607f6a33a17', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '35562801-e96e-4392-8adc-44689c9c38c9', 'EXPENSE', 'Beli minyak wangi', 100000.00, '', '', 'Transfer Bank', '2026-10-25 00:00:00.000', NULL, '2026-10-25 11:17:48.000', '2026-10-25 11:17:48.000'),
('a98f365b-362e-4af0-b181-dbb0585dcbb3', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', 'EXPENSE', 'Bayar Jajan', 74499.00, '', '', 'Transfer Bank', '2026-10-13 00:00:00.000', NULL, '2026-10-23 05:44:05.000', '2026-10-23 05:44:05.000'),
('aa74935e-8a44-467e-b8c0-e012aaf74197', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '35562801-e96e-4392-8adc-44689c9c38c9', 'EXPENSE', 'Belanja IDM', 329200.00, '', '', 'Transfer Bank', '2026-09-25 00:00:00.000', NULL, '2026-09-30 11:55:50.000', '2026-09-30 11:55:50.000'),
('b16e818a-833e-4293-bcf5-802d37ce75c4', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '54151493-ab62-45fb-a348-408e00899dd0', 'EXPENSE', 'Langganan Netflix Premium & Spotify', 216000.00, 'Transaksi otomatis demo Langganan Netflix Premium & Spotify', 'Netflix & Spotify', 'Kartu Kredit', '2026-09-23 07:10:14.815', NULL, '2026-09-30 07:10:14.881', '2026-09-30 07:10:14.881'),
('b2d8fd92-a474-4328-b4b6-a88b44bc51dc', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'c519151b-fcdc-4dc7-9415-cde4850aac6e', 'EXPENSE', 'Paket Bulanan', 72000.00, '', '', 'Transfer Bank', '2026-09-27 00:00:00.000', NULL, '2026-09-30 11:57:03.000', '2026-09-30 11:57:03.000'),
('b51e6d46-01e5-404d-85ce-18b9384b579a', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '35562801-e96e-4392-8adc-44689c9c38c9', 'EXPENSE', 'Belanja Mingguan', 552500.00, '', '', 'Transfer Bank', '2026-10-04 00:00:00.000', NULL, '2026-10-23 05:41:08.000', '2026-10-23 05:41:08.000'),
('b9253f17-40cc-47b6-a690-86f534a0a19a', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'a843f2e3-71ec-425f-bef4-714dee4fcc44', 'INCOME', 'Uang Masuk', 500000.00, '', '', 'Transfer Bank', '2026-10-15 00:00:00.000', NULL, '2026-10-23 05:45:02.000', '2026-10-23 05:45:02.000'),
('bbdf913a-195c-40c4-8657-2fd18e2edd9c', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '701920bd-754f-47e7-8d9a-591a556baba3', 'EXPENSE', 'WiFi dan ICould', 301000.00, '', '', 'Transfer Bank', '2026-10-26 00:00:00.000', NULL, '2026-10-26 13:30:40.000', '2026-10-26 13:30:40.000'),
('c046a88c-463a-436f-b4ed-a9a2c9a9bba7', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'ee5694ea-9b7e-4055-b9ac-32e5a8f3e0a2', 'EXPENSE', 'Token Listrik PLN Rumah', 350000.00, 'Transaksi otomatis demo Token Listrik PLN Rumah', 'PLN Mobile', 'Transfer Bank', '2026-09-25 07:10:14.815', NULL, '2026-09-30 07:10:14.873', '2026-09-30 07:10:14.873'),
('c31f40db-9907-4e91-8a26-c5047449df1c', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'fa9673f6-bff5-42e5-b544-0ebb4bb63552', 'EXPENSE', 'Top Up Saldo', 100000.00, '', '', 'Transfer Bank', '2026-10-01 00:00:00.000', NULL, '2026-10-23 05:37:51.000', '2026-10-23 05:37:51.000'),
('c3800cd1-f657-4c08-af39-5642674ec8af', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', 'EXPENSE', 'Beli Makanan', 101000.00, '', '', 'Transfer Bank', '2026-10-21 00:00:00.000', NULL, '2026-10-23 05:47:23.000', '2026-10-23 05:47:23.000'),
('cddbc59d-dc59-4e5e-afd5-4d5fa97a675b', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '88ba121e-6f10-4293-afd4-3bbb89cfa7dc', 'INCOME', 'Pembuatan Landing Page Produk', 3500000.00, 'Transaksi otomatis demo Pembuatan Landing Page Produk', 'Startup Studio', 'Transfer Bank', '2026-08-21 07:10:14.815', NULL, '2026-09-30 07:10:14.856', '2026-09-30 07:10:14.856'),
('d281beb8-1966-4295-a45a-ad62905ffaa0', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '3218f0e8-0d6d-4bd8-8382-7fe3a414ea64', 'EXPENSE', 'Traktir Ulang Tahun Keluarga', 950000.00, 'Transaksi otomatis demo Traktir Ulang Tahun Keluarga', 'Bandar Djakarta', 'Kartu Kredit', '2026-08-23 07:10:14.815', NULL, '2026-09-30 07:10:14.916', '2026-09-30 07:10:14.916'),
('d6dfbe0a-96f7-404c-8a7e-848672938792', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '148b8dee-85a1-4c9f-95ad-f79b3909687c', 'EXPENSE', 'Belanja Bulanan Lengkap', 1250000.00, 'Transaksi otomatis demo Belanja Bulanan Lengkap', 'Lotte Mart', 'Kartu Debit', '2026-08-28 07:10:14.815', NULL, '2026-09-30 07:10:14.908', '2026-09-30 07:10:14.908'),
('d9249851-1910-46f3-b407-4a0bdf51d6d0', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'be1c00c4-52fe-4e50-95c5-2bf117069528', 'EXPENSE', 'Iuran Pemeliharaan Lingkungan (IPL)', 450000.00, 'Transaksi otomatis demo Iuran Pemeliharaan Lingkungan (IPL)', 'Pengelola Cluster', 'Transfer Bank', '2026-09-15 07:10:14.815', NULL, '2026-09-30 07:10:14.894', '2026-09-30 07:10:14.894'),
('dc0332d7-d99b-4023-be03-e3467b7e2194', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '3218f0e8-0d6d-4bd8-8382-7fe3a414ea64', 'EXPENSE', 'Makan Siang Bebek Kaleyo', 65000.00, 'Transaksi otomatis demo Makan Siang Bebek Kaleyo', 'Bebek Kaleyo', 'E-Wallet', '2026-09-29 07:10:14.815', NULL, '2026-09-30 07:10:14.859', '2026-09-30 07:10:14.859'),
('e1521d9e-1835-4d5f-8b92-66bad0af1119', '11eba4a0-8c36-4337-a8c2-62c49874bc57', 'b6b5f6e3-55aa-43b5-95c5-8b65b88f8308', 'EXPENSE', 'Uang Jajan Mingguan', 527500.00, '', '', 'Transfer Bank', '2026-10-15 00:00:00.000', NULL, '2026-10-23 05:44:38.000', '2026-10-23 05:44:38.000'),
('eb04633d-11c7-40b4-8c42-cb214155a78d', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '35562801-e96e-4392-8adc-44689c9c38c9', 'EXPENSE', 'Pembelian Barang', 487400.00, '', '', 'Transfer Bank', '2026-10-23 00:00:00.000', NULL, '2026-10-23 05:49:31.000', '2026-10-23 05:49:31.000'),
('eee59e61-1da1-446c-9e02-d8651554f6f8', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '701920bd-754f-47e7-8d9a-591a556baba3', 'EXPENSE', 'Paket Data', 72000.00, '', '', 'Transfer Bank', '2026-10-26 00:00:00.000', NULL, '2026-10-26 13:30:12.000', '2026-10-26 13:30:12.000'),
('ef19da09-3ff9-4b86-ac8c-f833fac66957', '11eba4a0-8c36-4337-a8c2-62c49874bc57', '3b473220-aba7-46d7-b112-345ed3662719', 'INCOME', 'Gaji Bulan Oktober', 5800000.00, '', '', 'Transfer Bank', '2026-10-23 00:00:00.000', NULL, '2026-10-23 05:48:03.000', '2026-10-23 05:48:03.000'),
('f1832882-6ac4-446d-9f68-1e5c1f3fc80a', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '88ba121e-6f10-4293-afd4-3bbb89cfa7dc', 'INCOME', 'Pembayaran UI/UX Web App Fintech', 4800000.00, 'Transaksi otomatis demo Pembayaran UI/UX Web App Fintech', 'Klien Singapura', 'Transfer Bank', '2026-09-18 07:10:14.815', NULL, '2026-09-30 07:10:14.844', '2026-09-30 07:10:14.844'),
('fe661cf7-d603-4f0b-84b7-2a0fbc008fb2', 'd0a70882-c57d-4ec9-90b7-dd8ccb2962b3', '3218f0e8-0d6d-4bd8-8382-7fe3a414ea64', 'EXPENSE', 'Kopi Susu & Pastry', 48000.00, 'Transaksi otomatis demo Kopi Susu & Pastry', 'Kopi Kenangan', 'QRIS', '2026-09-28 07:10:14.815', NULL, '2026-09-30 07:10:14.863', '2026-09-30 07:10:14.863');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(191) NOT NULL,
  `avatar_url` mediumtext DEFAULT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'IDR',
  `timezone` varchar(191) NOT NULL DEFAULT 'Asia/Jakarta',
  `theme_preference` varchar(191) NOT NULL DEFAULT 'dark',
  `onboarding_completed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `avatar_url`, `currency`, `timezone`, `theme_preference`, `onboarding_completed`, `created_at`, `updated_at`) VALUES
('11eba4a0-8c36-4337-a8c2-62c49874bc57', 'Andrian', 'andriandowehz123@gmail.com', '$2y$10$YoIvOtkrL3DzNlVmF2fpgO5DvfDmnOo6e/TALs8S2T07lcp2aXaxu', 'https://api.dicebear.com/7.x/bottts/svg?seed=Andrian', 'IDR', 'Asia/Jakarta', 'dark', 1, '2026-09-30 10:38:18.000', '2026-10-26 13:10:56.000'),
('d0a70882-c57d-4ec9-90b7-dd8ccb2962b3', 'Andrian Pratama', 'andrian@sakuwise.ai', '$2a$10$aGcpDU2zDxHj0Ma5VVj3cuwx3oPoDDpwy4i7Zf.2wVTJv.h/fjCNi', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'IDR', 'Asia/Jakarta', 'dark', 1, '2026-09-30 07:10:14.744', '2026-09-30 07:10:14.744');

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `preference_key` varchar(191) NOT NULL,
  `preference_value_json` text NOT NULL,
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_conversations`
--
ALTER TABLE `ai_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_conversations_user_id_idx` (`user_id`);

--
-- Indexes for table `ai_memories`
--
ALTER TABLE `ai_memories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_memories_user_id_idx` (`user_id`);

--
-- Indexes for table `ai_messages`
--
ALTER TABLE `ai_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_messages_conversation_id_idx` (`conversation_id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `budgets_user_id_idx` (`user_id`),
  ADD KEY `budgets_category_id_idx` (`category_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categories_user_id_idx` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_idx` (`user_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `password_reset_tokens_user_id_idx` (`user_id`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `receipts_user_id_idx` (`user_id`);

--
-- Indexes for table `savings_contributions`
--
ALTER TABLE `savings_contributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `savings_contributions_goal_id_idx` (`goal_id`),
  ADD KEY `savings_contributions_user_id_idx` (`user_id`);

--
-- Indexes for table `savings_goals`
--
ALTER TABLE `savings_goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `savings_goals_user_id_idx` (`user_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_idx` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transactions_user_id_idx` (`user_id`),
  ADD KEY `transactions_category_id_idx` (`category_id`),
  ADD KEY `transactions_transaction_date_idx` (`transaction_date`),
  ADD KEY `transactions_receipt_id_fkey` (`receipt_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_preferences_user_id_preference_key_key` (`user_id`,`preference_key`),
  ADD KEY `user_preferences_user_id_idx` (`user_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ai_conversations`
--
ALTER TABLE `ai_conversations`
  ADD CONSTRAINT `ai_conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ai_memories`
--
ALTER TABLE `ai_memories`
  ADD CONSTRAINT `ai_memories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ai_messages`
--
ALTER TABLE `ai_messages`
  ADD CONSTRAINT `ai_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `budgets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `receipts`
--
ALTER TABLE `receipts`
  ADD CONSTRAINT `receipts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `savings_contributions`
--
ALTER TABLE `savings_contributions`
  ADD CONSTRAINT `savings_contributions_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `savings_goals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `savings_contributions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `savings_goals`
--
ALTER TABLE `savings_goals`
  ADD CONSTRAINT `savings_goals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
