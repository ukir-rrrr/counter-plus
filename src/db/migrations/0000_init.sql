CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `count_events` (
	`id` text PRIMARY KEY NOT NULL,
	`counter_id` text NOT NULL,
	`delta` integer NOT NULL,
	`count_after` integer NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`counter_id`) REFERENCES `counters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `count_events_counter_created_idx` ON `count_events` (`counter_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `count_events_created_idx` ON `count_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `counters` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "counters_count_non_negative" CHECK("counters"."count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `counters_category_sort_idx` ON `counters` (`category_id`,`sort_order`);