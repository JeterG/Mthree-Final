# StockQuik — Mthree Capstone

> A full-stack paper trading simulator built by **Sakib Khan** and **Jeter Gutierrez** as the final capstone project for the Mthree training program.

**StockQuik** lets you buy and sell real stocks with virtual money in real time — no financial risk, full market realism. Every new account starts with **$10,000** in virtual cash and has access to live prices from Finnhub, 1-year OHLC history from Yahoo Finance, and company profiles from FMP.

---

## Quick Start

```bash
./Dev.sh
```

The script handles everything: Docker build, MySQL healthcheck, Cloudflare tunnel for the backend, and ngrok for the frontend. Use `--reset-db` to wipe and re-seed the database on a fresh run.

```
Local frontend:  http://localhost:4200
Local backend:   http://localhost:8080
API docs:        http://localhost:8080/docs
```

To run without Docker (local development), ensure the `.env` files are in place and run the frontend and backend separately — see [Local Setup](#local-setup) below.

---

## Links

|               |                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Documentation | [jeterg.github.io/Mthree-Final](https://jeterg.github.io/Mthree-Final/)                                                |
| Wireframes    | [jeterg.github.io/Mthree-Final/wireframes.html](https://jeterg.github.io/Mthree-Final/wireframes.html)                 |
| Issues        | [GitHub Issues (closed)](https://github.com/JeterG/Mthree-Final/issues?q=is%3Aissue+state%3Aclosed+sort%3Acreated-asc) |
| Pull Requests | [GitHub Pull Requests (closed)](https://github.com/JeterG/Mthree-Final/pulls?q=is%3Apr+is%3Aclosed+sort%3Acreated-asc) |
| Linear Board  | [linear.app/mthree-final/team/MTH/all](https://linear.app/mthree-final/team/MTH/all)                                   |

---

## Tech Stack

| Layer      | Technology                                                                   |
| ---------- | ---------------------------------------------------------------------------- |
| Frontend   | Angular 21 · Bootstrap 5 · Chart.js · Standalone components                  |
| Backend    | Spring Boot 4.0.3 · JPA · BCrypt · Swagger                                   |
| Database   | MySQL 8 · `financeDb` · 7 tables                                             |
| Stock data | Finnhub (live quotes) · Yahoo Finance (1yr OHLC) · FMP (company profiles)    |
| DevOps     | Docker · Docker Compose · Cloudflare Tunnel · ngrok                          |
| Planning   | GitHub Issues (77 closed) · Linear (77 resolved) · Pull Requests (94 closed) |

---

## Spring Boot Generation

![Springboot Generation](Springboot.png)

---

## Architecture

```
Angular 21   HTTP REST/JSON   Spring Boot 4



                 MySQL                  Finnhub               Yahoo Finance
               financeDb   -----      live quotes     -----     1yr OHLC
                                     (sell price)            (history cache)
                                           |
                                        FMP API
                                    company profiles
```

The backend never calls external APIs on every user request. A `StockDataSeeder` pre-fetches all 131 symbols from Finnhub and Yahoo Finance and stores the results in MySQL. Every user request reads from cache. The one exception is sell orders — those call Finnhub live so the sell price is accurate to the second.

---

## Features

- **Paper trading** — buy and sell US stocks with $10,000 virtual cash
- **Live prices** — stock chart polls every 20 seconds via `setInterval`
- **Price / Volume chart** — toggle between price line and volume bars (Chart.js dual-axis)
- **Range filters** — 1D, 1W, 1M, 3M, 1Y
- **Portfolio analytics** — overall gain/loss vs $10k start, unrealized gain, max drawdown, W/L record, best/worst holding
- **Cart** — bulk buy multiple symbols in one checkout
- **Watchlist** — track symbols with live prices
- **Transaction history** — full BUY/SELL record with colour-coded badges
- **Portfolio chart** — cash balance trajectory from $10,000 over time
- **Projection** — forward projection using historical growth rates per symbol
- **Onboarding form** — multi-step survey on first login
- **Profile** — update name, choose emoji avatar
- **Settings** — dark mode, timezone, notification preferences, password reset
- **Responsive navbar** — hamburger menu at 1070px breakpoint
- **Toast notifications** — all feedback via a single `ToastService`, no inline error divs
- **Auth guard** — protects all routes, redirects to `/login` if no session

---

## Local Setup

To run locally without Docker, you need two `.env` files.

**Root `.env`** (used by `Dev.sh` and Docker Compose):

```env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=financeDb
FINNHUB_API_KEY=your_finnhub_key
FMP_API_KEY=your_fmp_key
```

**`backend/.env`** (used when running Spring Boot directly via `./mvnw` or your IDE):

```env
FINNHUB_API_KEY=your_finnhub_key
FMP_API_KEY=your_fmp_key
DB_URL=jdbc:mysql://localhost:3306/financeDb
DB_USERNAME=root
DB_PASSWORD=root
```

Then start each service separately:

```bash
# Terminal 1 — backend
cd backend
./mvnw spring-boot:run

# Terminal 2 — frontend
cd frontend
ng serve
```

Make sure MySQL is running locally on port `3306` with `financeDb` created. On Ubuntu:

```bash
sudo systemctl start mysql
```

> **Note:** `Dev.sh` handles all of this automatically in Docker. Local setup is only needed for development without containers.

---

## Project Structure

**Frontend** (`src/`)

```
src/
├── main.ts
├── styles.css
├── index.html
├── environments/
│   └── environment.ts                 # apiUrl — swapped by Dev.sh at build time
├── interceptors/
│   └── error.interceptor.ts
└── app/
    ├── app.ts / app.html / app.routes.ts / app.config.ts
    ├── auth-guard/
    │   └── auth.guard.ts              # redirects to /login if no session
    ├── login/
    │   ├── login.ts / login.html      # dark themed, toast-only feedback
    │   └── auth.interceptor.ts
    ├── signup/
    │   └── signup.ts / signup.html    # real-time email check on focusout
    ├── home/
    │   ├── home.ts / home.html        # market overview, top movers
    │   └── timezone.service.ts
    ├── portfolio/
    │   └── portfolio.ts / portfolio.html  # main dashboard — charts, tabs, analytics
    ├── stock-chart.component/
    │   └── stock-chart.component.ts   # Chart.js price/volume/projection, 20s polling
    ├── portfolio-chart-component/
    │   └── portfolio-chart-component.ts  # cash balance trajectory chart
    ├── buy-component/
    │   └── buy-component.ts           # symbol search, qty, buy, add to watchlist
    ├── cart-component/
    │   └── cart-component.ts          # bulk buy, checkout
    ├── cart/
    │   └── cart.service.ts            # CartService — localStorage cart state
    ├── stock-search-component/
    │   └── stock-search-component.ts  # live search dropdown from cached symbols
    ├── stock-page/
    │   └── stock-page.ts              # standalone stock detail page
    ├── search/
    │   └── search.ts / market-index.ts  # market index and search page
    ├── navbar/
    │   └── navbar.ts / navbar.html    # responsive, hamburger at 1070px
    ├── toast/
    │   ├── toast.service.ts           # BehaviorSubject pub/sub
    │   └── toast.component.ts         # top-right overlay, auto-dismiss
    ├── profile/
    │   └── profile.ts / profile.html  # name update, emoji picker, onboarding modal
    ├── settings/
    │   └── settings.ts / settings.html  # dark mode, timezone, notifications, password
    ├── swagger/
    │   └── swagger.ts / swagger.html  # embedded API docs
    ├── services/
    │   └── api.services.ts            # HttpClient wrapper — injects userId header
    └── assets/diagrams/
        └── diagrams.ts / diagrams.html  # SVG architecture diagrams page
```

**Backend** (`src/main/java/com/sakib_jeter/backend/`)

```
backend/
├── BackendApplication.java
├── config/
│   ├── SecurityConfig.java            # CORS for Cloudflare tunnel, permitAll dev mode
│   ├── JwtAuthenticationFilter.java   # JWT filter chain
│   └── SchedulerConfig.java
├── controller/
│   ├── AuthController.java            # POST /api/auth/login|signup|check-email
│   ├── AccountController.java         # GET/PUT /api/account/me
│   ├── HoldingController.java         # GET/POST /api/holdings/me|buy|sell
│   ├── TransactionController.java     # GET /api/transactions/me
│   ├── WatchlistController.java       # GET/POST/DELETE /api/watchlist
│   ├── MarketController.java          # GET /api/market/quote|history|cached|seed
│   └── UserController.java            # GET /api/users
├── service/
│   ├── SignupService.java             # BCrypt login/register, auto-creates account
│   ├── HoldingService.java            # @Transactional buy/sell, weighted avg price
│   ├── AccountService.java            # cash balance operations
│   ├── MarketService.java             # cache-first reads + getStockDetails (Finnhub+FMP)
│   ├── JwtService.java                # JWT token generation and validation
│   └── TransactionService.java
├── external/
│   ├── FinnhubService.java            # live quote on sell + getStockDetails
│   ├── YahooFinanceService.java       # 240min TTL OHLC history cache
│   └── StockDataSeeder.java           # seeds 131 symbols, 1100ms delay
├── entity/
│   ├── User.java                      # FKs as plain Long — no @ManyToOne
│   ├── Account.java
│   ├── Holding.java
│   ├── Transaction.java               # ENUM(BUY, SELL), total_amount @PrePersist
│   ├── Watchlist.java
│   ├── StockCache.java
│   └── StockHistoryCache.java
├── repository/                        # Spring Data JPA — findBy* naming convention
├── dto/
│   ├── Stock.java                     # OHLCV data transfer object
│   ├── SignupRequest.java
│   ├── UpdateNameRequest.java
│   └── ChangePasswordRequest.java
└── exception/
    ├── EmailAlreadyExistsException.java
    └── GlobalExceptionHandler.java    # @ControllerAdvice — plain text error responses
```

**Root**

```
Mthree-Final/
├── .env                               # Docker Compose + Dev.sh (API keys, DB config)
├── backend/.env                       # Local Spring Boot dev (overrides application.properties)
├── Dev.sh                             # One-command startup: Docker + Cloudflare + ngrok
├── docker-compose.yml
├── Springboot.png
└── docs/                              # GitHub Pages
    ├── index.html                     # Architecture, auth, transaction, ERD diagrams
    └── wireframes.html                # 7-screen wireframes
```

---

## REST API

Full interactive docs available at [`http://localhost:8080/docs`](http://localhost:8080/docs) when running locally.

| Method   | Path                           | Description                                 |
| -------- | ------------------------------ | ------------------------------------------- |
| `POST`   | `/api/auth/login`              | Login — returns userId + email              |
| `POST`   | `/api/auth/signup`             | Register — creates user + account ($10k)    |
| `GET`    | `/api/auth/check-email`        | Real-time email availability check          |
| `GET`    | `/api/account/me`              | Get current user's account                  |
| `PUT`    | `/api/account/me`              | Update name                                 |
| `GET`    | `/api/holdings/me`             | Get all holdings                            |
| `POST`   | `/api/holdings/buy`            | Buy stock — deducts cash, upserts holding   |
| `POST`   | `/api/holdings/sell`           | Sell stock — live Finnhub price, adds cash  |
| `GET`    | `/api/transactions/me`         | Full transaction history                    |
| `GET`    | `/api/watchlist/me`            | Get watchlist                               |
| `POST`   | `/api/watchlist`               | Add symbol to watchlist                     |
| `DELETE` | `/api/watchlist/{id}`          | Remove from watchlist                       |
| `GET`    | `/api/market/quote/{symbol}`   | Get cached price for symbol                 |
| `GET`    | `/api/market/history/{symbol}` | 1yr OHLC history (240min TTL cache)         |
| `GET`    | `/api/market/cached`           | All cached symbols (search dropdown)        |
| `GET`    | `/api/market/details/{symbol}` | Finnhub + FMP company profile               |
| `GET`    | `/api/market/seed`             | Seed stock_cache from Finnhub (131 symbols) |
| `GET`    | `/api/market/seed/history`     | Seed stock_history_cache from Yahoo Finance |

---

## Database

```
financeDb
 users
    id              BIGINT          PK  AUTO_INCREMENT
    email           VARCHAR(255)    UNIQUE  NOT NULL
    password        VARCHAR(255)    NOT NULL  (BCrypt hashed)
    created_at      DATETIME(6)     NOT NULL
    last_login      DATETIME(6)

 accounts                            (1:1 with users)
    id              BIGINT          PK  AUTO_INCREMENT
    user_id         BIGINT          FK → users.id  UNIQUE
    first_name      VARCHAR(255)    NOT NULL
    last_name       VARCHAR(255)    NOT NULL
    cash_balance    DECIMAL(10,2)   NOT NULL  DEFAULT 10000.00

 holdings                            (1:many with users)
    id              BIGINT          PK  AUTO_INCREMENT
    user_id         BIGINT          FK → users.id
    stock_symbol    VARCHAR(255)    NOT NULL
    quantity        DECIMAL(10,4)   NOT NULL
    avg_buy_price   DECIMAL(10,2)   NOT NULL
    purchased_at    DATETIME(6)

 transactions                        (1:many with users)
    id              BIGINT          PK  AUTO_INCREMENT
    user_id         BIGINT          FK → users.id
    stock_symbol    VARCHAR(255)    NOT NULL
    price           DECIMAL(10,2)   NOT NULL
    quantity        DECIMAL(10,4)   NOT NULL
    total_amount    DECIMAL(10,2)   auto-computed on insert (@PrePersist)
    type            ENUM('BUY','SELL')  NOT NULL
    created_at      DATETIME(6)

 watchlist                           (1:many with users)
    id              BIGINT          PK  AUTO_INCREMENT
    user_id         BIGINT          FK → users.id
    stock_symbol    VARCHAR(255)    NOT NULL
    added_at        DATETIME(6)
    UNIQUE(user_id, stock_symbol)

 stock_cache                         (shared — no user FK)
    symbol          VARCHAR(255)    PK
    company_name    VARCHAR(255)
    current_price   DECIMAL(10,2)
    open_price      DECIMAL(10,2)
    high_price      DECIMAL(10,2)
    low_price       DECIMAL(10,2)
    volume          BIGINT
    updated_at      DATETIME(6)

 stock_history_cache                 (1:many with stock_cache)
     id              BIGINT          PK  AUTO_INCREMENT
     symbol          VARCHAR(255)    NOT NULL
     time_interval   VARCHAR(255)    NOT NULL
     history_json    LONGTEXT
     cached_at       DATETIME(6)
     expires_at      DATETIME(6)
     UNIQUE(symbol, time_interval)
```

> **Design note:** Foreign keys are stored as plain `BIGINT` fields rather than JPA `@ManyToOne` relationships. This prevents Jackson from serializing the full object graph and causing infinite recursion in JSON responses.

---

## Key Design Decisions

| Decision                                               | Reason                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| FKs as plain `Long` fields                             | Prevents Jackson JSON infinite recursion                                                |
| `DECIMAL(10,2)` for all prices                         | Exact arithmetic — no floating point errors                                             |
| `time_interval` not `interval`                         | `interval` is a reserved word in MySQL                                                  |
| `LONGTEXT` for `history_json`                          | 365 days of OHLC per symbol exceeds MySQL's TEXT 65KB limit                             |
| Buy uses cache price, sell uses live Finnhub           | Buy price is what the user sees; sell needs real-time accuracy                          |
| `@Transactional` on `HoldingService`                   | Cash deduction and holding insert succeed or both roll back                             |
| `setTimeout(0)` in `ToastService`                      | Pushes emission outside Angular's current change detection cycle on auth pages          |
| `private static detailsCache` on `StockChartComponent` | Class-level — shared across instances so FMP is only called once per symbol per session |
| `setAllowedOriginPatterns("*")` in `SecurityConfig`    | Cloudflare tunnel URL rotates on every `Dev.sh` run                                     |
| `postWithOptions({ responseType: 'text' })` for auth   | Auth endpoints return plain text, not JSON                                              |
| `holdingsReady + transactionsReady` flags              | Gate `computeAnalytics()` until both async loads complete                               |

---

## Dev Workflow

The project followed a structured issue-driven workflow across 4 phases tracked in both [GitHub Issues](https://github.com/JeterG/Mthree-Final/issues?q=is%3Aissue+state%3Aclosed+sort%3Acreated-asc) and [Linear](https://linear.app/mthree-final/team/MTH/all):

| Phase   | Scope                                                    | Issues                                                                                                             |
| ------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Phase 1 | Backend core — entities, repositories, services, auth    | [#10–#17](https://github.com/JeterG/Mthree-Final/issues?q=is%3Aissue+state%3Aclosed+sort%3Acreated-asc)            |
| Phase 2 | Frontend — Angular components, routes, auth guard        | [#22–#35](https://github.com/JeterG/Mthree-Final/issues?q=is%3Aissue+state%3Aclosed+sort%3Acreated-asc)            |
| Phase 3 | Stock data — Finnhub, Yahoo Finance, caching, seeder     | [#15, #16, #19, #20](https://github.com/JeterG/Mthree-Final/issues?q=is%3Aissue+state%3Aclosed+sort%3Acreated-asc) |
| Phase 4 | Extras — projection, analytics, volume, cart, onboarding | [#36–#71](https://github.com/JeterG/Mthree-Final/issues?q=is%3Aissue+state%3Aclosed+sort%3Acreated-asc)            |

66 issues closed · 4 phases · All [pull requests](https://github.com/JeterG/Mthree-Final/pulls?q=is%3Apr+is%3Aclosed+sort%3Acreated-asc) reviewed before merging to `main`.

---

## Rubric

**Technology Stack:** Angular + Spring Boot + MySQL — **Total: 25 marks**

| #   | Category                             | Marks  | Status |
| --- | ------------------------------------ | ------ | ------ |
| 1   | Problem Understanding & Project Idea | 2      |        |
| 2   | Angular Frontend Implementation      | 5      |        |
| 3   | Spring Boot Backend Implementation   | 5      |        |
| 4   | Database Design (MySQL)              | 3      |        |
| 5   | Integration (Frontend ↔ Backend)     | 3      |        |
| 6   | Functionality                        | 5      |        |
| 7   | Code Quality & Project Structure     | 1      |        |
| 8   | Presentation & Explanation           | 1      |        |
|     | **Total**                            | **25** |        |

<details>
<summary>Rubric detail</summary>

**1. Problem Understanding & Project Idea**

- Clear explanation of the problem statement
- Relevance of the project
- Understanding of requirements

**2. Angular Frontend Implementation**

- Standalone components, services, routing, forms, data binding, UI design

**3. Spring Boot Backend Implementation**

- REST API design, controllers, service layer, dependency injection

**4. Database Design (MySQL)**

- Table structure, relationships, normalization, Spring Boot connectivity

**5. Integration**

- Angular communicating with Spring Boot via HTTP, correct response handling

**6. Functionality**

- All operations work correctly, proper validations

**7. Code Quality**

- Clean code, proper folder structure, naming conventions, readability

**8. Presentation**

- Ability to explain architecture and answer questions confidently

</details>

---

## Team

| Name            | Role                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| Sakib Khan      | Backend — Spring Boot, JPA entities, services, Finnhub/Yahoo/FMP integration |
| Jeter Gutierrez | Frontend — Angular components, Chart.js, Docker, Dev.sh, documentation       |

---

_Mthree Training Program · March 2026_
