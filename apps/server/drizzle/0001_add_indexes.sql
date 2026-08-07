CREATE INDEX `idx_installs_skill` ON `skill_installs` (`skill_id`,`target_app_id`);--> statement-breakpoint
CREATE INDEX `idx_skill_versions_skill_id` ON `skill_versions` (`skill_id`);--> statement-breakpoint
CREATE INDEX `idx_skill_versions_is_latest` ON `skill_versions` (`skill_id`,`is_latest`);