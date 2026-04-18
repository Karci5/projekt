-- Add email verification column to chat_users
ALTER TABLE chat_users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

-- Create email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  verification_code VARCHAR(6) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_verification_code ON email_verifications(verification_code);
CREATE INDEX idx_user_id ON email_verifications(user_id);
