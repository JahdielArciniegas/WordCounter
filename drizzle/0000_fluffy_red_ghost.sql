CREATE TABLE `active_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`occurrences` integer DEFAULT 1 NOT NULL,
	`first_used_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`last_used_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `active_word_lang_idx` ON `active_words` (`word`,`language`);--> statement-breakpoint
CREATE TABLE `passive_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`added_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passive_word_lang_idx` ON `passive_words` (`word`,`language`);