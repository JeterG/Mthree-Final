# Mthree-Final

Final Capstone Project for Sakib and Jeter

### To launch `./startup.sh`

## Rubric

<!-- ![Rubric](Rubric.png) -->

## Full Stack Project Evaluation Rubric

**Technology Stack:** Angular + Spring Boot + MySQL
**Total Marks:** 25

---

### 1. Problem Understanding & Project Idea — 2 marks

- [ ] Clear explanation of the problem statement
- [ ] Relevance of the project
- [ ] Understanding of requirements

---

### 2. Angular Frontend Implementation — 5 marks

- [x] Components
- [x] Services
- [x] Routing
- [x] Forms
- [x] Data binding
- [x] UI design

---

### 3. Spring Boot Backend Implementation — 5 marks

- [x] Proper REST API design
- [x] Controllers
- [x] Service layer
- [x] Dependency injection
- [ ] Correct use of Spring Boot features

---

### 4. Database Design (MySQL) — 3 marks

- [x] Proper table structure
- [x] Relationships
- [x] Normalization
- [x] Correct database connectivity with Spring Boot

---

### 5. Integration (Frontend ↔ Backend) — 3 marks

- [x] Angular communicating with Spring Boot APIs using HTTP requests
- [ ] Handling responses correctly

---

### 6. Functionality — 5 marks

- [ ] Application correctly performs all operations
- [x] Proper validations

---

### 7. Code Quality & Project Structure — 1 mark

- [x] Clean code
- [ ] Proper folder structure
- [x] Naming conventions
- [x] Readability

---

### 8. Presentation & Explanation — 1 mark

- [x] Ability to explain project workflow and architecture
- [x] Able to answer questions confidently

---

**Total: 25 marks**

## Springboot Generation

![Springboot Generation](Springboot.png)

## Rest Api Documentation

- Similar to the autogernated documentation used with swagger fast api
- Accessed through the url `http://localhost:8080/docs`

# Database

- financeDb
  - Schemas
    - Users
      - id : BIGINT, auto generated, primary key, not null
      - email : VARCHAR(255), unique, not null
      - password : VARCHAR(255), not null
      - created_at : DATETIME, not null
      - last_login : DATETIME

    - Accounts
      - id : BIGINT, auto generated, primary key, not null
      - user_id : BIGINT, foreign key references users(id), unique, not null
      - first_name : VARCHAR(255), not null
      - last_name : VARCHAR(255), not null
      - cash_balance : DECIMAL(10,2), not null, default 10000.00

    - Holdings
      - id : BIGINT, auto generated, primary key, not null
      - user_id : BIGINT, foreign key references users(id), not null
      - stock_symbol : VARCHAR(255), not null
      - quantity : DECIMAL(10,4), not null
      - avg_buy_price : DECIMAL(10,2), not null
      - purchased_at : DATETIME

    - Transactions
      - id : BIGINT, auto generated, primary key, not null
      - user_id : BIGINT, foreign key references users(id), not null
      - stock_symbol : VARCHAR(255), not null
      - price : DECIMAL(10,2), not null
      - quantity : DECIMAL(10,4), not null
      - total_amount : DECIMAL(10,2), auto computed on insert
      - type : ENUM('BUY', 'SELL'), not null
      - created_at : DATETIME

    - Watchlist
      - id : BIGINT, auto generated, primary key, not null
      - user_id : BIGINT, foreign key references users(id), not null
      - stock_symbol : VARCHAR(255), not null
      - added_at : DATETIME
      - unique constraint on (user_id, stock_symbol)

    - Stock Cache
      - symbol : VARCHAR(255), primary key, not null
      - company_name : VARCHAR(255)
      - current_price : DECIMAL(10,2)
      - open_price : DECIMAL(10,2)
      - high_price : DECIMAL(10,2)
      - low_price : DECIMAL(10,2)
      - volume : BIGINT
      - updated_at : DATETIME

    - Stock History Cache
      - id : BIGINT, auto generated, primary key, not null
      - symbol : VARCHAR(255), not null
      - time_interval : VARCHAR(255), not null
      - history_json : LONGTEXT
      - cached_at : DATETIME
      - expires_at : DATETIME
      - unique constraint on (symbol, time_interval)
