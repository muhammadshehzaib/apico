-- AlterTable
ALTER TABLE `SavedRequest`
  ADD COLUMN `preRequestScript` TEXT NULL,
  ADD COLUMN `postResponseScript` TEXT NULL;
