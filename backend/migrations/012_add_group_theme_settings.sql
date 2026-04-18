ALTER TABLE `groups`
ADD COLUMN `theme_id` VARCHAR(50) NOT NULL DEFAULT 'default',
ADD COLUMN `theme_permission` VARCHAR(20) NOT NULL DEFAULT 'admin_only';