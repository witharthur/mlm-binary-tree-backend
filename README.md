# MLM Platform — Backend

A production-ready backend for a Multi-Level Marketing platform with a **binary tree** structure, built with **FastAPI**, **PostgreSQL**, **Redis**, and **Celery**.

Designed for high-load financial operations with full transactional safety, race condition prevention, and idempotent bonus calculations.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Run with Docker](#run-with-docker)
  - [Run Locally](#run-locally)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Wallet](#wallet)
  - [Packages](#packages)
  - [Orders](#orders)
  - [Bonuses](#bonuses)
  - [Withdrawals](#withdrawals)
- [Core Architecture](#core-architecture)
  - [Binary Tree & Spillover](#binary-tree--spillover)
  - [Wallet & Transactions](#wallet--transactions)
  - [PV System](#pv-system)
  - [Bonus Calculation](#bonus-calculation)
  - [Background Workers](#background-workers)
- [Concurrency & Safety](#concurrency--safety)
- [Configuration Reference](#configuration-reference)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Secure token-based auth with configurable expiry |
| **CORS Stability** | Global exception handling ensures CORS headers are present even on 500 errors |
| **Referral Registration** | `/ref/{user_id}/L` and `/ref/{user_id}/R` link-based registration |
| **Binary Tree** | Auto-placement with BFS spillover, safe for 1000+ concurrent insertions |
| **Wallet System** | Dual balances (`main_balance`, `deposit_balance`) with full transaction history |
| **Package System** | 4 tiers (START, BUSINESS, VIP, ELITE) with upgrade logic |
| **PV Tracking** | `left_pv` / `right_pv` with carry-forward remainders, batch-optimized for 100k+ users |
| **Referral Bonus** | Instant accrual on sponsor's wallet during package purchase |
| **Binary Bonus** | `min(left_pv, right_pv) × rate`, split 90% main / 10% deposit |
| **Orders** | Full order lifecycle with status tracking |
| **Withdrawals** | Request → Approve/Reject flow with automatic fund reservation |
| **Background Workers** | Celery + Redis for PV propagation and binary bonus calculation |
| **Idempotency** | Every financial operation has a unique idempotency key — no double accruals |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| API Framework | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 |
| Cache / Broker | Redis 7 |
| Task Queue | Celery 5.4 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | Pydantic v2 |
| Async Driver | asyncpg |
| Sync Driver | psycopg2 (Celery workers) |

---

## Project Structure

```
mlm-platform/
├── app/
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Settings (pydantic-settings, reads .env)
│   ├── database.py              # Async + sync SQLAlchemy engines
│   ├── models.py                # All ORM models (User, Wallet, Transaction, etc.)
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── security.py              # JWT creation/verification, password hashing
│   ├── exceptions.py            # Domain-specific HTTP exceptions
│   ├── dependencies.py          # FastAPI dependencies (get_current_user)
│   │
│   ├── api/
│   │   ├── router.py            # Aggregates all v1 routers under /api/v1
│   │   └── v1/
│   │       ├── auth.py          # Register, login, referral registration
│   │       ├── users.py         # Profile, tree visualization
│   │       ├── wallet.py        # Balance, deposit, transaction history
│   │       ├── packages.py      # List packages, purchase/upgrade
│   │       ├── orders.py        # Order history
│   │       ├── bonuses.py       # Bonus history
│   │       └── withdrawals.py   # Request, list, approve/reject withdrawals
│   │
│   ├── services/                # Business logic layer
│   │   ├── auth.py              # Registration + login logic
│   │   ├── tree.py              # Binary tree insertion (advisory locks + CTE BFS)
│   │   ├── wallet.py            # Credit/debit with FOR UPDATE + idempotency
│   │   ├── package.py           # Purchase/upgrade + PV event emission
│   │   ├── bonus.py             # Referral bonus (inline) + binary bonus (batch)
│   │   └── withdrawal.py        # Create, approve, reject with fund reservation
│   │
│   └── workers/                 # Celery background workers
│       ├── celery_app.py        # Celery configuration + beat schedule
│       └── tasks.py             # PV propagation + binary bonus tasks
│
├── migrations/
│   └── 001_initial.sql          # Full PostgreSQL schema (tables, indexes, enums)
│
├── docker-compose.yml           # Postgres, Redis, API, Celery worker + beat
├── Dockerfile                   # Python 3.12 production image
├── requirements.txt             # Python dependencies
├── .env                         # Local environment config
└── .env.example                 # Template for environment variables
```

---

## Getting Started
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://mlm:mlm_secret@localhost:5432/mlm_platform` | Async DB connection (FastAPI) |
| `DATABASE_URL_SYNC` | `postgresql+psycopg2://mlm:mlm_secret@localhost:5432/mlm_platform` | Sync DB connection (Celery) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis for caching |
| `SECRET_KEY` | `change-me` | JWT signing key (**change in production!**) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT token lifetime |
| `CELERY_BROKER_URL` | `redis://localhost:6379/1` | Celery message broker |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/2` | Celery result storage |

> [!IMPORTANT]
> **Local vs Docker Setup**: If running the backend locally (via `start-all.bat` or `uvicorn`), ensure `.env` hostnames for Postgres and Redis are set to `localhost`. If running via `docker-compose`, they should be set to `postgres` and `redis`.

### 🚀 Easy Start (Windows)
Simply run `start-all.bat` in the root directory. This will install dependencies and start both the Frontend (Port 3000) and Backend (Port 8000).

### Prerequisites

- **Docker & Docker Compose** (recommended), or:
- Python 3.12+
- PostgreSQL 16+
- Redis 7+

### Environment Variables

Copy the example and customize:

```bash
cp .env.example .env
```

### Run with Docker

The easiest way — starts everything (Postgres, Redis, API, Celery worker, Celery beat):

```bash
docker-compose up --build
```

> [!NOTE]
> When running in Docker, the API expects `.env` to have `DATABASE_URL=...postgres:5432...`.

The API will be available at **http://localhost:8000**.  
Interactive docs at **http://localhost:8000/docs**.

The `001_initial.sql` migration runs automatically on first Postgres start.

### Run Locally

```bash
# 1. Start Postgres + Redis (via Docker or installed locally)
docker-compose up -d postgres redis

# 2. Apply the migration
psql -U mlm -d mlm_platform -f migrations/001_initial.sql

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the API server
uvicorn app.main:app --reload --port 8000

# 5. Start the Celery worker (separate terminal)
celery -A app.workers.celery_app worker -l info

# 6. Start the Celery beat scheduler (separate terminal)
celery -A app.workers.celery_app beat -l info
```

---

## Database Schema

8 tables, fully typed with PostgreSQL enums and constraints:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   packages   │     │    users     │     │   wallets    │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │◄────│ package_id   │     │ id (PK)      │
│ name         │     │ id (PK/UUID) │────►│ user_id (UQ) │
│ price        │     │ username (UQ)│     │ main_balance │
│ pv_value     │     │ email (UQ)   │     │ deposit_bal. │
│ is_active    │     │ sponsor_id   │──┐  └──────┬───────┘
└──────────────┘     │ parent_id    │  │         │
                     │ placement    │  │  ┌──────┴───────┐
                     │ left_child   │  │  │ transactions │
                     │ right_child  │  │  │──────────────│
                     │ left_pv      │  │  │ wallet_id    │
                     │ right_pv     │  │  │ type (enum)  │
                     │ *_pv_carry   │  │  │ amount       │
                     └──────────────┘  │  │ balance_type │
                           │           │  │ idemp_key(UQ)│
                     ┌─────┴─────┐     │  └──────────────┘
                     │           │     │
              ┌──────┴──┐  ┌────┴─────┴┐  ┌──────────────┐
              │  orders  │  │bonus_logs │  │ pv_events    │
              │─────────│  │───────────│  │──────────────│
              │ user_id  │  │ user_id   │  │ user_id      │
              │ pkg_id   │  │ type      │  │ pv_amount    │
              │ amount   │  │ amount    │  │ processed    │
              │ status   │  │ source_id │  └──────────────┘
              │ idemp(UQ)│  │ idemp(UQ) │
              └──────────┘  └───────────┘  ┌──────────────┐
                                           │ withdrawals  │
                                           │──────────────│
                                           │ user_id      │
                                           │ amount       │
                                           │ status       │
                                           │ payment_det. │
                                           └──────────────┘
```

### Key constraints

- `wallets.main_balance >= 0` and `wallets.deposit_balance >= 0` enforced at DB level
- `transactions.idempotency_key` is `UNIQUE` — prevents double accruals
- `bonus_logs.idempotency_key` is `UNIQUE` — prevents duplicate bonuses
- `orders.idempotency_key` is `UNIQUE` — prevents duplicate purchases
- `users.placement_side` restricted to `'L'` or `'R'`

### Packages (seeded)

| Name | Price | PV Value |
|------|-------|----------|
| START | 100.00 | 100 |
| BUSINESS | 500.00 | 500 |
| VIP | 1,500.00 | 1,500 |
| ELITE | 5,000.00 | 5,000 |

---

## API Reference

Base URL: `http://localhost:8000/api/v1`  
Interactive Swagger docs: `http://localhost:8000/docs`

### Authentication

#### Register (no referral)
```
POST /auth/register
```
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "securepass123"
}
```

#### Register via referral link
```
POST /auth/register/ref/{sponsor_id}/{L|R}
```
Places the new user in the binary tree under the sponsor on the specified side (L = left, R = right). If the slot is occupied, BFS spillover finds the first available position.

#### Login
```
POST /auth/login
```
```json
{
  "username": "john",
  "password": "securepass123"
}
```
Returns:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile with PV data |
| GET | `/users/me/tree?depth=5` | Binary tree visualization (max depth 10) |

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet` | Get wallet balances (main + deposit) |
| POST | `/wallet/deposit` | Deposit funds (requires `idempotency_key`) |
| GET | `/wallet/transactions?limit=50&offset=0` | Transaction history |

#### Deposit example
```json
{
  "amount": "500.00",
  "idempotency_key": "dep-unique-key-123"
}
```

### Packages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages` | List all active packages |
| POST | `/packages/purchase` | Purchase or upgrade a package |

#### Purchase example
```json
{
  "package_id": 2,
  "idempotency_key": "purchase-abc-456"
}
```
On upgrade, only the **price difference** is charged.

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders?limit=50&offset=0` | List user's orders |

### Bonuses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bonuses?limit=50&offset=0` | List user's bonus history |

### Withdrawals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/withdrawals` | Create withdrawal request |
| GET | `/withdrawals` | List user's withdrawals |
| POST | `/withdrawals/{id}/approve` | Admin: approve withdrawal |
| POST | `/withdrawals/{id}/reject?admin_note=...` | Admin: reject + refund |

#### Withdrawal request example
```json
{
  "amount": "200.00",
  "payment_details": {
    "method": "bank_transfer",
    "account": "1234567890"
  }
}
```

---

## Core Architecture

### Binary Tree & Spillover

Each user has a position in a binary tree defined by `parent_id`, `placement_side` (`L`/`R`), `left_child_id`, and `right_child_id`.

**Registration flow:**
1. User registers via `/ref/{sponsor_id}/L` (or `/R`)
2. System checks if the preferred slot on the sponsor is empty
3. If empty → place directly
4. If occupied → **BFS spillover**: a recursive CTE searches the sponsor's subtree breadth-first for the first available slot
5. The new user is placed at the found position

**Concurrency handling (1000+ simultaneous registrations):**
- `pg_advisory_xact_lock(0x4D4C4D54)` — global tree mutation lock prevents two BFS operations from finding the same slot
- `SELECT … FOR UPDATE` on the parent row — belt-and-suspenders safety
- Double-check assertion — verifies the slot is still NULL after acquiring the lock
- Lock duration: ~5ms per insertion (BFS CTE + one UPDATE)

### Wallet & Transactions

Every wallet operation goes through `credit()` or `debit()` in `services/wallet.py`:

```
1. Check idempotency_key → if exists, return existing transaction (no-op)
2. SELECT wallet FOR UPDATE → lock the row
3. Validate balance (for debits)
4. Mutate balance
5. INSERT transaction record
6. COMMIT
```

Two balance types:
- **`main_balance`** — freely withdrawable
- **`deposit_balance`** — restricted (e.g., from binary bonus deposit split)

### PV System

PV (Point Value) tracks volume on each side of a user's binary tree:

1. When a user purchases a package, a `pv_events` row is created (not processed inline)
2. A Celery worker runs every **10 seconds**, picks up unprocessed events with `SKIP LOCKED`
3. For each event, the worker walks from the source user up to the root, incrementing `left_pv` or `right_pv` on each ancestor based on `placement_side`
4. Tree depth for 100k users ≈ 17 levels → each event touches ≤ 17 rows

**Carry forward:** After binary bonus calculation, the weaker side is zeroed and the stronger side keeps the remainder:
```
left_pv_carry  = left_pv  - min(left_pv, right_pv)
right_pv_carry = right_pv - min(left_pv, right_pv)
```

### Bonus Calculation

#### Referral Bonus (instant)
- Triggered during package purchase
- Sponsor receives `REFERRAL_BONUS_PERCENT` (default 10%) of the package price
- Credited to sponsor's `main_balance`
- Idempotency key: `ref_bonus:{buyer_id}:{sponsor_id}`

#### Binary Bonus (background, daily)
- Calculated by Celery Beat task (daily)
- Formula: `base = min(left_pv, right_pv)`
- Bonus: `base × BINARY_BONUS_PERCENT` (default 10%)
- Split: **90% → main_balance**, **10% → deposit_balance**
- After matching, PV is consumed and remainder carries forward
- Idempotency key: `bin_bonus:{user_id}:{date}`
- Uses `SKIP LOCKED` for concurrent worker safety

### Background Workers

| Task | Schedule | Description |
|------|----------|-------------|
| `propagate_pv_events` | Every 10 seconds | Processes PV events batch — walks tree upward |
| `calculate_binary_bonuses` | Once per day | Matches PV, calculates bonus, updates wallets |

Both tasks:
- Use **sync** SQLAlchemy sessions (Celery workers are synchronous)
- Pick rows with `FOR UPDATE SKIP LOCKED` — safe for multiple concurrent workers
- Have automatic retries (3 attempts with backoff)

---

## Concurrency & Safety

| Threat | Mitigation |
|--------|------------|
| Two users placed in same tree slot | `pg_advisory_xact_lock` + `SELECT FOR UPDATE` + assertion |
| Double bonus accrual | Unique `idempotency_key` on `transactions` and `bonus_logs` |
| Wallet balance going negative | `SELECT FOR UPDATE` + Python check + DB `CHECK (balance >= 0)` |
| Concurrent PV propagation | `SKIP LOCKED` ensures each event is processed by exactly one worker |
| Withdrawal race condition | Funds reserved (debited) immediately on request creation |
| Concurrent package purchase | `SELECT FOR UPDATE` on user row + order idempotency key |

---

## Configuration Reference

Business constants in `app/config.py` (overridable via `.env`):

| Setting | Default | Description |
|---------|---------|-------------|
| `REFERRAL_BONUS_PERCENT` | `10.0` | % of package price paid as referral bonus |
| `BINARY_BONUS_PERCENT` | `10.0` | % of matched PV paid as binary bonus |
| `BINARY_MAIN_SPLIT` | `0.9` | Fraction of binary bonus → main_balance |
| `BINARY_DEPOSIT_SPLIT` | `0.1` | Fraction of binary bonus → deposit_balance |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT token lifetime |

---

## Health Check

```
GET /health → {"status": "ok"}
```

---
