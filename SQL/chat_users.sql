-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hostiteľ: 172.17.0.1:3306
-- Čas generovania: Uto 14.Apr 2026, 10:07
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
-- Štruktúra tabuľky pre tabuľku `chat_users`
--

CREATE TABLE `chat_users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `profile_picture` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  `google_id` varchar(255) DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT '0',
  `last_active` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Sťahujem dáta pre tabuľku `chat_users`
--

INSERT INTO `chat_users` (`id`, `username`, `email`, `password`, `profile_picture`, `created_at`, `is_verified`, `google_id`, `is_online`, `last_active`) VALUES
(1, 'Karci1', 'karoltomko19@gmail.com', '$2b$10$HZ.gGTjoTh1fBehhL3kkoeDDp1zGMzxmberz3jINEwwiKDFIeh6Ce', '/uploads/profile_pictures/profile_1_1775999167574.png', '2025-12-11 16:59:50', 1, NULL, 0, '2026-04-14 09:45:04'),
(2, 'Andrej', 'nobigoy720@mekuron.com', '$2b$10$jmIIyxwiY5MrFhzbWQ8KgOYDa6C233VgtjX/WWbpFZQ1MZYC4PzYG', '/uploads/profile_pictures/profile_2_1770280002414.jpeg', '2025-12-21 12:47:00', 1, NULL, 0, '2026-04-11 22:18:01'),
(28, 'Karol Tomko', 'k.tomko@ostrovskeho.com', 'google_oauth', '/uploads/profile_pictures/profile_google_109063321765377208557_1772182391195.jpg', '2026-02-21 14:14:27', 1, '109063321765377208557', 1, '2026-04-14 09:51:53'),
(36, 'alonh', 'godote8433@kobace.com', '$2b$10$JJCchCA9FYPw0r/KzT4aWOoHtujI8hzhrLV9NM5tc0eYVDkWBL9QW', NULL, '2026-04-12 12:56:14', 1, NULL, 0, '2026-04-12 14:58:09'),
(55, 'Peter Tiža', 'p.tiza@ostrovskeho.com', 'google_oauth', '/uploads/profile_pictures/profile_55_1776063454856.avif', '2026-04-13 06:55:45', 1, '103743314783580226574', 0, '2026-04-13 09:03:22'),
(56, 'Peter', 'petertiza782@gmail.com', '$2b$10$8z5F96bzSSVHtpt7z08DzONp75h6Al82LQy7XEz3uVA.ZB0FNvKZK', NULL, '2026-04-13 07:04:15', 1, NULL, 0, NULL),
(57, 'gej', 'projektchladnicka@gmail.com', 'google_oauth', '/uploads/profile_pictures/profile_57_1776105995912.jpeg', '2026-04-13 18:44:20', 1, '108736816827270377760', 0, '2026-04-14 09:47:34'),
(58, 'Paul', 'paulvelky626@gmail.com', '$2b$10$8rLyQdbB6bPGMKSLl6yAmemsEVA.57T6u562BRnAQEAvK/FMIWF.6', NULL, '2026-04-13 20:08:35', 1, NULL, 0, '2026-04-13 22:19:46');

--
-- Kľúče pre exportované tabuľky
--

--
-- Indexy pre tabuľku `chat_users`
--
ALTER TABLE `chat_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `idx_google_id` (`google_id`);

--
-- AUTO_INCREMENT pre exportované tabuľky
--

--
-- AUTO_INCREMENT pre tabuľku `chat_users`
--
ALTER TABLE `chat_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
