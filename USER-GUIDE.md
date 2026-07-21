# User Guide — People's Coop IMS

This guide walks through how to actually use the system day-to-day.
For installation and technical setup, see the main [README](../README.md).

## Roles

The system recognizes three levels of access:

| Role | Can do |
|---|---|
| **Owner** | Everything, across all branches. Assigns Manager/Cashier roles and branches when creating users. Can act as source or destination on any stock transfer. |
| **Manager** | Runs day-to-day operations at their assigned branch: process and void sales, manage products/stock/suppliers, add Cashiers, and manage GCash float, expenses, and payables for their branch. |
| **Cashier** | Processes sales at their assigned branch and can view their own daily sales summary. Cannot void sales or manage inventory. |

## Signing In & Account Settings

Go to **Settings** to manage:

- **Profile** — update your name and email. If your email isn't verified yet, you'll see a banner with a link to resend the verification email.
- **Security** — change your password.
- **Appearance** — switch between Light, Dark, or System theme.

## Sales

### Sales History (Manager/Owner view)
Shows every transaction across the branch (or all branches, for
Owners): receipt number, date, cashier, member/non-member, payment
method, total, and status.

- **Search** by receipt number or cashier name; **filter** by status (Completed/Voided) or payment method (Cash/GCash).
- **View** opens the printable receipt for that sale.
- **Void** a sale (Manager/Owner only): you must enter a reason — either type your own or pick one of the quick-select reasons (Customer complaint, Wrong item scanned, Duplicate transaction, Price error). The reason is saved with the sale and shown on hover.

### My Sales (Cashier view)
A per-day summary of your own transactions — useful at the end of a
shift to reconcile the cash drawer:

- **Total Sales**, broken down into **Cash** and **GCash** totals, plus a count of **Voided** transactions
- Pick a date to review a previous shift
- Search by receipt number within that day

### Shift Sessions
Before ringing up sales, a cashier opens a shift by entering the
**starting cash** in the drawer. Recording a GCash cash-in or cash-out
(see **GCash Monitor** below) requires an open shift.

At end-of-day, closing the shift asks you to count the drawer by
**denomination** (₱1000s, ₱500s, ₱100s, coins, etc.) — the system adds
those up as your **actual cash**, compares it against the **expected
cash** it calculated from your starting cash and the shift's cash
sales, and shows the **variance** (short or over). The closed shift's
summary — and a full history of past shifts — stays available for
reference.

## Products

### Adding a Product
1. Fill in the **Product Name**. A **Barcode** is optional — scan one with your camera or a hardware scanner, or leave it blank and the system generates one automatically from the auto-created SKU.
2. Pick a **Category** and **Base Selling Unit** (e.g. Piece, Kilogram) from the searchable dropdowns. If the category you need doesn't exist yet, use **+ Add Category** right there in the dropdown — it opens a small dialog, creates the category, and selects it immediately without losing your place in the product form.
3. Optionally set a **Pack Selling Option** if the product can also be sold by box/pack (e.g. individual pieces *or* a 10-pack) — pick the pack unit and how many base units make up one pack.
4. Enter **Cost Price** and **Markup %**. The **Price Preview** box updates live, showing what members and non-members will pay per piece (and per pack, if applicable) — non-member prices include VAT on top of the member price.
5. Set a **Low Stock Alert Threshold** (in base units) — the product will be flagged as low stock once total remaining stock across all batches drops to or below this number.

### Editing a Product
Same form as creating one, plus an **Active** checkbox — uncheck this to hide the product from the POS without deleting it. Products with existing sales history can't be hard-deleted (to preserve receipts and margin history); deleting one instead deactivates it automatically.

### Categories
Categories can be nested — pick a **Parent Category** to make a
subcategory (e.g. "Dairy" under "Grocery"), or leave it blank for a
top-level category. The parent-category dropdown also has its own
**+ Add Category** shortcut.

### Barcode Labels
Print a barcode label for a single product, or select several
products and print them as a batch — handy after receiving a batch of
new, unlabeled items.

## Stock Batches (Receiving Stock)

Every delivery gets logged as its own **batch**, so cost is tracked on
a First-In-First-Out basis rather than one overwritten "current cost"
number.

**To receive stock:**
1. If you're an Owner, pick the **Receiving Branch**. Managers/Cashiers receive directly into their own assigned branch.
2. Scan the item's barcode to auto-select the product (works with both a hardware barcode scanner and your device's camera), or pick the product manually from the searchable dropdown. If the product doesn't exist yet, use **+ Add New Product** — this opens the full product-creation page in a new tab (product creation has too many required fields — SKU, category, unit, cost, markup — to fit a quick inline dialog), so your stock-batch form stays exactly as you left it.
3. Pick a **Supplier** (optional), enter the **quantity received** and **cost price per unit**, and the **date received**. Add an **expiry date** if the product is perishable.

> If you select a **Supplier**, a **Paid on Delivery** checkbox appears (checked by default). Leave it checked if the supplier was paid in full on the spot — nothing gets added to Accounts Payable. Uncheck it if the delivery is on credit, and the full batch cost will be recorded as unpaid in **Accounts Payable** (see the Financial Management section below), with an optional due date.

**On the Stock Batches list**, you can see at a glance:
- **Remaining vs. received** as a small progress bar per batch
- **Expiry status** — a green check if it's fine, an amber warning if it expires within 30 days, or a red "Expired" badge
- A **Depleted** tag once a batch's remaining quantity hits zero

Filter by expiry status (Expiring soon / Expired / Depleted) or search
by product/supplier name. A batch can only be deleted if nothing has
been sold from it yet.

## Stock Transfers

Use this to move stock between branches (Owner-only if moving between
two branches you don't work at; Managers can transfer stock out of
their own branch).

1. Pick the **Product**, **Source Branch** (Owners only — Managers/Cashiers transfer from their own branch automatically), **Destination Branch**, and **Quantity**. Add **Notes** if useful context is needed (e.g. "requested by Branch B for restocking").
2. On submit, stock is deducted from the source branch immediately and the transfer shows as **In Transit**.
3. The **destination branch** (or an Owner) opens Stock Transfers and clicks **Confirm Receipt** once the stock physically arrives — this adds it to their stock.
4. If a transfer was made in error, whoever can act on the *source* branch can **Cancel** it while it's still in transit, which restores the stock back to the source branch.

The Stock Transfers list shows stat counts for **In Transit**,
**Received**, and **Cancelled**, and can be filtered/searched the same
way as Sales History.

## Suppliers

Standard contact list for vendors you receive stock from: name,
contact person, phone, email, and payment terms. Suppliers show up as
a searchable option when receiving a stock batch.

## Units of Measure

A short list of the units your products are stocked/sold in (Piece,
Kilogram, Liter, Box, Dozen, etc.). This page works entirely inline —
**Add**, **Edit**, and **Delete** all happen directly in the list with
no separate pages, since a unit is just a name and an abbreviation.
Common units are offered as quick-fill suggestions when adding a new
one.

## Users

Owners and Managers with permission can add new staff accounts:

1. Enter **Full Name**, **Email**, and a starting **Password**.
2. If you can assign roles (Owner/senior Manager), pick the **Role** (Manager or Cashier) and the **Branch** they'll work at. Otherwise, the new user is automatically added as a Cashier at your own branch.

The Users list shows each person's role (with a shield icon for
Managers) and branch, with counts of Managers, Cashiers, and branches
represented at the top. Removing a user is permanent — you'll be
asked to confirm.

## GCash Monitor

Each branch has its own GCash **float** — the cash balance backing GCash
transactions at that register. From this page you can:

- **Cash-In** — record cash a customer paid you in exchange for a GCash transfer
- **Cash-Out** — record cash you gave a customer for a GCash transfer they sent you
- **Float Adjustment** — correct the float balance directly (e.g. after topping it up)

Cash-In and Cash-Out both require an **open shift** — if you haven't
started one yet, the dialog will tell you so instead of letting you
record the transaction. The page also shows today's cash-in/cash-out
totals and a running transaction log, so the float can be reconciled
without cross-checking receipts by hand.

## Financial Management

*(Manager/Owner only)*

### Expenses
Record a one-off operating cost: **Branch**, **Category** (rent,
utilities, supplies, etc.), **Description**, **Amount**, **Payment
Method**, **Expense Date**, and an optional **Due Date**. Mark it
**Paid** once it's settled, or leave it open to track what's still
owed.

Check **Recurring monthly bill** while adding an expense if it's one
that repeats every month (e.g. rent) — pick the **day of the month**
it's due, and from then on a reminder appears automatically each
month instead of you having to re-enter it. Recurring bills you've
set up can be reviewed, paused, or removed from the recurring list,
and a month's bill can be generated on demand once it's due.

### Accounts Payable
Money owed to suppliers. Most entries here are created automatically
when stock is received from a supplier (see **Stock Batches** above);
mark one **Paid** once the supplier has been settled. The page totals
how much is currently unpaid.

### Profit & Loss Report
Pick a **date range** (and, for Owners, a **branch** or "all
branches") to see:

- **Revenue**, **Cost of Goods Sold**, and **Gross Profit** (from completed sales)
- **Expenses** for the period
- **Net Profit**, with gross and net margin percentages

Owners viewing "all branches" also get a **per-branch breakdown**, so
performance can be compared across locations at a glance.

## Offline Use at the Register

The system periodically caches the active product catalog to the
browser, so if the connection drops mid-shift, product search,
barcode scanning, and checkout keep working using the last-synced
snapshot. Once the connection is back, the app re-syncs against the
server automatically. (Actions that require the server — like
confirming a stock transfer or adding a new product — still need a
live connection.)
