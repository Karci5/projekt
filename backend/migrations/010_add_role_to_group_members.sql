-- Add role column for group member permissions
ALTER TABLE `group_members`
ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'member' AFTER `user_id`;

-- Make group creator admin for existing groups
UPDATE `group_members` gm
INNER JOIN `groups` g ON g.id = gm.group_id
SET gm.role = 'admin'
WHERE gm.user_id = g.created_by;
