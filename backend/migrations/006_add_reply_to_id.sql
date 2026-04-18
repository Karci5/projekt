-- Migration 006: Add reply_to_id column to messages table
ALTER TABLE chat_messages
ADD COLUMN reply_to_id INT DEFAULT NULL,
ADD CONSTRAINT fk_reply_to_message FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

ALTER TABLE group_messages
ADD COLUMN reply_to_id INT DEFAULT NULL,
ADD CONSTRAINT fk_group_reply_to_message FOREIGN KEY (reply_to_id) REFERENCES group_messages(id) ON DELETE SET NULL;
