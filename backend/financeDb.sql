CREATE DATABASE IF NOT EXISTS financeDb;

USE financeDb;

CREATE TABLE
    IF NOT EXISTS users (
        id BIGINT NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME,
        last_login DATETIME,
        PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS transactions (
        id BIGINT NOT NULL AUTO_INCREMENT,
        stock_symbol VARCHAR(10) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        type ENUM ('BUY', 'SELL') NOT NULL,
        user_id BIGINT NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

CREATE TABLE
    IF NOT EXISTS accounts (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL UNIQUE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        cash_balance DECIMAL(10, 2) NOT NULL DEFAULT 10000.00,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );