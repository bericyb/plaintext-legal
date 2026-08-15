CREATE TABLE `reportEmailOptIns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('active','unsubscribed') NOT NULL DEFAULT 'active',
	`consentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportEmailOptIns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(24) NOT NULL,
	`scanId` int NOT NULL,
	`reportJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(24) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyDescription` text NOT NULL,
	`websiteUrl` varchar(2048),
	`source` enum('founder','domain','utah') NOT NULL DEFAULT 'founder',
	`status` enum('researching','complete','failed') NOT NULL DEFAULT 'researching',
	`profileJson` text NOT NULL,
	`researchPlanJson` text NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scans_id` PRIMARY KEY(`id`),
	CONSTRAINT `scans_publicId_unique` UNIQUE(`publicId`)
);
