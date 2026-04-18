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
-- Štruktúra tabuľky pre tabuľku `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int NOT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `message` text NOT NULL,
  `attachment` mediumtext,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `replyTo` text,
  `edited` tinyint(1) DEFAULT '0',
  `reply_to_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Sťahujem dáta pre tabuľku `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `sender_id`, `receiver_id`, `message`, `attachment`, `created_at`, `replyTo`, `edited`, `reply_to_id`) VALUES
(505, 1, 2, 'caukofaf', NULL, '2026-01-08 07:34:37', NULL, 1, NULL),
(509, 2, 1, 'ahoj', NULL, '2026-01-08 07:46:13', NULL, 0, NULL),
(510, 2, 1, 'cau', NULL, '2026-01-08 08:04:25', NULL, 0, NULL),
(513, 2, 1, 'hoj', NULL, '2026-01-08 09:15:03', NULL, 0, NULL),
(521, 2, 1, 'cau', NULL, '2026-01-21 15:58:52', NULL, 0, NULL),
(523, 2, 1, 'casdfsfsf', NULL, '2026-01-21 16:03:02', NULL, 1, NULL),
(536, 2, 1, 'cauko', NULL, '2026-01-21 16:56:45', NULL, 1, NULL),
(555, 1, 2, 'cauko', NULL, '2026-01-26 11:27:09', NULL, 0, NULL),
(556, 1, 2, 'ahojäsds', NULL, '2026-01-26 11:27:13', NULL, 1, NULL),
(558, 1, 2, 'ca', NULL, '2026-01-26 11:31:32', NULL, 0, NULL),
(582, 1, 2, 'cau', NULL, '2026-01-27 07:04:58', NULL, 0, NULL),
(583, 1, 2, 'cauko', NULL, '2026-01-27 07:05:21', NULL, 1, NULL),
(585, 2, 1, 'cau', NULL, '2026-01-27 07:20:22', NULL, 0, NULL),
(586, 2, 1, 'nazdar', NULL, '2026-01-27 07:20:39', NULL, 0, NULL),
(587, 2, 1, 'dad', NULL, '2026-01-27 07:20:43', NULL, 0, NULL),
(588, 2, 1, 'odkial si?7', NULL, '2026-01-27 07:20:50', NULL, 1, NULL),
(589, 2, 1, 'fdf', NULL, '2026-01-27 07:21:00', NULL, 0, NULL),
(591, 1, 2, 'cau', NULL, '2026-01-27 07:31:59', NULL, 0, NULL),
(592, 2, 1, 'cau', NULL, '2026-01-27 07:32:15', NULL, 0, NULL),
(593, 1, 2, 'caddsd', NULL, '2026-01-28 07:48:20', NULL, 1, NULL),
(598, 1, 2, 'dd', NULL, '2026-01-29 12:48:39', NULL, 0, NULL),
(604, 1, 2, 'cds', NULL, '2026-02-04 13:37:23', NULL, 0, NULL),
(608, 1, 2, 'fdfdf', NULL, '2026-02-04 13:40:14', NULL, 0, NULL),
(609, 1, 2, 'dsdä', NULL, '2026-02-04 13:42:10', NULL, 0, NULL),
(610, 1, 2, 'dsdsd', NULL, '2026-02-04 13:43:01', NULL, 0, NULL),
(611, 1, 2, 'dsds', NULL, '2026-02-04 13:44:46', NULL, 0, NULL),
(612, 1, 2, 'dsds', NULL, '2026-02-04 13:45:28', NULL, 0, NULL),
(613, 1, 2, 'dsd', NULL, '2026-02-04 13:46:21', NULL, 0, NULL),
(614, 1, 2, 'dadad', NULL, '2026-02-04 13:47:26', NULL, 0, NULL),
(615, 1, 2, 'dadad', NULL, '2026-02-04 13:52:17', NULL, 0, NULL),
(617, 1, 2, 'sfd', NULL, '2026-02-04 13:57:18', NULL, 0, NULL),
(621, 1, 2, 'fdfdfd', NULL, '2026-02-04 14:01:44', NULL, 1, NULL),
(631, 1, 2, '', '/uploads/images/chat_1770232562159_2239.jpeg', '2026-02-04 19:16:02', NULL, 0, NULL),
(646, 2, 1, 'nazdar', NULL, '2026-02-05 08:19:15', NULL, 0, NULL),
(659, 1, 2, 'asdasd', NULL, '2026-02-05 09:07:03', NULL, 0, NULL),
(663, 1, 2, 's', NULL, '2026-02-17 20:17:32', NULL, 0, NULL),
(667, 1, 2, 'https://radio.ostrovskeho.eu/profile', NULL, '2026-02-18 20:52:14', NULL, 0, NULL),
(668, 1, 2, 'df', NULL, '2026-02-19 08:41:10', NULL, 0, NULL),
(670, 1, 2, 'hfhf', NULL, '2026-02-19 09:19:04', NULL, 0, 668),
(674, 1, 2, '', '/uploads/images/chat_1771524019353_9344.png', '2026-02-19 18:00:19', NULL, 0, NULL),
(681, 1, 1, 'cau', NULL, '2026-02-21 14:40:40', NULL, 0, NULL),
(682, 1, 28, 'cau', NULL, '2026-02-21 14:42:14', NULL, 0, NULL),
(683, 28, 1, 'ahoj', NULL, '2026-02-21 14:42:29', NULL, 0, NULL),
(684, 1, 2, 'cauko', NULL, '2026-02-23 07:05:52', NULL, 0, NULL),
(689, 1, 2, 'akoooooo', NULL, '2026-02-27 08:52:09', NULL, 0, NULL),
(690, 1, 2, 'cauuu', NULL, '2026-02-27 08:52:15', NULL, 0, 689),
(693, 1, 2, 'dsdsňň', NULL, '2026-03-25 08:20:04', NULL, 0, 646),
(694, 1, 2, 'peto rad toci maty a vyhrava miliony', NULL, '2026-03-25 08:22:46', NULL, 1, NULL),
(695, 1, 2, 'dada', NULL, '2026-03-29 13:09:53', NULL, 0, NULL),
(697, 1, 28, 'cauä', NULL, '2026-03-29 14:02:10', NULL, 0, NULL),
(698, 1, 2, 'cau', NULL, '2026-03-29 20:12:21', NULL, 0, NULL),
(703, 1, 2, '', '/uploads/images/chat_1775322023634_5949.jpeg', '2026-04-04 17:00:24', NULL, 0, NULL),
(705, 1, 2, 'cau', NULL, '2026-04-05 15:21:27', NULL, 0, NULL),
(706, 1, 2, 'dada', NULL, '2026-04-05 17:36:55', NULL, 0, NULL),
(707, 1, 2, 'dadg', NULL, '2026-04-05 17:36:57', NULL, 1, NULL),
(708, 1, 2, 'dad', NULL, '2026-04-05 17:36:58', NULL, 0, NULL),
(709, 1, 2, 'ad', NULL, '2026-04-05 17:36:58', NULL, 0, NULL),
(710, 1, 2, 'dad', NULL, '2026-04-05 17:37:00', NULL, 0, NULL),
(711, 1, 2, 'dasdbbh', NULL, '2026-04-05 17:37:47', NULL, 1, NULL),
(712, 1, 28, 'cau', NULL, '2026-04-07 08:34:51', NULL, 0, NULL),
(713, 2, 1, 'cau', NULL, '2026-04-07 08:35:58', NULL, 0, NULL),
(714, 1, 2, 'hej', NULL, '2026-04-07 08:36:10', NULL, 0, NULL),
(715, 2, 1, 'haloo', NULL, '2026-04-07 09:13:03', NULL, 0, NULL),
(717, 2, 1, 'cau', NULL, '2026-04-07 09:25:35', NULL, 0, 714),
(718, 1, 2, 'dad', NULL, '2026-04-07 10:10:17', NULL, 0, NULL),
(719, 2, 1, 'halo', NULL, '2026-04-07 12:14:37', NULL, 0, NULL),
(720, 2, 1, 'hej', NULL, '2026-04-07 12:14:50', NULL, 0, NULL),
(721, 2, 1, 'heej', NULL, '2026-04-07 12:15:01', NULL, 0, NULL),
(722, 1, 2, 'ca', NULL, '2026-04-07 18:57:00', NULL, 0, NULL),
(723, 1, 2, 'cau', NULL, '2026-04-07 18:57:03', NULL, 0, NULL),
(724, 1, 2, 'heej', NULL, '2026-04-07 18:57:50', NULL, 0, NULL),
(725, 1, 2, 'heeej', NULL, '2026-04-07 18:57:54', NULL, 0, NULL),
(726, 1, 2, 'heej', NULL, '2026-04-07 18:58:13', NULL, 0, NULL),
(727, 1, 2, 'dad', NULL, '2026-04-07 18:58:20', NULL, 0, NULL),
(728, 1, 2, 'a', NULL, '2026-04-07 18:58:21', NULL, 0, NULL),
(729, 1, 2, 'heeej', NULL, '2026-04-07 18:58:36', NULL, 0, NULL),
(730, 1, 2, 'heeej', NULL, '2026-04-07 18:58:38', NULL, 0, NULL),
(731, 2, 1, 'heej', NULL, '2026-04-07 19:00:32', NULL, 0, NULL),
(732, 2, 1, 'heej', NULL, '2026-04-07 19:00:34', NULL, 0, NULL),
(734, 1, 2, 'coo7', NULL, '2026-04-07 19:00:50', NULL, 0, NULL),
(735, 1, 2, 'heej', NULL, '2026-04-07 19:00:57', NULL, 0, NULL),
(736, 1, 2, 'dad', NULL, '2026-04-07 19:00:59', NULL, 0, NULL),
(737, 1, 2, 'f', NULL, '2026-04-07 19:01:03', NULL, 0, NULL),
(738, 1, 2, 'fd', NULL, '2026-04-07 19:01:03', NULL, 0, NULL),
(739, 1, 2, 'd', NULL, '2026-04-07 19:01:04', NULL, 0, NULL),
(740, 1, 2, 'f', NULL, '2026-04-07 19:01:06', NULL, 0, NULL),
(741, 1, 2, 'f', NULL, '2026-04-07 19:01:06', NULL, 0, NULL),
(743, 1, 2, 'ddad', NULL, '2026-04-07 19:01:10', NULL, 0, NULL),
(745, 2, 1, 'hejeje7', NULL, '2026-04-07 19:04:43', NULL, 0, NULL),
(746, 1, 2, 'heej', NULL, '2026-04-07 19:05:09', NULL, 0, NULL),
(747, 1, 2, 'heej', NULL, '2026-04-07 19:05:21', NULL, 0, NULL),
(748, 1, 28, 'faf', NULL, '2026-04-07 19:05:26', NULL, 0, NULL),
(749, 2, 1, 'heej7', NULL, '2026-04-07 19:05:45', NULL, 0, NULL),
(750, 1, 2, 'cau', NULL, '2026-04-08 06:56:13', NULL, 0, NULL),
(751, 1, 2, 'halo kde si', NULL, '2026-04-08 06:56:20', NULL, 0, NULL),
(759, 1, 28, 'dadad', NULL, '2026-04-08 19:26:42', NULL, 0, NULL),
(760, 1, 2, 'ffasfaf', NULL, '2026-04-08 19:28:29', NULL, 0, NULL),
(764, 1, 2, '', '/uploads/images/chat_1775734114742_1043.png', '2026-04-09 11:28:34', NULL, 0, NULL),
(765, 1, 2, 'hej', NULL, '2026-04-09 14:36:12', NULL, 0, NULL),
(768, 1, 2, 'ddad', NULL, '2026-04-09 17:18:17', NULL, 0, 749),
(769, 1, 2, 'dadad', NULL, '2026-04-09 17:25:11', NULL, 0, NULL),
(770, 1, 2, 'dadad', NULL, '2026-04-09 17:34:07', NULL, 0, 749),
(772, 1, 2, 'dadada', NULL, '2026-04-09 17:56:42', NULL, 0, 745),
(773, 28, 1, 'dadad', NULL, '2026-04-09 18:16:35', NULL, 0, NULL),
(774, 28, 1, 'dad', NULL, '2026-04-09 18:16:36', NULL, 0, NULL),
(775, 28, 1, 'ad', NULL, '2026-04-09 18:16:36', NULL, 0, NULL),
(776, 28, 1, 'ad', NULL, '2026-04-09 18:16:36', NULL, 0, NULL),
(777, 28, 1, 'da', NULL, '2026-04-09 18:16:37', NULL, 0, NULL),
(778, 28, 1, 'd', NULL, '2026-04-09 18:16:37', NULL, 0, NULL),
(779, 28, 1, 'adad', NULL, '2026-04-09 18:16:38', NULL, 0, NULL),
(780, 1, 2, 'dad', NULL, '2026-04-09 18:20:25', NULL, 0, NULL),
(781, 1, 2, 'da', NULL, '2026-04-09 18:20:25', NULL, 0, NULL),
(782, 1, 2, 'd', NULL, '2026-04-09 18:20:26', NULL, 0, NULL),
(783, 1, 2, 'ad', NULL, '2026-04-09 18:20:26', NULL, 0, NULL),
(784, 1, 28, 'dad', NULL, '2026-04-09 18:20:33', NULL, 0, NULL),
(785, 28, 1, 'dad', NULL, '2026-04-09 18:20:41', NULL, 0, NULL),
(786, 1, 2, 'dad', NULL, '2026-04-09 18:22:55', NULL, 0, NULL),
(787, 1, 2, 'da', NULL, '2026-04-09 18:22:56', NULL, 0, NULL),
(788, 1, 2, 'd', NULL, '2026-04-09 18:22:56', NULL, 0, NULL),
(789, 1, 2, 'ad', NULL, '2026-04-09 18:22:56', NULL, 0, NULL),
(790, 1, 2, 'cau', NULL, '2026-04-11 13:46:26', NULL, 0, NULL),
(791, 1, 2, 'skuskaka', NULL, '2026-04-11 13:48:00', NULL, 0, NULL),
(792, 1, 2, '', '/uploads/images/chat_1775915300845_790.webp', '2026-04-11 13:48:20', NULL, 0, NULL),
(793, 1, 2, 'cau', NULL, '2026-04-11 13:57:23', NULL, 0, NULL),
(794, 1, 2, 'heeej', NULL, '2026-04-11 13:57:25', NULL, 0, NULL),
(795, 1, 28, 'jdndn', NULL, '2026-04-11 13:58:49', NULL, 0, NULL),
(797, 1, 28, 'dad', NULL, '2026-04-11 17:21:37', NULL, 0, NULL),
(798, 1, 28, '', '/uploads/images/chat_1775928117816_517.png', '2026-04-11 17:21:57', NULL, 0, NULL),
(801, 1, 28, '', '/uploads/images/chat_1775929989638_678.webp', '2026-04-11 17:53:09', NULL, 0, NULL),
(802, 1, 28, '', '/uploads/images/chat_1775929997982_9978.jpeg', '2026-04-11 17:53:17', NULL, 0, NULL),
(804, 1, 28, '', '/uploads/images/chat_1775931389047_6929.png', '2026-04-11 18:16:29', NULL, 0, NULL),
(805, 1, 28, '', '/uploads/images/chat_1775931874066_3305.webp', '2026-04-11 18:24:34', NULL, 0, NULL),
(806, 1, 28, 'dad', NULL, '2026-04-11 18:24:57', NULL, 0, NULL),
(807, 1, 28, '', '/uploads/images/chat_1775933087184_5646.png', '2026-04-11 18:44:47', NULL, 0, NULL),
(808, 2, 1, 'cau', NULL, '2026-04-11 19:56:33', NULL, 0, NULL),
(809, 1, 2, 'heej', NULL, '2026-04-11 19:56:49', NULL, 0, NULL),
(810, 2, 1, 'adad', NULL, '2026-04-11 19:57:11', NULL, 0, NULL),
(811, 2, 1, 'ad', NULL, '2026-04-11 19:57:12', NULL, 0, NULL),
(812, 2, 1, 'd', NULL, '2026-04-11 19:57:12', NULL, 0, NULL),
(813, 2, 1, 'ad', NULL, '2026-04-11 19:57:12', NULL, 0, NULL),
(814, 1, 2, 'dad', NULL, '2026-04-11 19:57:23', NULL, 0, NULL),
(815, 1, 2, 'da', NULL, '2026-04-11 19:57:23', NULL, 0, NULL),
(816, 1, 2, 'd', NULL, '2026-04-11 19:57:23', NULL, 0, NULL),
(817, 1, 2, 'd', NULL, '2026-04-11 19:57:23', NULL, 0, NULL),
(821, 2, 1, 'dasd', NULL, '2026-04-11 19:57:35', NULL, 0, NULL),
(822, 2, 1, 'dsd', NULL, '2026-04-11 19:57:36', NULL, 0, NULL),
(823, 1, 2, 'hej', NULL, '2026-04-11 19:57:45', NULL, 0, NULL),
(824, 2, 1, 'dsd', NULL, '2026-04-11 19:58:01', NULL, 0, NULL),
(825, 2, 1, 'ako sa mas?', NULL, '2026-04-11 19:58:04', NULL, 0, NULL),
(826, 1, 2, 'cscsc', NULL, '2026-04-11 19:58:14', NULL, 0, NULL),
(832, 1, 2, 'cau', NULL, '2026-04-11 20:02:51', NULL, 0, NULL),
(833, 1, 2, 'big boss', NULL, '2026-04-11 20:02:56', NULL, 0, NULL),
(842, 1, 2, '', '/uploads/images/chat_1775939085250_3880.png', '2026-04-11 20:24:45', NULL, 0, NULL),
(844, 1, 2, 'ad', NULL, '2026-04-11 20:29:59', NULL, 0, NULL),
(852, 28, 1, '', '/uploads/images/chat_1775950798892_1129.jpeg', '2026-04-11 23:39:58', NULL, 0, NULL),
(856, 28, 1, '', '/uploads/images/chat_1775985715772_425.webp', '2026-04-12 09:21:55', NULL, 0, NULL),
(859, 1, 2, '', '/uploads/images/chat_1775985825147_5657.png', '2026-04-12 09:23:45', NULL, 0, NULL),
(867, 1, 55, 'petooo', NULL, '2026-04-13 06:56:34', NULL, 0, NULL),
(868, 55, 1, 'cau', NULL, '2026-04-13 06:57:38', NULL, 0, NULL),
(869, 1, 55, 'heej', NULL, '2026-04-13 06:57:46', NULL, 0, NULL),
(870, 55, 1, 'okej', NULL, '2026-04-13 06:57:57', NULL, 0, NULL),
(871, 1, 55, 'chod spat', NULL, '2026-04-13 06:58:07', NULL, 1, NULL),
(872, 55, 1, 'sadujsadjsjadu', NULL, '2026-04-13 06:58:12', NULL, 0, NULL),
(873, 55, 1, 'ty', NULL, '2026-04-13 06:58:20', NULL, 0, 871),
(874, 1, 55, 'jak ja', NULL, '2026-04-13 06:58:24', NULL, 0, NULL),
(875, 28, 57, 'cau', NULL, '2026-04-13 18:46:09', NULL, 0, NULL),
(876, 57, 28, 'Karoooooooool', NULL, '2026-04-13 18:46:20', NULL, 0, NULL),
(877, 57, 28, '', '/uploads/images/chat_1776105986809_7938.jpeg', '2026-04-13 18:46:27', NULL, 0, NULL),
(878, 28, 57, 'zmen si profilovku', NULL, '2026-04-13 18:46:29', NULL, 0, NULL),
(880, 57, 28, 'už som si', NULL, '2026-04-13 18:46:46', NULL, 0, NULL),
(881, 28, 57, 'nice', NULL, '2026-04-13 18:46:52', NULL, 0, NULL),
(882, 57, 28, 'pekný som ?', NULL, '2026-04-13 18:46:54', NULL, 0, NULL),
(883, 28, 57, 'najkrajsi', NULL, '2026-04-13 18:47:01', NULL, 0, 882),
(884, 57, 28, 'neviem si zmeniť meno', NULL, '2026-04-13 18:47:35', NULL, 0, NULL),
(885, 28, 57, 'daj refresh', NULL, '2026-04-13 18:47:41', NULL, 0, NULL),
(886, 57, 28, 'ahaaaaaaaaaaaa', NULL, '2026-04-13 18:47:47', NULL, 0, NULL),
(887, 57, 28, 'SMART', NULL, '2026-04-13 18:47:53', NULL, 0, NULL),
(888, 28, 57, 'to este upravim', NULL, '2026-04-13 18:47:57', NULL, 0, NULL),
(889, 28, 57, 'ide ti zvuk?7', NULL, '2026-04-13 18:48:05', NULL, 0, NULL),
(890, 28, 57, 'ked pride sprava', NULL, '2026-04-13 18:48:08', NULL, 0, NULL),
(891, 57, 28, 'počkaj', NULL, '2026-04-13 18:48:10', NULL, 0, NULL),
(892, 57, 28, 'no', NULL, '2026-04-13 18:48:15', NULL, 0, NULL),
(893, 28, 57, 'halo', NULL, '2026-04-13 18:48:16', NULL, 0, NULL),
(894, 57, 28, 'napis', NULL, '2026-04-13 18:48:16', NULL, 0, NULL),
(895, 28, 57, 'cau', NULL, '2026-04-13 18:48:18', NULL, 0, NULL),
(896, 57, 28, 'niečo', NULL, '2026-04-13 18:48:18', NULL, 0, NULL),
(897, 28, 57, 'dad', NULL, '2026-04-13 18:48:20', NULL, 0, NULL),
(898, 28, 57, 'cau', NULL, '2026-04-13 18:48:27', NULL, 0, NULL),
(899, 57, 28, 'nn', NULL, '2026-04-13 18:48:27', NULL, 0, NULL),
(900, 28, 57, 'vasko', NULL, '2026-04-13 18:48:29', NULL, 0, NULL),
(901, 28, 57, 'mas zapnuty?', NULL, '2026-04-13 18:48:32', NULL, 0, NULL),
(902, 57, 28, 'mam', NULL, '2026-04-13 18:48:35', NULL, 0, NULL),
(903, 57, 28, 'skus ešte', NULL, '2026-04-13 18:48:48', NULL, 0, NULL),
(905, 28, 57, 'hauu', NULL, '2026-04-13 18:49:19', NULL, 0, NULL),
(906, 28, 57, 'hali', NULL, '2026-04-13 18:49:24', NULL, 0, NULL),
(907, 28, 57, 'hshsb', NULL, '2026-04-13 18:49:27', NULL, 0, NULL),
(908, 28, 57, 'ndndnjs', NULL, '2026-04-13 18:49:33', NULL, 0, NULL),
(910, 28, 57, 'ndndnd', NULL, '2026-04-13 18:49:37', NULL, 0, NULL),
(916, 1, 58, 'cau paul', NULL, '2026-04-13 20:10:48', NULL, 0, NULL),
(917, 1, 58, '', '/uploads/images/chat_1776111057121_8978.png', '2026-04-13 20:10:57', NULL, 0, NULL),
(918, 58, 1, '', '/uploads/images/chat_1776111070261_3587.png', '2026-04-13 20:11:10', NULL, 0, NULL),
(919, 58, 1, 'edasd', NULL, '2026-04-13 20:11:15', NULL, 0, NULL);

--
-- Kľúče pre exportované tabuľky
--

--
-- Indexy pre tabuľku `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `fk_reply_to_message` (`reply_to_id`);

--
-- AUTO_INCREMENT pre exportované tabuľky
--

--
-- AUTO_INCREMENT pre tabuľku `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=920;

--
-- Obmedzenie pre exportované tabuľky
--

--
-- Obmedzenie pre tabuľku `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `chat_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `chat_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reply_to_message` FOREIGN KEY (`reply_to_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
