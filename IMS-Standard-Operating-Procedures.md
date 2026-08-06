# Peoples Coop IMS — Standard Operating Procedures

**Version:** aligned with app v0.3.x
**Roles in this system:** Cashier · Manager · Owner

---

## 1. Roles & Access Overview

| Area | Cashier | Manager | Owner |
|---|---|---|---|
| Point of Sale (ring up sales) | ✅ | ✅ | — (no branch of their own) |
| Open/close own shift | ✅ | ✅ | — |
| GCash cash-in/cash-out | ✅ | ✅ | View only, all branches |
| My Sales (own history) | ✅ | ✅ | — |
| Products, Categories, Units | ❌ | ✅ (view/create/edit) | ✅ (all branches) |
| Stock Batches (receive stock) | ❌ | ✅ (own branch) | ✅ (all branches) |
| Stock Transfers between branches | ❌ | ✅ | ✅ |
| Suppliers | ❌ | ✅ | ✅ |
| Expenses / Recurring Bills | ❌ | ✅ (own branch) | ✅ (all branches) |
| Accounts Payable | ❌ | ✅ | ✅ |
| Sales history / Void a sale | ❌ | ✅ (own branch) | ✅ (all branches) |
| Reports, Dashboard analytics, P&L | ❌ | ✅ (own branch) | ✅ (all branches + comparison) |
| Staff (Users) management | ❌ | ✅ (create Cashiers at own branch only) | ✅ (any role, any branch) |
| Branches (Locations) | ❌ | ❌ | ✅ |

A Manager or Cashier with **no assigned branch** cannot ring up sales, receive stock, or record GCash transactions — every account must be tied to a branch except Owner accounts, which see across all branches by design.

---

## 2. Daily Cashier Procedures

### 2.1 Starting a shift
1. Log in.
2. Go to **Point of Sale**.
3. If prompted to open a shift, count the starting cash in the drawer and enter it exactly.
4. Confirm — this timestamps the shift start and is the baseline every later cash calculation is measured against. **Never guess this number; always physically count it.**

### 2.2 Ringing up a sale
1. Search the product by name, SKU, or scan the barcode (camera or hardware scanner both work).
2. Select **piece** or **pack** if the product has both.
3. Adjust quantity.
4. Toggle **Member / Non-Member** correctly — non-members are charged VAT-inclusive pricing, members are not. This cannot be changed after the sale is completed.
5. Choose payment method:
   - **Cash** — enter amount tendered; the system calculates change.
   - **GCash** — enter the reference number from the customer's transaction.
6. Complete the sale. A receipt is generated with a unique receipt number.

**If you're offline:** the sale still completes and is queued locally on the device. It syncs automatically once the connection returns. The total shown while offline is an *estimate* — the final confirmed total appears once it syncs.

### 2.3 GCash transactions (cash-in / cash-out)
- **Cash-In**: customer gives you cash, you send them GCash → your GCash float **decreases**.
- **Cash-Out**: customer sends you GCash, you give them cash → your GCash float **increases**.
- Always record the **fee** charged, if any — it affects float reconciliation.
- A GCash transaction can only be recorded while you have an **open shift**.
- Float balances are per-branch — Branch A and Branch B never share a float.

### 2.4 Closing a shift
1. Go to **Close Shift**.
2. Count each cash denomination separately (₱1000s, ₱500s, etc.) and enter the count for each — don't skip to a single total, the row-by-row breakdown is what catches a miscount.
3. Watch the live indicator as you count:
   - **Balanced ✓** — matches expected
   - **Short by ₱X** — you have less cash than expected
   - **Over by ₱X** — you have more cash than expected
4. If short or over, use the **Notes** field to explain why before closing (e.g., "gave wrong change on receipt #1042").
5. Confirm to close. This is final — the shift's expected-vs-actual variance is permanently recorded.

**What affects "expected cash":** starting cash + cash sales + GCash fees + GCash cash-in − GCash cash-out − any cash paid out during the shift for bills/suppliers. If you paid a supplier or a bill in cash mid-shift, that's already accounted for — you shouldn't see a false "short" from it.

---

## 3. Manager Procedures

### 3.1 Adding a new product
1. Go to **Products → Add Product**.
2. Fill in name, category, base unit (and pack unit/conversion if sold both ways).
3. Set **cost price** and **markup %** — selling price is calculated automatically from these, never entered directly.
4. A barcode is auto-generated if you don't have a physical one to scan in.
5. **Adding a product does not create any stock.** You must receive stock separately (3.2) before it can be sold.

### 3.2 Receiving stock (Stock Batches)
1. Go to **Stock Batches → Receive Stock**.
2. Scan or select the product.
3. Enter **quantity received**, **cost price for this delivery** (can differ from the last delivery), **received date**, and **expiry date** if applicable.
4. Select the supplier, if any.
5. Choose payment status:
   - **Paid on delivery** — nothing further needed.
   - **On credit** — this creates an **Accounts Payable** entry automatically; you'll pay it off later (3.5).
6. Confirm. This stock is now sellable, FIFO-tracked, and belongs only to your branch — it will never be sold from or transferred to another branch without an explicit Stock Transfer (3.3).

### 3.3 Transferring stock between branches
1. Go to **Stock Transfers → New Transfer**.
2. Select the product, destination branch, and quantity.
3. Confirm — stock is deducted from your branch immediately and marked **in transit**.
4. The **receiving branch** must log in and **confirm receipt** before it appears in their sellable stock. Until confirmed, it's in limbo (deducted from you, not yet added to them) — this is intentional, it mirrors a real truck being on the road.
5. A transfer can be **cancelled** while still in transit (restores your stock); it cannot be cancelled once the other branch has confirmed receipt.

### 3.4 Recording an expense
1. Go to **Expenses → Add Expense**.
2. Choose a category (Rent, Electricity, Water, Internet, Supplies, Salaries, Other).
3. If this is a bill that repeats every month (rent, utilities), check **"Recurring monthly bill"** instead of logging it as a one-off — this creates a template that reminds you each month rather than a single dated entry.
4. If the payment is for actual **inventory** you're purchasing outside of normal stock receiving, check **"This is a stock/inventory purchase"** — this keeps it from being double-counted in Profit & Loss (since inventory cost is already captured through Cost of Goods Sold once it sells).
5. Choose payment method (Cash or GCash) and mark **Paid** if settling it now — a GCash payment deducts from your branch's float automatically.

### 3.5 Paying a supplier (Accounts Payable)
1. Go to **Accounts Payable**.
2. Find the unpaid entry (created automatically when you received stock on credit).
3. Click **Mark Paid**, choose Cash or GCash.
4. This does not re-touch your inventory — it only settles the debt.

### 3.6 Generating this month's recurring bills
1. Go to **Expenses** — pending recurring bills for your branch show automatically with a countdown to their due day.
2. Click **Generate This Month** to turn any pending template into an actual dated Expense you can then mark paid.
3. Safe to click more than once — already-generated bills for the month are never duplicated.

### 3.7 Voiding a sale
1. Go to **Sales** (history, not POS).
2. Find the sale, click **Void**, enter a reason (required).
3. This restores the exact stock that was sold — including its original expiry date if it was a perishable item — and cannot be undone. Only use this for a genuine mistake, not to "redo" a sale (ring up a corrected sale separately).

### 3.8 Creating a Cashier account
1. Go to **Users → Add User**.
2. New accounts you create are always assigned to **your own branch** and always get the **Cashier** role — a Manager cannot create another Manager or assign someone to a different branch, even by editing the request directly.

---

## 4. Owner-Only Procedures

### 4.1 Creating a branch
1. Go to **Locations → Add Branch**.
2. Name it, mark it active. A newly created branch starts with **zero stock and zero float** — it needs its first Stock Batches received and (if using GCash) its float will initialize at ₱0 on first transaction.

### 4.2 Creating a Manager (or a Manager for a specific branch)
1. Go to **Users → Add User**.
2. Choose role **Manager**, choose which branch — unlike a Manager creating an account, you have full control over both fields.

### 4.3 Deactivating a staff account
1. Go to **Users**, toggle the account inactive.
2. This immediately ends any active session that user has open, not just future logins — they cannot continue working once deactivated, even mid-shift.

### 4.4 Reviewing the business
- **Dashboard** — company-wide totals, or drill into a specific branch's Profit & Loss and the full branch-comparison table (Revenue / COGS / Expenses / Net Profit / Margin, side by side).
- **GCash Monitor** — read-only, combined float across all branches, with a branch column on every transaction.
- **Reports → Profit & Loss** — pick any date range, any branch (or all).

---

## 5. Things That Should Never Happen (and what to do if they do)

| Situation | What to do |
|---|---|
| Cashier has no assigned branch and can't sell | Owner/Manager: assign them a branch under Users |
| "Short by ₱X" every single shift, same cashier | Don't ignore it — review their cash handling directly; the system's math has been verified correct throughout this app's development, so a repeated shortage is a real-world issue, not a bug |
| Stock shows available but sale fails "insufficient stock" | Someone else likely sold the last units between your search and checkout — refresh and re-check; this is expected behavior at busy times, not an error |
| A product needs to move between branches urgently | Use Stock Transfer (3.3), not manual Stock Batch entry at both ends — manual entry breaks the audit trail and FIFO cost tracking |
| You paid a bill in GCash and the float goes negative | The system blocks this automatically and shows an error — it means your recorded float doesn't match reality; a Manager should reconcile via **GCash Monitor → Reconcile Float** first |

---

## 6. Offline Behavior (POS only)

- Sales queue locally and sync automatically when the connection returns.
- Product search/scan still works offline using a cache refreshed periodically while online — if a product was added in the last few minutes on another device, it may not appear offline yet.
- If a queued sale fails to sync (e.g. stock ran out at that branch while you were offline), it's flagged for manager review rather than silently lost or silently forced through.
- Always hard-refresh the app once back online after an offline shift, before trusting on-screen totals.

---

*This document reflects the system's actual behavior as of v0.3.x. If a workflow described here doesn't match what you see in the app, treat that as a bug report, not a documentation error — flag it rather than working around it.*
