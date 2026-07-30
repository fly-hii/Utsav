-- ============================================================
-- UTSAV - AWS RDS MySQL 8 Database Schema (Clean Setup)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS reel_views;
DROP TABLE IF EXISTS reel_shares;
DROP TABLE IF EXISTS reel_comments;
DROP TABLE IF EXISTS reel_likes;
DROP TABLE IF EXISTS reels;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS committee_members;
DROP TABLE IF EXISTS committee_documents;
DROP TABLE IF EXISTS committees;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'COMMITTEE_ADMIN', 'COMMITTEE_MEMBER', 'USER') DEFAULT 'USER',
  push_token VARCHAR(255) NULL,
  avatar VARCHAR(255),
  avatarUrl TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  latitude DOUBLE,
  longitude DOUBLE,
  address TEXT,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_users_phone (phone),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Committees Table
CREATE TABLE committees (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  templeName VARCHAR(200) NOT NULL,
  festivalName VARCHAR(200) NOT NULL,
  village VARCHAR(100) NOT NULL,
  mandal VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  presidentName VARCHAR(100) NOT NULL,
  secretaryName VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  description TEXT,
  logo VARCHAR(255),
  logoUrl TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INFO_REQUESTED') DEFAULT 'PENDING',
  rejectionReason TEXT,
  infoRequestMessage TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  approvedAt DATETIME(3),
  approvedBy VARCHAR(36),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_committees_status (status),
  INDEX idx_committees_village (village),
  INDEX idx_committees_district (district),
  INDEX idx_committees_lat_lng (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Committee Documents Table
CREATE TABLE committee_documents (
  id VARCHAR(36) PRIMARY KEY,
  committeeId VARCHAR(36) NOT NULL,
  type ENUM('REGISTRATION_CERT', 'IDENTITY_PROOF', 'TEMPLE_IMAGE', 'COMMITTEE_LOGO') NOT NULL,
  s3Key VARCHAR(255) NOT NULL,
  s3Url TEXT NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileSize INT,
  mimeType VARCHAR(100),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (committeeId) REFERENCES committees(id) ON DELETE CASCADE,
  INDEX idx_docs_committee (committeeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Committee Members Table
CREATE TABLE committee_members (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  committeeId VARCHAR(36) NOT NULL,
  role ENUM('ADMIN', 'MEMBER') DEFAULT 'MEMBER',
  isActive BOOLEAN DEFAULT TRUE,
  joinedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_user_committee (userId, committeeId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (committeeId) REFERENCES committees(id) ON DELETE CASCADE,
  INDEX idx_members_committee (committeeId),
  INDEX idx_members_user (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Events Table
CREATE TABLE events (
  id VARCHAR(36) PRIMARY KEY,
  committeeId VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  festival VARCHAR(100),
  description TEXT,
  banner VARCHAR(255),
  bannerUrl TEXT,
  venue VARCHAR(200),
  date DATETIME(3) NOT NULL,
  endDate DATETIME(3),
  time VARCHAR(50),
  guest VARCHAR(100),
  budget DOUBLE,
  organizer VARCHAR(100),
  status ENUM('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED') DEFAULT 'UPCOMING',
  isPublic BOOLEAN DEFAULT TRUE,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (committeeId) REFERENCES committees(id) ON DELETE CASCADE,
  INDEX idx_events_committee (committeeId),
  INDEX idx_events_date (date),
  INDEX idx_events_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Donations Table
CREATE TABLE donations (
  id VARCHAR(36) PRIMARY KEY,
  committeeId VARCHAR(36) NOT NULL,
  eventId VARCHAR(36),
  donorId VARCHAR(36),
  addedById VARCHAR(36) NOT NULL,
  donorName VARCHAR(100) NOT NULL,
  donorPhone VARCHAR(20),
  donorAddress TEXT,
  amount DOUBLE NOT NULL,
  purpose VARCHAR(150),
  paymentMethod ENUM('CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE', 'OTHER') DEFAULT 'CASH',
  remarks TEXT,
  receiptNo VARCHAR(50) UNIQUE,
  date DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (committeeId) REFERENCES committees(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (donorId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (addedById) REFERENCES users(id),
  INDEX idx_donations_committee (committeeId),
  INDEX idx_donations_event (eventId),
  INDEX idx_donations_donor (donorId),
  INDEX idx_donations_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Expenses Table
CREATE TABLE expenses (
  id VARCHAR(36) PRIMARY KEY,
  committeeId VARCHAR(36) NOT NULL,
  addedById VARCHAR(36) NOT NULL,
  category ENUM('DECORATION', 'FOOD', 'TRANSPORT', 'SOUND', 'LIGHTING', 'PRIEST', 'FLOWERS', 'PRINTING', 'RENTAL', 'DONATION_EXPENSE', 'CONSTRUCTION', 'MAINTENANCE', 'OTHER') NOT NULL,
  vendor VARCHAR(150),
  amount DOUBLE NOT NULL,
  billS3Key VARCHAR(255),
  billS3Url TEXT,
  description TEXT,
  date DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (committeeId) REFERENCES committees(id) ON DELETE CASCADE,
  FOREIGN KEY (addedById) REFERENCES users(id),
  INDEX idx_expenses_committee (committeeId),
  INDEX idx_expenses_category (category),
  INDEX idx_expenses_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reels Table
CREATE TABLE reels (
  id VARCHAR(36) PRIMARY KEY,
  committeeId VARCHAR(36) NOT NULL,
  eventId VARCHAR(36),
  uploadedById VARCHAR(36) NOT NULL,
  videoS3Key VARCHAR(255) NOT NULL,
  videoS3Url TEXT NOT NULL,
  thumbnailS3Key VARCHAR(255),
  thumbnailS3Url TEXT,
  previewS3Key VARCHAR(255),
  previewS3Url TEXT,
  caption TEXT,
  location VARCHAR(150),
  hashtags TEXT,
  status ENUM('PROCESSING', 'PUBLISHED', 'REJECTED') DEFAULT 'PROCESSING',
  viewCount INT DEFAULT 0,
  likeCount INT DEFAULT 0,
  commentCount INT DEFAULT 0,
  shareCount INT DEFAULT 0,
  duration INT,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (committeeId) REFERENCES committees(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (uploadedById) REFERENCES users(id),
  INDEX idx_reels_committee (committeeId),
  INDEX idx_reels_status (status),
  INDEX idx_reels_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Reel Likes Table
CREATE TABLE reel_likes (
  id VARCHAR(36) PRIMARY KEY,
  reelId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_reel_user_like (reelId, userId),
  FOREIGN KEY (reelId) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reel_likes_reel (reelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Reel Comments Table
CREATE TABLE reel_comments (
  id VARCHAR(36) PRIMARY KEY,
  reelId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (reelId) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reel_comments_reel (reelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Reel Shares Table
CREATE TABLE reel_shares (
  id VARCHAR(36) PRIMARY KEY,
  reelId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  platform VARCHAR(50),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (reelId) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reel_shares_reel (reelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Reel Views Table
CREATE TABLE reel_views (
  id VARCHAR(36) PRIMARY KEY,
  reelId VARCHAR(36) NOT NULL,
  userId VARCHAR(36),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (reelId) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reel_views_reel (reelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Gallery Table
CREATE TABLE gallery (
  id VARCHAR(36) PRIMARY KEY,
  committeeId VARCHAR(36) NOT NULL,
  eventId VARCHAR(36),
  uploadedById VARCHAR(36) NOT NULL,
  imageS3Key VARCHAR(255) NOT NULL,
  imageS3Url TEXT NOT NULL,
  caption VARCHAR(255),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (committeeId) REFERENCES committees(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (uploadedById) REFERENCES users(id),
  INDEX idx_gallery_committee (committeeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Notifications Table
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  type ENUM('DONATION_RECEIVED', 'EXPENSE_ADDED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'EVENT_CREATED', 'EVENT_REMINDER', 'EVENT_UPDATED', 'REEL_COMMENT', 'REEL_LIKE', 'REEL_PUBLISHED', 'COMMITTEE_APPROVED', 'COMMITTEE_REJECTED', 'COMMITTEE_SUSPENDED', 'COMMITTEE_INFO_REQUESTED', 'ANNOUNCEMENT', 'PASSWORD_RESET') NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSON,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (userId),
  INDEX idx_notifications_isRead (isRead)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Refresh Tokens Table
CREATE TABLE refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tokens_user (userId),
  INDEX idx_tokens_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
