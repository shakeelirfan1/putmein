-- PutmeIn Autonomous DevOps & Infrastructure Engine
-- Database Initialization Schema (Idempotent: Never drops or modifies existing data)
CREATE TABLE IF NOT EXISTS `Post` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `excerpt` TEXT NULL,
  `coverImage` VARCHAR(191) NULL,
  `metaTitle` VARCHAR(191) NULL,
  `metaDescription` TEXT NULL,
  `metaKeywords` TEXT NULL,
  `isPublished` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Post_slug_key`(`slug`),
  INDEX `Post_slug_idx`(`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `waitlists` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `reason` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_chat_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'New Chat',
  `model` VARCHAR(191) NOT NULL DEFAULT 'MiniMax-M3',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_chat_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_chat_messages` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_chat_messages_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ray_chat_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_monitor_projects` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `projectPath` TEXT NOT NULL,
  `logPaths` TEXT NOT NULL,
  `logCommand` TEXT NULL,
  `runCommand` TEXT NULL,
  `intervalSec` INT NOT NULL DEFAULT 30,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `status` VARCHAR(191) NOT NULL DEFAULT 'discovering',
  `memory` LONGTEXT NULL,
  `memoryStatus` VARCHAR(191) NULL,
  `projectUrl` TEXT NULL,
  `managedPid` INT NULL,
  `managedLogFile` TEXT NULL,
  `lastChecked` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_monitor_projects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_monitor_alerts` (
  `id` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NOT NULL,
  `severity` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `rawLog` LONGTEXT NOT NULL,
  `dismissed` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_monitor_alerts_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ray_monitor_projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_deployments` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `sourceType` VARCHAR(191) NOT NULL,
  `repoUrl` TEXT NULL,
  `branch` VARCHAR(191) NULL DEFAULT 'main',
  `commitHash` VARCHAR(191) NULL,
  `commitMessage` TEXT NULL,
  `projectPath` TEXT NOT NULL,
  `dockerfile` LONGTEXT NULL,
  `containerId` VARCHAR(191) NULL,
  `containerName` VARCHAR(191) NULL,
  `imageName` VARCHAR(191) NULL,
  `hostPort` INT NULL,
  `containerPort` INT NULL DEFAULT 3000,
  `envVars` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `buildLogs` LONGTEXT NULL,
  `deployUrl` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_deployments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_github_integrations` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `githubUsername` VARCHAR(191) NULL,
  `accessToken` TEXT NULL,
  `avatarUrl` TEXT NULL,
  `webhookSecret` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_github_integrations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_pipelines` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `repoUrl` TEXT NOT NULL,
  `branch` VARCHAR(191) NOT NULL DEFAULT 'main',
  `autoDeploy` BOOLEAN NOT NULL DEFAULT true,
  `dockerfilePath` VARCHAR(191) NULL DEFAULT 'Dockerfile',
  `port` INT NOT NULL DEFAULT 3000,
  `status` VARCHAR(191) NOT NULL DEFAULT 'idle',
  `lastRunAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_pipelines_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ray_pipeline_runs` (
  `id` VARCHAR(191) NOT NULL,
  `pipelineId` VARCHAR(191) NOT NULL,
  `commitHash` VARCHAR(191) NULL,
  `commitMessage` TEXT NULL,
  `author` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'running',
  `stages` LONGTEXT NULL,
  `logs` LONGTEXT NULL,
  `durationMs` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ray_pipeline_runs_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `ray_pipelines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
