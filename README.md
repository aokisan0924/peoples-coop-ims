# People's Coop IMS

**Point-of-sale and inventory management for a multi-branch cooperative store.**

One login, one interface. What a person can *do* — ring up a sale, void a receipt, receive stock,
approve a transfer, manage staff — is governed by their role, not by which portal they happened
to open. Built as a single Laravel + Inertia + React application: no separate API layer to keep
in sync, no duplicated routing on the frontend.

The register keeps working even when the internet doesn't — the active product catalog is cached
in the browser, so a dropped connection mid-shift doesn't mean a dropped sale.

---

## At a glance

| | |
|---|---|
| **Modules** | Point of Sale · Shift Sessions · Inventory (FIFO) · Stock Transfers · GCash Float · Expenses & Payables · Profit & Loss |
| **Roles** | Cashier → Manager → Owner, each scoped to a branch except Owner, who sees all of them |
| **Stack** | Laravel 13 · Inertia.js · React 19 · Tailwind CSS 4 · SQLite/MySQL |
| **Offline** | Yes, at the register — product search, barcode scan, and checkout all work without a live connection |

<br>

<details>
<summary><strong>What's inside</strong></summary>
<br>

**Point of Sale.** Ring up sales, apply member vs. non-member pricing automatically (VAT stacks
on top of the member price for non-members), and void a transaction with a required, on-record
reason. Every cashier's day starts by opening a shift with a starting cash count and ends by
closing it against a denomination-by-denomination drawer count — the system tells you if you're
short or over.

**Inventory.** Every delivery is logged as its own batch — quantity, cost, received date, expiry
— and sales draw down the oldest unexpired batch first, so margin numbers reflect real cost
history instead of one overwritten "current cost" field. Products can sell by a base unit alone
or by base unit *and* pack (e.g. individually or by the 10-pack), with a live price preview as
cost and markup are entered. Every dropdown across the app is searchable, and the ones for
Category and Product carry their own inline "+ Add" shortcut, so filling out one form never means
abandoning it to go create another record first.

**Stock Transfers.** Move stock between branches — deducted from the source immediately, marked
in transit, and added to the destination only once someone there confirms it arrived. A transfer
still in transit can be cancelled, which puts the stock back where it came from.

**GCash Float.** Each branch carries its own float balance. Cash-in and cash-out transactions
(and fees) are logged against it in real time, reconciled per shift.

**Financial Management.** One-off and recurring expenses, accounts payable — most of which are
created automatically when stock is received on credit from a supplier — and a profit & loss
report (revenue, COGS, gross/net profit and margins) for any date range, with a per-branch
breakdown for Owners.

</details>

<details>
<summary><strong>Roles & permissions</strong></summary>
<br>

| Capability | Cashier | Manager | Owner |
|---|:---:|:---:|:---:|
| Process sales, open/close own shift | ✅ | ✅ | ✅ |
| View own daily sales summary | ✅ | ✅ | ✅ |
| View branch sales history, void a sale | — | ✅ | ✅ |
| Manage products, categories, units, suppliers | — | ✅ | ✅ |
| Receive stock, transfer stock (own branch) | — | ✅ | ✅ |
| Manage GCash float, expenses, payables | — | ✅ | ✅ |
| View profit & loss | — | ✅ (own branch) | ✅ (all branches) |
| Add/remove users, assign roles & branches | — | Limited | ✅ |
| Cross-branch visibility & transfers | — | — | ✅ |

</details>

<details>
<summary><strong>Tech stack</strong></summary>
<br>

| | |
|---|---|
| Backend | Laravel `^13.17` (PHP `^8.3`) |
| Bridge | Inertia.js `^3.0` — server-rendered data, client-rendered UI, no REST layer |
| Auth / Authorization | Laravel Fortify · `spatie/laravel-permission` |
| Frontend | React `19` · Tailwind CSS `^4` · Radix UI + `cmdk` |
| Charts | Recharts |
| Barcode | `html5-qrcode` (camera scan) · `jsbarcode` (label print) |
| Offline | `dexie` (IndexedDB) + `vite-plugin-pwa` |
| Build | Vite `^8` |
| Database | SQLite by default — swap `DB_*` in `.env` for MySQL/Postgres |

</details>

<details>
<summary><strong>Pricing math</strong></summary>
<br>

```
member_piece_price     = cost_price × (1 + markup_percentage / 100)
non_member_piece_price = member_piece_price × (1 + vat_rate / 100)

pack_cost               = cost_price × pack_conversion_factor      (only if a pack unit is set)
member_pack_price       = pack_cost × (1 + markup_percentage / 100)
non_member_pack_price   = member_pack_price × (1 + vat_rate / 100)
```

VAT rate and other defaults live in `config/pricing.php`. The frontend mirrors this formula for
an instant preview while editing a product, but the **server is the source of truth** at
checkout.

Stock costing follows **FIFO** — each batch keeps its own `cost_price` and `remaining_qty`; a
sale draws from the oldest unexpired batch first rather than one overwritten current-cost figure.

</details>

<details>
<summary><strong>Database overview</strong></summary>
<br>

| Table | Purpose |
|---|---|
| `products` / `categories` / `units` | Catalog — pricing, hierarchy, units of measure |
| `stock_batches` | FIFO stock receipts — cost, remaining qty, expiry |
| `stock_transfers` | Inter-branch stock movement and status |
| `sales` / `sale_items` | Transaction headers and line items |
| `shift_sessions` | Cashier shift open/close, expected vs. actual cash |
| `gcash_float` / `gcash_transactions` | Per-branch float balance and its transaction log |
| `expenses` / `recurring_expenses` / `accounts_payables` | Financial tracking |
| `users` / `locations` | Staff accounts and branches |
| Spatie permission tables | Roles and permissions |

</details>

---

## Getting started

**Requires:** PHP `^8.3`, Composer `2.x`, Node `20.x+`, npm `10.x+`

```bash
git clone https://github.com/aokisan0924/peoples-coop-ims.git
cd peoples-coop-ims

composer install && npm install
cp .env.example .env && php artisan key:generate

touch database/database.sqlite   # default DB is SQLite
php artisan migrate
npm run build
```

Or in one shot: `composer run setup`

**Run it locally** — `composer run dev` starts the PHP server, queue listener, and Vite dev
server together in one terminal.

**Quality checks** — `composer run ci:check` runs Pint, PHPStan, and PHPUnit on the backend and
ESLint, Prettier, and `tsc` on the frontend. See `composer.json` / `package.json` for the
individual scripts if you only need one of them.

---

## Security notes

- Passwords hashed with `bcrypt` (`BCRYPT_ROUNDS=12`); role checks are enforced server-side, not
  just hidden in the UI.
- Two-Factor Authentication and passkey login were deliberately left out — this runs on trusted
  devices for known staff, so that overhead wasn't worth the friction.
- Before deploying: never commit a populated `.env`, and rotate any seeded/demo credentials
  before real use.

---

Developed by **Jeffrae A. Sapla** for People's Multi-Purpose Cooperative. Internal system — not
licensed for redistribution.
