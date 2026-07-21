<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13.17-FF2D20?logo=laravel&logoColor=white" alt="Laravel 13.17">
  <img src="https://img.shields.io/badge/PHP-%5E8.3-777BB4?logo=php&logoColor=white" alt="PHP 8.3">
  <img src="https://img.shields.io/badge/Inertia.js-3.0-9553E9?logo=inertia&logoColor=white" alt="Inertia.js 3.0">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/status-active_development-00A79B" alt="Status">
</p>

<h1 align="center">People's Coop IMS</h1>
<p align="center"><strong>Point of Sale &amp; Inventory Management System</strong></p>
<p align="center">A full-featured POS and inventory system built for a consumer cooperative store<br>
— member vs. non-member pricing, FIFO stock costing, and multi-branch stock transfers, all in one place</p>
<p align="center">Developed by <strong>Jeffrae A. Sapla</strong></p>

---

## About

People's Coop IMS runs the complete retail lifecycle for a cooperative store in one place — from
receiving stock, to selling at the register, to reconciling a cashier's shift, to moving stock
between branches. It's built as a single Laravel application: one login, one interface, with
what a person can do — process a sale, void a sale, receive stock, manage users — governed by
their assigned role rather than a separate portal.

The app is a Laravel + Inertia.js + React monolith — no separate API layer, no client-side
routing duplication. Server-rendered data, client-rendered UI, one deploy. It's also
**offline-capable at the register**: the active product catalog is cached to the browser so
sales can still be rung up if the connection drops mid-shift.

## Areas of the App

Unlike a system with separate portals, People's Coop IMS is a single interface where the
available actions change based on who's signed in:

| Area | Audience | Focus |
|---|---|---|
| **Register / Sales** | Cashier, Manager, Owner | Ring up sales, view/void receipts, per-shift cash reconciliation |
| **Inventory** | Manager, Owner | Products, categories, stock batches (FIFO), stock transfers between branches, suppliers, units of measure |
| **Financial Management** | Manager, Owner | GCash float, expenses, recurring bills, accounts payable, profit & loss reporting |
| **Administration** | Owner, senior Manager | Add/remove users, assign roles and branches |
| **Account Settings** | Everyone | Profile info, password, theme |

Owners operate across all branches; Managers and Cashiers are scoped to their assigned branch.

## Key Features

### 🧾 Point of Sale (Sales)
- Full sales history — search by receipt #/cashier, filter by status or payment method (Cash /
  GCash)
- Void a sale with a required reason (Manager/Owner only) — quick-select common reasons or type
  your own, kept on record with the voided receipt
- **My Sales** — a per-cashier daily summary (total, cash total, GCash total, voided count) for
  end-of-shift cash drawer reconciliation
- **Shift Sessions** — a cashier opens a shift with a starting cash amount and closes it at
  end-of-day against the system's expected cash, with a full summary and shift history
- Automatic **member vs. non-member pricing**, with VAT applied on top of the member price for
  non-members

### 💳 GCash Monitor
- Tracks each branch's GCash float balance, with a running log of cash-in/cash-out transactions
  and fees
- Daily totals per branch, so a manager can reconcile the float without cross-referencing the
  transaction log by hand

### 💰 Financial Management
- **Expenses** — one-off operating costs (rent, utilities, supplies), each tied to a branch and a
  payment method, with a paid/unpaid status and optional due date
- **Recurring Expenses** — templates for bills that repeat monthly (e.g. rent due on the 5th);
  the system tracks the next due date and generates the month's expense on request
- **Accounts Payable** — money owed to suppliers, linkable to the stock batch that created the
  debt, with its own paid/unpaid tracking
- **Profit & Loss Report** — revenue, cost of goods sold, gross profit, expenses, and net profit
  for a chosen date range, with margin percentages and a per-branch breakdown for Owners

### 📦 Products & Categories
- Sell by a base unit (piece) and, optionally, a pack unit with a conversion factor (e.g.
  individually *or* by the 10-pack)
- Barcode support: type it, scan it with a camera, or leave it blank and the system generates one
  from the SKU automatically
- Live price preview (member/non-member, piece/pack) as cost price and markup % are entered
- Categories support a parent/child hierarchy (e.g. "Dairy" under "Grocery")
- Every dropdown is searchable, with inline **"+ Add Category"** and **"+ Add Product"**
  shortcuts so filling out one form never requires abandoning it to go set up another record
- Deleting a product with existing sales history deactivates it instead of destroying it, keeping
  historical receipts and margin reports intact
- Barcode label printing, single or in a batch

### 🏷️ Stock Batches (FIFO)
- Every delivery is logged as its own batch — quantity received, remaining quantity, cost per
  unit, received date, optional expiry date
- Sales draw from the oldest unexpired batch first, so margin reporting reflects real cost
  history instead of one overwritten "current cost" figure
- Expiry status at a glance (expired / expiring within 30 days / fine), plus a remaining-vs-received
  progress indicator
- Barcode-driven receiving — scan to jump straight to the right product

### 🔁 Stock Transfers
- Move stock between branches: deducted from the source branch immediately, marked **In Transit**
- The destination branch (or an Owner) **confirms receipt** to add it to their stock
- A pending transfer can be **cancelled**, restoring the stock to the source branch

### 🚚 Suppliers & Units of Measure
- Standard CRUD for suppliers — contact person, phone, email, payment terms
- Units of Measure works entirely inline (add/edit/delete right on the list) — no separate pages
  for a simple two-field entity

### 👥 Users & Access Control
- Three levels of access: **Owner** (cross-branch), **Manager**, and **Cashier**
- Users are assigned to a branch; Owners/senior Managers assign roles and branches when adding
  new staff
- Role-based authorization via `spatie/laravel-permission`

### ⚙️ Account Settings
- Profile (name, email, email verification)
- Password change
- Appearance: light / dark / system theme

### 📶 Offline-Capable Register
- The active product catalog is periodically snapshotted into the browser (IndexedDB, via
  `dexie`), so product search, barcode scanning, and checkout keep working at the register even
  without a live connection
- `vite-plugin-pwa` makes the app installable; the local cache re-syncs against the server once
  back online

## Roles & Permissions

| Capability | Cashier | Manager | Owner |
|---|:---:|:---:|:---:|
| Process sales at own branch | ✅ | ✅ | ✅ |
| Open/close own shift session | ✅ | ✅ | ✅ |
| View own daily sales summary | ✅ | ✅ | ✅ |
| Manage own profile / password | ✅ | ✅ | ✅ |
| View branch sales history | — | ✅ | ✅ |
| Void a sale | — | ✅ | ✅ |
| Manage products, categories, units | — | ✅ | ✅ |
| Receive stock (stock batches) | — | ✅ | ✅ |
| Initiate / confirm / cancel stock transfers (own branch) | — | ✅ | ✅ |
| Manage suppliers | — | ✅ | ✅ |
| Manage GCash float, expenses, payables | — | ✅ | ✅ |
| View profit & loss report | — | ✅ (own branch) | ✅ (all branches) |
| Add / remove users, assign roles & branches | — | Limited | ✅ |
| Cross-branch visibility & transfers | — | — | ✅ |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Laravel `^13.17` (PHP `^8.3`) |
| Frontend/backend bridge | Inertia.js `^3.0` (`inertiajs/inertia-laravel` + `@inertiajs/react`) |
| Auth | Laravel Fortify |
| Authorization | `spatie/laravel-permission` |
| Route helpers | Laravel Wayfinder (typed route helpers generated for the frontend) |
| UI | React `19`, Tailwind CSS `^4` (via `@tailwindcss/vite`) |
| Components | Radix UI primitives + `cmdk` (searchable comboboxes with inline "+ Add") |
| Charts | Recharts |
| Barcode | `html5-qrcode` (camera scanning), `jsbarcode` (label rendering) |
| Offline support | `dexie` (IndexedDB) + `vite-plugin-pwa` |
| Build tool | Vite `^8` with `@vitejs/plugin-react` |
| Database | SQLite by default (swap `DB_*` in `.env` for MySQL/Postgres if preferred) |

## Pricing Computation Reference

**Piece pricing**
```
member_piece_price     = cost_price × (1 + markup_percentage / 100)
non_member_piece_price = member_piece_price × (1 + vat_rate / 100)
```

**Pack pricing** (only when a pack unit + conversion factor is set on the product)
```
pack_cost               = cost_price × pack_conversion_factor
member_pack_price       = pack_cost × (1 + markup_percentage / 100)
non_member_pack_price   = member_pack_price × (1 + vat_rate / 100)
```

> The VAT rate and other pricing defaults live in `config/pricing.php`
> (`config('pricing.vat_rate')`, default `12`). The frontend price preview mirrors this formula
> for instant feedback while a product is being created/edited, but the **server is the source of
> truth** at checkout.

**Stock costing** follows **FIFO** — each stock batch retains its own `cost_price` and
`remaining_qty`; a sale draws down the oldest unexpired batch first rather than relying on a
single, overwritten "current cost" field on the product.

## Getting Started

### Requirements

| Requirement | Version |
|---|---|
| PHP | `^8.3` |
| Composer | `2.x` |
| Node.js | `20.x+` |
| npm | `10.x+` |

### Installation

```bash
git clone https://github.com/aokisan0924/peoples-coop-ims.git
cd peoples-coop-ims

composer install
npm install

cp .env.example .env
php artisan key:generate

# default DB is SQLite
touch database/database.sqlite
php artisan migrate

npm run build
```

Or, in one shot, via the script already defined in `composer.json`:

```bash
composer run setup
```

### Running it locally

```bash
composer run dev
```

This starts the PHP dev server, the queue listener, and the Vite dev server together (via
`concurrently`), so you only need one terminal.

### Quality checks

```bash
# Backend
composer run lint          # Laravel Pint (auto-fix)
composer run lint:check    # Pint (check only)
composer run types:check   # PHPStan / Larastan
composer run test          # Full suite: Pint + PHPStan + PHPUnit

# Frontend
npm run lint                # ESLint (auto-fix)
npm run lint:check          # ESLint (check only)
npm run format               # Prettier (auto-fix)
npm run format:check         # Prettier (check only)
npm run types:check           # tsc --noEmit
```

Or run everything at once:

```bash
composer run ci:check
```

### Useful Artisan commands

```bash
php artisan migrate:status   # check migration state
php artisan optimize:clear   # clear all caches
php artisan route:list       # inspect registered routes
php artisan tinker           # interactive shell
```

## Database Overview

| Table | Purpose |
|---|---|
| `products` | Product catalog — name, barcode/SKU, category, units, cost, markup, thresholds |
| `categories` | Product categories, supports parent/child nesting |
| `units` | Units of measure (Piece, Kilogram, Box, etc.) |
| `suppliers` | Vendors stock is received from |
| `stock_batches` | Individual stock receipts — FIFO cost, remaining qty, expiry |
| `stock_transfers` | Inter-branch stock movements and their status |
| `sales` / `sale_items` | Transaction headers and line items |
| `shift_sessions` | Per-cashier shift open/close records with expected vs. actual cash |
| `gcash_float` / `gcash_transactions` | Per-branch GCash float balance and its cash-in/cash-out log |
| `expenses` / `recurring_expenses` | One-off and recurring operating costs, per branch |
| `accounts_payables` | Money owed to suppliers, optionally linked to a stock batch |
| `users` | Accounts for Owners, Managers, and Cashiers, each tied to a branch |
| `locations` | Branches |
| Spatie permission tables | Roles and permissions backing role-based access |

## Security Notes

- Passwords are hashed (`bcrypt`, `BCRYPT_ROUNDS=12`).
- Role-based access is enforced server-side via role middleware/authorization checks — not just
  hidden in the UI.
- Two-Factor Authentication and Passkey login were intentionally **not** included — this is an
  internal system used by known staff on trusted devices, so that overhead wasn't worth it.
- **Before deploying:** never commit a populated `.env`, and if any seeded/demo accounts exist,
  rotate their credentials before real use.

## Author

Developed by **Jeffrae A. Sapla**.

## License

Internal system built for People's Multi-Purpose Cooperative. Not licensed for redistribution.
