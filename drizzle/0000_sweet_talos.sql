CREATE TABLE `app_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_users_username_unique` ON `app_users` (`username`);--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attendance_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`sgk_number` text,
	`sgk_system_password` text,
	`sgk_workplace_password` text,
	`sgk_user_code` text,
	`sgk_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_name_unique` ON `departments` (`name`);--> statement-breakpoint
CREATE TABLE `document_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_categories_name_unique` ON `document_categories` (`name`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer,
	`branch_id` integer,
	`company_name` text,
	`title` text NOT NULL,
	`type` text,
	`category` text DEFAULT 'other',
	`file_path` text NOT NULL,
	`file_name` text,
	`file_size` integer,
	`related_to` text DEFAULT 'company',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`branch_id` integer,
	`sgk_branch_id` integer,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`tc_number` text,
	`birth_date` text,
	`gender` text DEFAULT 'male',
	`start_date` text,
	`occupation_code` text,
	`position` text,
	`department` text,
	`salary` real,
	`gross_salary` real,
	`iban` text,
	`leave_carryover` integer DEFAULT 0,
	`bes_status` text DEFAULT 'voluntary',
	`termination_date` text,
	`termination_reason` text,
	`sgk_exit_code` text,
	`status` text DEFAULT 'active',
	`avatar_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sgk_branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_tc_number_unique` ON `employees` (`tc_number`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'TRY',
	`date` text NOT NULL,
	`category` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `garnishment_installments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`garnishment_id` integer NOT NULL,
	`payment_date` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'pending',
	`paid_at` text,
	`description` text,
	FOREIGN KEY (`garnishment_id`) REFERENCES `garnishments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `garnishments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`file_number` text NOT NULL,
	`office_name` text NOT NULL,
	`total_amount` real NOT NULL,
	`deduction_amount` real,
	`remaining_amount` real NOT NULL,
	`iban` text,
	`priority_order` integer NOT NULL,
	`status` text DEFAULT 'active',
	`notification_date` text,
	`creditor` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `isg_document_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`renewal_period_months` integer DEFAULT 0,
	`is_mandatory` integer DEFAULT false,
	`validity_months` integer DEFAULT 12,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `isg_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`document_type` integer NOT NULL,
	`document_date` text,
	`expiry_date` text,
	`file_path` text,
	`file_type` text,
	`notification_status` text DEFAULT 'pending',
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_type`) REFERENCES `isg_document_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leaves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`days_count` integer NOT NULL,
	`return_date` text,
	`description` text,
	`status` text DEFAULT 'approved',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
