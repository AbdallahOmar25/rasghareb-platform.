CREATE DATABASE IF NOT EXISTS `rasghareb_platform` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `rasghareb_platform`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer','seller','professional','business','business_owner','secondary_admin','primary_admin','admin') NOT NULL DEFAULT 'customer',
  `phone` VARCHAR(50) DEFAULT '',
  `whatsapp` VARCHAR(50) DEFAULT '',
  `status` VARCHAR(30) NOT NULL DEFAULT 'active',
  `permissions` JSON NULL,
  `createdAt` VARCHAR(40) NOT NULL,
  `updatedAt` VARCHAR(40) NULL,
  `lastLogin` VARCHAR(40) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL,
  `name_ar` VARCHAR(255) NOT NULL,
  `name_en` VARCHAR(255) NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_categories_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL,
  `sellerId` VARCHAR(36) NOT NULL,
  `storeId` VARCHAR(36) NULL,
  `title_ar` VARCHAR(255) NOT NULL DEFAULT '',
  `title_en` VARCHAR(255) NOT NULL DEFAULT '',
  `description` TEXT,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `categoryId` VARCHAR(36) DEFAULT '',
  `images` JSON NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `createdAt` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_seller` (`sellerId`),
  KEY `idx_products_store` (`storeId`),
  KEY `idx_products_category` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `professionals` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `profession_ar` VARCHAR(255) DEFAULT '',
  `profession_en` VARCHAR(255) DEFAULT '',
  `bio` TEXT,
  `phone` VARCHAR(50) DEFAULT '',
  `whatsapp` VARCHAR(50) DEFAULT '',
  `serviceArea` VARCHAR(255) DEFAULT '',
  `workingHours` VARCHAR(255) DEFAULT '',
  `services` JSON NULL,
  `photo` VARCHAR(500) DEFAULT '',
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `createdAt` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_professionals_status` (`status`),
  KEY `idx_professionals_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stores` (
  `id` VARCHAR(36) NOT NULL,
  `ownerId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `description` TEXT,
  `phone` VARCHAR(50) DEFAULT '',
  `whatsapp` VARCHAR(50) DEFAULT '',
  `logo` VARCHAR(500) DEFAULT '',
  `cover` VARCHAR(500) DEFAULT '',
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `createdAt` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stores_status` (`status`),
  KEY `idx_stores_owner` (`ownerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `businesses` (
  `id` VARCHAR(36) NOT NULL,
  `ownerId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `categoryId` VARCHAR(36) DEFAULT '',
  `description` TEXT,
  `address` VARCHAR(500) DEFAULT '',
  `phone` VARCHAR(50) DEFAULT '',
  `whatsapp` VARCHAR(50) DEFAULT '',
  `openingHours` VARCHAR(255) DEFAULT '',
  `socialLinks` TEXT,
  `photos` JSON NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
  `createdAt` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_businesses_status` (`status`),
  KEY `idx_businesses_owner` (`ownerId`),
  KEY `idx_businesses_category` (`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(36) NOT NULL,
  `targetType` VARCHAR(30) NOT NULL,
  `targetId` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `userName` VARCHAR(255) DEFAULT '',
  `rating` TINYINT NOT NULL DEFAULT 5,
  `comment` TEXT,
  `createdAt` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_target` (`targetType`, `targetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `targetType` VARCHAR(30) NOT NULL,
  `targetId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_favorite` (`userId`, `targetType`, `targetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(36) NOT NULL,
  `reporterId` VARCHAR(36) NULL,
  `targetType` VARCHAR(30) DEFAULT '',
  `targetId` VARCHAR(36) DEFAULT '',
  `reason` TEXT,
  `status` VARCHAR(30) DEFAULT 'pending',
  `createdAt` VARCHAR(40) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `settingKey` VARCHAR(100) NOT NULL,
  `settingValue` TEXT NULL,
  PRIMARY KEY (`settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
