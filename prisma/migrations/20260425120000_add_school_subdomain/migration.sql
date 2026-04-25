ALTER TABLE `School` ADD COLUMN `subdomain` VARCHAR(191) NULL;
ALTER TABLE `School` ADD COLUMN `subdomain_request` VARCHAR(191) NULL;
ALTER TABLE `School` ADD COLUMN `subdomain_status` VARCHAR(191) NOT NULL DEFAULT 'none';
CREATE UNIQUE INDEX `School_subdomain_key` ON `School`(`subdomain`);
