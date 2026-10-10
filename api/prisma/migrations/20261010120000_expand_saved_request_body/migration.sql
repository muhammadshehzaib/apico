-- Match SavedRequest.body in schema.prisma so imported request bodies can exceed 191 characters.
ALTER TABLE `SavedRequest` MODIFY `body` TEXT NULL;
