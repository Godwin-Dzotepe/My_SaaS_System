-- Change AppMessage.body from VARCHAR(191) to TEXT
ALTER TABLE `AppMessage`
  MODIFY `body` TEXT NOT NULL;

-- Change AppNotification.body from VARCHAR(191) to TEXT
ALTER TABLE `AppNotification`
  MODIFY `body` TEXT NOT NULL;
