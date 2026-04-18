-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hostiteľ: 172.17.0.1:3306
-- Čas generovania: Uto 14.Apr 2026, 10:09
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
-- Štruktúra tabuľky pre tabuľku `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `reset_token` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Sťahujem dáta pre tabuľku `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `reset_token`, `created_at`, `expires_at`) VALUES
(4, 28, 'e698c841ebcc4c7d4033ab016bb3d92a43d597af5b2a1404476a0f5d0cc5b705', '2026-04-09 18:37:23', '2026-04-09 19:37:23'),
(9, 28, '6cf0c6675366c0f22b72492d97db6e111305fece812d11efc4b5bb42971cb2d8', '2026-04-11 19:34:33', '2026-04-11 18:34:34'),
(12, 28, '4655e38259cf6c21d256316aa79be98334af89462e4910de4f23c29fe8d2b293', '2026-04-12 00:53:18', '2026-04-11 23:53:19'),
(13, 28, '6e8c2c7df35fb947fbd5877afdadda7a5c7ebf0346d362a81109da0a8eed9494', '2026-04-12 00:55:25', '2026-04-11 23:55:25'),
(15, 28, '6d6093e53882bed8de433ce94975bc11f2ec0859d7211dfec3029012912655f4', '2026-04-12 11:51:45', '2026-04-12 10:51:46');

--
-- Kľúče pre exportované tabuľky
--

--
-- Indexy pre tabuľku `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reset_token` (`reset_token`),
  ADD KEY `idx_reset_token` (`reset_token`),
  ADD KEY `idx_user_expires` (`user_id`,`expires_at`);

--
-- AUTO_INCREMENT pre exportované tabuľky
--

--
-- AUTO_INCREMENT pre tabuľku `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- Obmedzenie pre exportované tabuľky
--

--
-- Obmedzenie pre tabuľku `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `chat_users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
