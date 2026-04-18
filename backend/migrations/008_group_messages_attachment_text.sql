-- Zmena stĺpca attachment z JSON na TEXT v group_messages
ALTER TABLE `group_messages` MODIFY COLUMN `attachment` TEXT DEFAULT NULL;
