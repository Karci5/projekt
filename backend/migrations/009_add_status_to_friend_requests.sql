-- Migration: Add status column to friend_requests table
ALTER TABLE friend_requests ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
-- Optionally, update existing rows to 'pending' if needed
UPDATE friend_requests SET status = 'pending' WHERE status IS NULL;
