CREATE DATABASE IF NOT EXISTS financeDb;

USE financeDb;

CREATE TABLE
    IF NOT EXISTS `users` (
        `id` bigint NOT NULL AUTO_INCREMENT,
        `email` varchar(255) NOT NULL,
        `password` varchar(255) NOT NULL,
        `created_at` datetime (6) NOT NULL,
        `last_login` datetime (6) DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `UK_users_email` (`email`)
    );

CREATE TABLE
    IF NOT EXISTS `accounts` (
        `id` bigint NOT NULL AUTO_INCREMENT,
        `user_id` bigint NOT NULL,
        `first_name` varchar(255) NOT NULL,
        `last_name` varchar(255) NOT NULL,
        `cash_balance` decimal(10, 2) NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `UK_accounts_user_id` (`user_id`)
    );

CREATE TABLE
    IF NOT EXISTS `holdings` (
        `id` bigint NOT NULL AUTO_INCREMENT,
        `user_id` bigint NOT NULL,
        `stock_symbol` varchar(255) NOT NULL,
        `quantity` decimal(10, 4) NOT NULL,
        `avg_buy_price` decimal(10, 2) NOT NULL,
        `purchased_at` datetime (6) DEFAULT NULL,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `transactions` (
        `id` bigint NOT NULL AUTO_INCREMENT,
        `user_id` bigint NOT NULL,
        `stock_symbol` varchar(255) NOT NULL,
        `price` decimal(10, 2) NOT NULL,
        `quantity` decimal(10, 4) NOT NULL,
        `total_amount` decimal(10, 2) DEFAULT NULL,
        `type` enum ('BUY', 'SELL') NOT NULL,
        `created_at` datetime (6) DEFAULT NULL,
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    IF NOT EXISTS `watchlist` (
        `id` bigint NOT NULL AUTO_INCREMENT,
        `user_id` bigint NOT NULL,
        `stock_symbol` varchar(255) NOT NULL,
        `added_at` datetime (6) DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `UK_watchlist_user_symbol` (`user_id`, `stock_symbol`)
    );

CREATE TABLE
    IF NOT EXISTS `stock_cache` (
        `symbol` varchar(255) NOT NULL,
        `company_name` varchar(255) DEFAULT NULL,
        `current_price` decimal(10, 2) DEFAULT NULL,
        `open_price` decimal(10, 2) DEFAULT NULL,
        `high_price` decimal(10, 2) DEFAULT NULL,
        `low_price` decimal(10, 2) DEFAULT NULL,
        `volume` bigint DEFAULT NULL,
        `updated_at` datetime (6) DEFAULT NULL,
        PRIMARY KEY (`symbol`)
    );

CREATE TABLE
    IF NOT EXISTS `stock_history_cache` (
        `id` bigint NOT NULL AUTO_INCREMENT,
        `symbol` varchar(255) NOT NULL,
        `time_interval` varchar(255) NOT NULL,
        `history_json` longtext,
        `cached_at` datetime (6) DEFAULT NULL,
        `expires_at` datetime (6) DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `UK_history_symbol_interval` (`symbol`, `time_interval`)
    );