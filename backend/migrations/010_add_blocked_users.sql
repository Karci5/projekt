-- Creating blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blocker_id INT NOT NULL,
  blocked_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_block (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES chat_users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES chat_users(id) ON DELETE CASCADE,
  INDEX idx_blocker (blocker_id),
  INDEX idx_blocked (blocked_id)
);
