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
-- Štruktúra tabuľky pre tabuľku `group_messages`
--

CREATE TABLE `group_messages` (
  `id` int NOT NULL,
  `group_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `message` text,
  `attachment` text,
  `edited` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reply_to_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Sťahujem dáta pre tabuľku `group_messages`
--

INSERT INTO `group_messages` (`id`, `group_id`, `sender_id`, `message`, `attachment`, `edited`, `created_at`, `updated_at`, `reply_to_id`) VALUES
(1, 1, 1, 'dd', NULL, 0, '2026-01-26 11:04:07', '2026-01-26 11:04:07', NULL),
(2, 1, 1, 'ccc', NULL, 0, '2026-01-26 11:37:53', '2026-01-26 11:37:53', NULL),
(5, 1, 1, 'd', NULL, 0, '2026-01-26 11:38:02', '2026-01-26 11:38:02', NULL),
(6, 1, 1, 'dd', NULL, 0, '2026-01-26 11:38:02', '2026-01-26 11:38:02', NULL),
(10, 3, 1, 'caukod', NULL, 0, '2026-01-26 11:39:54', '2026-01-26 11:39:54', NULL),
(11, 3, 1, 'caukoddd', NULL, 0, '2026-01-26 11:39:59', '2026-01-26 11:39:59', NULL),
(14, 1, 1, 'sd', NULL, 0, '2026-01-29 12:40:43', '2026-01-29 12:40:43', NULL),
(15, 2, 1, 'fddf', NULL, 0, '2026-02-03 07:19:10', '2026-02-03 07:19:10', NULL),
(17, 1, 1, 'dsdssghgh', NULL, 1, '2026-02-03 07:19:29', '2026-02-19 09:18:42', NULL),
(18, 1, 1, 's', NULL, 0, '2026-02-03 07:19:30', '2026-02-03 07:19:30', NULL),
(19, 1, 1, 's', NULL, 0, '2026-02-03 07:19:30', '2026-02-03 07:19:30', NULL),
(23, 1, 2, 'cau', NULL, 0, '2026-02-05 08:19:03', '2026-02-05 08:19:03', NULL),
(33, 1, 1, 'hgh', NULL, 0, '2026-02-19 09:18:46', '2026-02-19 09:18:46', 17),
(34, 1, 1, 'dsds', NULL, 0, '2026-02-19 18:03:42', '2026-02-19 18:03:42', 23),
(36, 6, 1, 'fdf', NULL, 0, '2026-03-07 10:49:19', '2026-03-07 10:49:19', NULL),
(37, 6, 1, 'fddfddfdfd', NULL, 0, '2026-03-07 10:49:20', '2026-03-07 10:49:20', NULL),
(38, 6, 1, 'dfdf', NULL, 0, '2026-03-07 10:49:29', '2026-03-07 10:49:29', NULL),
(39, 1, 1, 'cau', NULL, 0, '2026-03-29 17:42:18', '2026-03-29 17:42:18', 23),
(40, 1, 1, 'dad', NULL, 1, '2026-04-05 15:48:45', '2026-04-07 08:16:17', NULL),
(41, 5, 2, 'cau', NULL, 0, '2026-04-07 09:12:37', '2026-04-07 09:12:37', NULL),
(42, 1, 1, 'fa', NULL, 0, '2026-04-07 09:12:51', '2026-04-07 09:12:51', NULL),
(43, 1, 1, 's', NULL, 0, '2026-04-07 09:12:51', '2026-04-07 09:12:51', NULL),
(44, 1, 1, 's', NULL, 0, '2026-04-07 09:12:51', '2026-04-07 09:12:51', NULL),
(45, 5, 2, 'haloo', NULL, 0, '2026-04-07 09:16:18', '2026-04-07 09:16:18', NULL),
(46, 5, 2, 'dad', NULL, 0, '2026-04-07 09:17:09', '2026-04-07 09:17:09', NULL),
(47, 5, 2, 'hej', NULL, 0, '2026-04-07 09:20:20', '2026-04-07 09:20:20', NULL),
(48, 1, 1, 'heej', NULL, 0, '2026-04-07 09:23:23', '2026-04-07 09:23:23', NULL),
(49, 6, 1, 'heej', NULL, 0, '2026-04-07 09:23:54', '2026-04-07 09:23:54', NULL),
(50, 6, 1, 'cauu', NULL, 0, '2026-04-07 09:24:03', '2026-04-07 09:24:03', NULL),
(51, 6, 1, 'cauu', NULL, 0, '2026-04-07 09:24:06', '2026-04-07 09:24:06', NULL),
(52, 6, 2, 'jak sa mas', NULL, 0, '2026-04-07 09:24:14', '2026-04-07 09:24:14', NULL),
(53, 6, 2, 'jak sa mas', NULL, 0, '2026-04-07 09:24:16', '2026-04-07 09:24:16', NULL),
(54, 6, 2, 'akoo', NULL, 0, '2026-04-07 09:24:24', '2026-04-07 09:24:24', NULL),
(55, 6, 2, 'akoo', NULL, 0, '2026-04-07 09:24:26', '2026-04-07 09:24:26', NULL),
(56, 6, 2, 'heej', NULL, 0, '2026-04-07 09:28:01', '2026-04-07 09:28:01', NULL),
(57, 6, 1, 'heeeeej', NULL, 0, '2026-04-07 09:28:09', '2026-04-07 09:28:09', NULL),
(58, 6, 2, 'cauaau', NULL, 0, '2026-04-07 09:28:16', '2026-04-07 09:28:16', 57),
(59, 6, 1, 'heeej', NULL, 0, '2026-04-07 09:45:52', '2026-04-07 09:45:52', NULL),
(60, 6, 2, 'heej', NULL, 0, '2026-04-07 19:01:45', '2026-04-07 19:01:45', NULL),
(61, 6, 1, 'heej', NULL, 0, '2026-04-07 19:05:16', '2026-04-07 19:05:16', NULL),
(62, 6, 28, 'heeej', NULL, 0, '2026-04-08 13:02:12', '2026-04-08 13:02:12', NULL),
(63, 6, 1, 'dada', NULL, 0, '2026-04-09 14:35:51', '2026-04-09 14:35:51', NULL),
(65, 6, 1, 'adada', NULL, 0, '2026-04-09 14:36:01', '2026-04-09 14:36:01', NULL),
(66, 6, 1, 'hej', NULL, 0, '2026-04-09 14:36:05', '2026-04-09 14:36:05', NULL),
(67, 6, 1, 'hej', NULL, 0, '2026-04-09 14:36:18', '2026-04-09 14:36:18', NULL),
(68, 6, 1, 'dsad', NULL, 0, '2026-04-09 14:36:19', '2026-04-09 14:36:19', NULL),
(69, 6, 1, 'dsd', NULL, 0, '2026-04-09 14:36:20', '2026-04-09 14:36:20', NULL),
(70, 6, 1, 'dad', NULL, 0, '2026-04-09 14:36:30', '2026-04-09 14:36:30', NULL),
(71, 6, 2, 'faf', NULL, 0, '2026-04-09 14:36:46', '2026-04-09 14:36:46', NULL),
(72, 6, 2, 'dada', NULL, 0, '2026-04-09 14:36:50', '2026-04-09 14:36:50', NULL),
(73, 6, 1, 'ad', NULL, 0, '2026-04-09 14:37:00', '2026-04-09 14:37:00', NULL),
(74, 13, 1, 'das', NULL, 0, '2026-04-09 17:48:06', '2026-04-09 17:48:06', NULL),
(75, 13, 1, 'da', NULL, 0, '2026-04-09 17:48:07', '2026-04-09 17:48:07', NULL),
(76, 13, 1, 'd', NULL, 0, '2026-04-09 17:48:07', '2026-04-09 17:48:07', NULL),
(77, 13, 1, 'ad', NULL, 0, '2026-04-09 17:48:07', '2026-04-09 17:48:07', NULL),
(78, 13, 1, 'ad', NULL, 0, '2026-04-09 17:48:07', '2026-04-09 17:48:07', NULL),
(79, 13, 1, 'a', NULL, 0, '2026-04-09 17:48:07', '2026-04-09 17:48:07', NULL),
(80, 13, 1, 'd', NULL, 0, '2026-04-09 17:48:08', '2026-04-09 17:48:08', NULL),
(81, 13, 1, 'a', NULL, 0, '2026-04-09 17:48:08', '2026-04-09 17:48:08', NULL),
(82, 13, 1, 'da', NULL, 0, '2026-04-09 17:48:08', '2026-04-09 17:48:08', NULL),
(83, 13, 1, 'd', NULL, 0, '2026-04-09 17:48:08', '2026-04-09 17:48:08', NULL),
(84, 13, 1, 'a', NULL, 0, '2026-04-09 17:48:08', '2026-04-09 17:48:08', NULL),
(85, 13, 1, 'da', NULL, 0, '2026-04-09 17:48:08', '2026-04-09 17:48:08', NULL),
(86, 13, 1, 'd', NULL, 0, '2026-04-09 17:48:09', '2026-04-09 17:48:09', NULL),
(87, 13, 1, 'ad', NULL, 0, '2026-04-09 17:48:09', '2026-04-09 17:48:09', NULL),
(88, 13, 1, 'da', NULL, 0, '2026-04-09 17:48:09', '2026-04-09 17:48:09', NULL),
(89, 13, 1, 'cac', NULL, 0, '2026-04-09 17:56:27', '2026-04-09 17:56:27', 88),
(91, 6, 1, 'dad', NULL, 0, '2026-04-11 17:53:32', '2026-04-11 17:53:32', NULL),
(92, 6, 1, 'dada', NULL, 0, '2026-04-11 17:53:34', '2026-04-11 17:53:34', NULL),
(93, 6, 1, 'da', NULL, 0, '2026-04-11 17:53:35', '2026-04-11 17:53:35', NULL),
(94, 6, 1, 'd', NULL, 0, '2026-04-11 17:53:35', '2026-04-11 17:53:35', NULL),
(95, 13, 1, 'dad', NULL, 0, '2026-04-11 17:53:37', '2026-04-11 17:53:37', NULL),
(99, 13, 1, 'heej', NULL, 0, '2026-04-12 09:12:58', '2026-04-12 09:12:58', NULL),
(100, 14, 57, 'ahwocnawa', NULL, 0, '2026-04-13 18:51:29', '2026-04-13 18:51:29', NULL),
(101, 14, 28, 'cau', NULL, 0, '2026-04-13 18:53:38', '2026-04-13 18:53:38', NULL),
(102, 14, 28, 'halo', NULL, 0, '2026-04-13 18:53:42', '2026-04-13 18:53:42', NULL),
(103, 14, 28, 'jshs', NULL, 0, '2026-04-13 18:53:50', '2026-04-13 18:53:50', NULL),
(104, 14, 28, 'hej', NULL, 0, '2026-04-13 18:53:54', '2026-04-13 18:53:54', NULL);

--
-- Kľúče pre exportované tabuľky
--

--
-- Indexy pre tabuľku `group_messages`
--
ALTER TABLE `group_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `fk_group_reply_to_message` (`reply_to_id`);

--
-- AUTO_INCREMENT pre exportované tabuľky
--

--
-- AUTO_INCREMENT pre tabuľku `group_messages`
--
ALTER TABLE `group_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- Obmedzenie pre exportované tabuľky
--

--
-- Obmedzenie pre tabuľku `group_messages`
--
ALTER TABLE `group_messages`
  ADD CONSTRAINT `fk_group_reply_to_message` FOREIGN KEY (`reply_to_id`) REFERENCES `group_messages` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `group_messages_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `chat_users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
