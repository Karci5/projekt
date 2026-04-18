-- Add avatar column to groups table
ALTER TABLE `groups`
ADD COLUMN `avatar` TEXT DEFAULT NULL AFTER `description`;
