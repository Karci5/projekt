-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hostiteľ: 172.17.0.1:3306
-- Čas generovania: Uto 14.Apr 2026, 10:08
-- Verzia serveru: 8.0.32-24
-- Verzia PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Databáza: `tomko`
--

-- --------------------------------------------------------

--
-- Štruktúra tabuľky pre tabuľku `groups`
--

CREATE TABLE `groups` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `avatar` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `theme_id` varchar(50) NOT NULL DEFAULT 'default',
  `theme_permission` varchar(20) NOT NULL DEFAULT 'admin_only'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Sťahujem dáta pre tabuľku `groups`
--

INSERT INTO `groups` (`id`, `name`, `description`, `avatar`, `created_by`, `created_at`, `updated_at`, `theme_id`, `theme_permission`) VALUES
(1, 'Skuska', NULL, '/uploads/images/group_1_1770279659858.png', 1, '2026-01-26 11:04:02', '2026-04-07 09:23:23', 'default', 'admin_only'),
(2, 'Skupinas', '', NULL, 1, '2026-01-26 11:37:29', '2026-02-03 07:19:10', 'default', 'admin_only'),
(3, 'casca', '', NULL, 1, '2026-01-26 11:37:38', '2026-02-03 07:19:22', 'default', 'admin_only'),
(4, 'Test', '', '/uploads/images/group_4_1770278308901.png', 1, '2026-02-05 07:57:58', '2026-02-05 07:58:29', 'default', 'admin_only'),
(5, 'Skuska2', '', '/uploads/images/group_5_1771681184388.png', 1, '2026-02-21 13:39:38', '2026-04-07 09:20:23', 'default', 'admin_only'),
(6, 'dsd', '', '/uploads/images/group_6_1772046988199.png', 1, '2026-02-25 16:38:30', '2026-04-11 17:53:35', 'rose', 'all_members'),
(7, 'dad', '', NULL, 1, '2026-04-09 14:41:13', '2026-04-09 14:41:13', 'default', 'admin_only'),
(8, 'dad', '', NULL, 1, '2026-04-09 14:41:16', '2026-04-09 14:41:16', 'default', 'admin_only'),
(9, 'dad', '', NULL, 1, '2026-04-09 14:41:17', '2026-04-09 14:41:17', 'default', 'admin_only'),
(10, 'dad', '', NULL, 1, '2026-04-09 14:41:20', '2026-04-09 14:41:20', 'default', 'admin_only'),
(11, 'dad', '', NULL, 1, '2026-04-09 14:41:22', '2026-04-09 14:41:22', 'default', 'admin_only'),
(12, 'dad', '', NULL, 1, '2026-04-09 14:41:23', '2026-04-09 14:41:23', 'default', 'admin_only'),
(13, 'Skupinka', '', '/uploads/images/group_13_1775940384202.webp', 1, '2026-04-09 17:37:31', '2026-04-12 09:12:59', 'default', 'admin_only'),
(14, 'whe´fcapi', '', '/uploads/images/group_57_1776106268596.jpeg', 57, '2026-04-13 18:51:08', '2026-04-13 18:53:55', 'sunset', 'admin_only');

--
-- Kľúče pre exportované tabuľky
--

--
-- Indexy pre tabuľku `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- AUTO_INCREMENT pre exportované tabuľky
--

--
-- AUTO_INCREMENT pre tabuľku `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Obmedzenie pre exportované tabuľky
--

--
-- Obmedzenie pre tabuľku `groups`
--
ALTER TABLE `groups`
  ADD CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `chat_users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
