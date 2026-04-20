-- Add show_online column to chat_users table for privacy setting
ALTER TABLE chat_users ADD COLUMN show_online TINYINT(1) NOT NULL DEFAULT 1 AFTER is_online;