-- Add profile_picture column to chat_users table
ALTER TABLE chat_users 
ADD COLUMN profile_picture TEXT DEFAULT NULL AFTER password;
