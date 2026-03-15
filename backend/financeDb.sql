CREATE DATABASE IF NOT EXISTS financeDb;

USE financeDb;

CREATE TABLE
    IF NOT EXISTS users (
        id BIGINT NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        PASSWORD VARCHAR(255) NOT NULL,
        created_at DATE,
        last_login DATE,
        PRIMARY KEY (id)
    )