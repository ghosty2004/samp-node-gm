-- phpMyAdmin SQL Dump
-- version 4.9.5deb2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 08, 2021 at 02:03 PM
-- Server version: 8.0.26-0ubuntu0.20.04.2
-- PHP Version: 7.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rpg.e-force.ro`
--

-- --------------------------------------------------------

--
-- Table structure for table `actors`
--

CREATE TABLE `actors` (
  `id` int NOT NULL,
  `skin_id` int NOT NULL DEFAULT '0',
  `pos_x` float NOT NULL DEFAULT '0',
  `pos_y` float NOT NULL DEFAULT '0',
  `pos_z` float NOT NULL DEFAULT '0',
  `pos_a` float NOT NULL DEFAULT '0',
  `animlib` varchar(50) NOT NULL,
  `animname` varchar(50) NOT NULL,
  `text` varchar(100) NOT NULL,
  `world` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank`
--

CREATE TABLE `bank` (
  `id` int NOT NULL,
  `userid` int NOT NULL DEFAULT '0',
  `created` varchar(30) NOT NULL,
  `value_money` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `djmp3`
--

CREATE TABLE `djmp3` (
  `id` int NOT NULL,
  `musicname` varchar(50) NOT NULL,
  `musiclink` varchar(100) NOT NULL,
  `musicdate` varchar(24) NOT NULL,
  `musicby` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dj_details`
--

CREATE TABLE `dj_details` (
  `id` int NOT NULL,
  `dj_name` varchar(50) NOT NULL,
  `current_song` varchar(100) NOT NULL,
  `next_sound` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `factions`
--

CREATE TABLE `factions` (
  `id` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `spawn_x` float NOT NULL DEFAULT '0',
  `spawn_y` float NOT NULL DEFAULT '0',
  `spawn_z` float NOT NULL DEFAULT '0',
  `enter_pos_x` float NOT NULL DEFAULT '0',
  `enter_pos_y` float NOT NULL DEFAULT '0',
  `enter_pos_z` float NOT NULL DEFAULT '0',
  `exit_pos_x` float NOT NULL DEFAULT '0',
  `exit_pos_y` float NOT NULL DEFAULT '0',
  `exit_pos_z` float NOT NULL DEFAULT '0',
  `interior_id` int NOT NULL DEFAULT '0',
  `skin_id` int NOT NULL DEFAULT '0',
  `rank_1` varchar(20) NOT NULL,
  `rank_2` varchar(20) NOT NULL,
  `rank_3` varchar(20) NOT NULL,
  `rank_4` varchar(20) NOT NULL,
  `rank_5` varchar(20) NOT NULL,
  `rank_6` varchar(20) NOT NULL,
  `rank_7` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gps`
--

CREATE TABLE `gps` (
  `id` int NOT NULL,
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `category` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `position` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `gps`
--

INSERT INTO `gps` (`id`, `name`, `category`, `position`) VALUES
(6, 'LV Police HQ', 'Main', '{\"x\":\"2297\",\"y\":\"2426\",\"z\":\"11\"}'),
(7, 'LS Police HQ', 'Main', '{\"x\":\"1536\",\"y\":\"-1637\",\"z\":\"14\"}'),
(8, 'SF Police HQ', 'Main', '{\"x\":\"-1620\",\"y\":\"680\",\"z\":\"7\"}'),
(11, 'Corabia din LV', 'Misc', '{\"x\":\"2002\",\"y\":\"1544\",\"z\":\"14\"}'),
(12, 'Dragons Casino', 'Misc', '{\"x\":\"2025\",\"y\":\"1007\",\"z\":\"11\"}');

-- --------------------------------------------------------

--
-- Table structure for table `houses`
--

CREATE TABLE `houses` (
  `id` int NOT NULL,
  `acc_id` int NOT NULL DEFAULT '0',
  `password` varchar(50) NOT NULL DEFAULT '',
  `price` int NOT NULL DEFAULT '0',
  `winperpayday` int NOT NULL DEFAULT '0',
  `interior_id` int NOT NULL DEFAULT '0',
  `exterior_x` float NOT NULL DEFAULT '0',
  `exterior_y` float NOT NULL DEFAULT '0',
  `exterior_z` float NOT NULL DEFAULT '0',
  `interior_x` float NOT NULL DEFAULT '0',
  `interior_y` float NOT NULL DEFAULT '0',
  `interior_z` float NOT NULL DEFAULT '0',
  `custom` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_vehicles`
--

CREATE TABLE `personal_vehicles` (
  `id` int NOT NULL,
  `acc_id` int NOT NULL DEFAULT '-1',
  `veh_model` int NOT NULL DEFAULT '0',
  `pos_x` float NOT NULL DEFAULT '0',
  `pos_y` float NOT NULL DEFAULT '0',
  `pos_z` float NOT NULL DEFAULT '0',
  `pos_a` float DEFAULT '0',
  `color_1` int NOT NULL DEFAULT '0',
  `color_2` int NOT NULL DEFAULT '0',
  `premium` int NOT NULL DEFAULT '0',
  `text1_slot` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `personal_vehicles`
--

INSERT INTO `personal_vehicles` (`id`, `acc_id`, `veh_model`, `pos_x`, `pos_y`, `pos_z`, `pos_a`, `color_1`, `color_2`, `premium`, `text1_slot`) VALUES
(8, 1, 411, -266.866, -248.613, 1.12618, 4.68466, 0, 0, 1, '0'),
(9, 7, 411, -300.152, -48.1367, 1.08584, 178.586, 0, 0, 0, '0'),
(10, 6, 411, 2094.67, 1435.52, 10.8203, 107.479, 245, 245, 0, '0');

-- --------------------------------------------------------

--
-- Table structure for table `serverconfig`
--

CREATE TABLE `serverconfig` (
  `hostname` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `modename` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `serverconfig`
--

INSERT INTO `serverconfig` (`hostname`, `modename`, `password`) VALUES
('e-Force Romania | Under development', 'e-Force v1.1', 'revenim123');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int NOT NULL,
  `status` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `status`) VALUES
(1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `spawnzones`
--

CREATE TABLE `spawnzones` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `position` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `spawnzones`
--

INSERT INTO `spawnzones` (`id`, `name`, `position`) VALUES
(6, 'Los Santos', '{\"x\":\"1481\",\"y\":\"-1751\",\"z\":\"15\"}'),
(7, 'San Fierro', '{\"x\":\"-1987\",\"y\":\"138\",\"z\":\"28\"}'),
(8, 'Las Venturas', '{\"x\":\"2193\",\"y\":\"1679\",\"z\":\"12\"}');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `password` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `registerdate` varchar(50) NOT NULL,
  `laston` varchar(24) NOT NULL DEFAULT '0',
  `gender` int NOT NULL DEFAULT '0',
  `hours` int NOT NULL DEFAULT '0',
  `mins` int NOT NULL DEFAULT '0',
  `secs` int NOT NULL DEFAULT '0',
  `admin` int NOT NULL DEFAULT '0',
  `helper` int NOT NULL DEFAULT '0',
  `faction` int NOT NULL DEFAULT '0',
  `faction_rank` int NOT NULL DEFAULT '0',
  `eforcep` int NOT NULL DEFAULT '0',
  `dj` int NOT NULL DEFAULT '0',
  `bonusgot` int NOT NULL DEFAULT '0',
  `money` int NOT NULL DEFAULT '0',
  `vip` int NOT NULL DEFAULT '0',
  `drive_license` int NOT NULL DEFAULT '0',
  `buletin_have` int NOT NULL DEFAULT '0',
  `cnp` int NOT NULL DEFAULT '0',
  `bankaccounthave` int NOT NULL DEFAULT '0',
  `registertutorial` int NOT NULL DEFAULT '0',
  `muted` int NOT NULL DEFAULT '0',
  `mute_remain` int NOT NULL DEFAULT '0',
  `personal_id` int NOT NULL DEFAULT '-1',
  `birthdetails` varchar(50) NOT NULL DEFAULT '0',
  `ip` varchar(30) NOT NULL DEFAULT '0',
  `status` int NOT NULL DEFAULT '0',
  `egame_minigame_finished` int NOT NULL DEFAULT '0',
  `egame_minigame_timer` int NOT NULL DEFAULT '0',
  `discord_attached` varchar(20) NOT NULL DEFAULT '0',
  `lastposition` varchar(50) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for table `actors`
--
ALTER TABLE `actors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bank`
--
ALTER TABLE `bank`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `djmp3`
--
ALTER TABLE `djmp3`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dj_details`
--
ALTER TABLE `dj_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `factions`
--
ALTER TABLE `factions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gps`
--
ALTER TABLE `gps`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `houses`
--
ALTER TABLE `houses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `personal_vehicles`
--
ALTER TABLE `personal_vehicles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `spawnzones`
--
ALTER TABLE `spawnzones`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `actors`
--
ALTER TABLE `actors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank`
--
ALTER TABLE `bank`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dj_details`
--
ALTER TABLE `dj_details`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `factions`
--
ALTER TABLE `factions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gps`
--
ALTER TABLE `gps`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `houses`
--
ALTER TABLE `houses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_vehicles`
--
ALTER TABLE `personal_vehicles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `spawnzones`
--
ALTER TABLE `spawnzones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
