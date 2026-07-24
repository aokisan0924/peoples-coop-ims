# Getting Started (Plain-Language Guide)

This guide assumes **no prior computer/programming experience**. If you've never installed
developer software before, start here. It walks through:

1. **[Installing the system](#part-1--installing-the-system)** — getting it running on a computer.
2. **[Using the system](#part-2--using-the-system)** — what each part of the app does day to day.

If something goes wrong, check [Troubleshooting](#troubleshooting) near the end.

*(Looking for the technical overview — stack, database schema, pricing formulas? See
[README.md](README.md) instead. This guide covers the same installation steps in far more
detail, plus a full walkthrough of using the app.)*

---

## Before you start: a few words you'll see a lot

You don't need to understand *how* these work — just what they *are*, so the instructions below
make sense.

| Word | What it means |
|---|---|
| **Terminal** (or "Command Prompt" / "PowerShell") | A window where you type commands instead of clicking buttons. Every step below tells you exactly what to type. |
| **Repository ("repo")** | The folder containing all the project's files, downloaded from GitHub. |
| **PHP** | The programming language the "backend" (the part that talks to the database) is written in. |
| **Composer** | A tool that downloads and manages all the PHP code libraries this project depends on. |
| **Node.js / npm** | A tool that downloads and manages the JavaScript code libraries for the parts you actually see and click on (the interface). |
| **Database** | Where all the actual data lives — products, sales, users, everything. This project uses a simple built-in database file, so you don't need to install separate database software. |
| **`.env` file** | A small settings file that tells the app things like "where is the database" and "what's the app's secret key." You'll create this from a template — you don't need to write it from scratch. |
| **Migration** | A one-time setup step that creates all the empty tables the database needs (products table, sales table, etc.) |
| **Seeding** | Filling those empty tables with some starter data — sample products, a few test user accounts — so you have something to look at immediately instead of a totally blank system. |

---

## Part 1 — Installing the system

### Step 0: What you need on your computer first

Before touching this project, install these three things. Each one only needs to be installed
**once** on your computer, no matter how many times you set up the project later.

1. **Git** — the tool that downloads the project from GitHub.
   Download from: https://git-scm.com/downloads
   During installation, it's fine to click "Next" through every screen with the default options.

2. **PHP (version 8.3 or newer)** — the language the backend runs on.
   The easiest way on Windows is to install **Laragon** (https://laragon.org/download/), which
   bundles PHP, Composer, and a database tool together in one installer. Download the "Full"
   version and run it — default options are fine.
   On Mac, the easiest way is [Herd](https://herd.laravel.com/).

3. **Node.js (version 20 or newer)** — needed to build the visual interface.
   Download from: https://nodejs.org — choose the "LTS" (Long Term Support) version. Run the
   installer with default options.

**How to check these installed correctly:**

Open a terminal:
- **Windows:** Press the Windows key, type `PowerShell`, press Enter.
- **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter.

Type each of these one at a time, pressing Enter after each, and check you get a version number
back (not an error):

```powershell
git --version
php --version
composer --version
node --version
npm --version
```

If any of these say "command not found" or similar, that program didn't install correctly —
reinstall it and restart your computer before trying again (this matters more than it sounds
like it should; Windows especially needs a restart to pick up new software locations).

### Step 1: Download the project

In your terminal, navigate to a folder where you want the project to live (for example, your
Desktop), then download it:

```powershell
cd Desktop
git clone https://github.com/aokisan0924/peoples-coop-ims.git
cd peoples-coop-ims
```

You should now have a folder called `peoples-coop-ims` on your Desktop, and your terminal should
be "inside" that folder — every command from here on assumes you're still there.

### Step 2: Create your settings file

Copy the template settings file:

```powershell
copy .env.example .env
```

*(On Mac/Linux, use `cp .env.example .env` instead.)*

You don't need to open or edit this file — the default settings inside it are already set up to
use the simplest possible database option, so there's nothing else to configure.

### Step 3: Install everything and set up the database

This single command downloads all the code libraries, creates a secret application key, builds
the empty database tables, and builds the visual interface. It can take a few minutes — that's
normal, especially the first time.

```powershell
composer setup
```

If this is the very first time PHP has looked at this project, it may also ask you to create the
database file — if you see a prompt asking to create `database/database.sqlite`, type `yes` and
press Enter.

### Step 4: Add some starter data (optional, but recommended)

This creates a few ready-to-use staff accounts and some sample products/stock, so you have
something to explore right away instead of a completely empty system:

```powershell
php artisan db:seed
```

This creates the following login accounts (all use the password **`password`**):

| Email | Role | Branch |
|---|---|---|
| `owner@example.com` | Owner | Sees every branch |
| `manager@example.com` | Manager | Main Branch |
| `cashier@example.com` | Cashier | Main Branch |
| `manager2@example.com` | Manager | Branch 2 |
| `cashier2@example.com` | Cashier | Branch 2 |

You'll also get some pre-loaded product categories, units, suppliers, and stock — enough to
actually ring up a test sale right away.

### Step 5: Start the app

```powershell
composer dev
```

This starts everything the app needs at once (the server, a background task runner, and the tool
that keeps rebuilding the interface as needed) and leaves them running in that terminal window.
Leave this window open — closing it stops the app.

You'll see some colorful log output appear. Once it settles down, open your web browser and go
to:

```
http://localhost:8000
```

You should see the login page. Log in with any of the accounts from Step 4 above.

**To stop the app:** click into that terminal window and press `Ctrl + C`.

**To start it again later:** you only need to repeat Step 5 (`composer dev`) — Steps 1–4 are
one-time setup.

---

## Part 2 — Using the system

The app is organized around a sidebar menu on the left. What you see there depends on your role —
a Cashier sees far less than an Owner. Here's what every section does.

### The three roles

- **Owner** — sees and manages every branch. The only role that can create branches, create
  Managers, or see cross-branch reports.
- **Manager** — runs one specific branch. Can create Cashier accounts for their own branch,
  manage that branch's inventory, and see that branch's reports.
- **Cashier** — the day-to-day counter staff. Can only ring up sales and view their own sales
  history — nothing administrative.

### Point of Sale (the checkout screen)

This is where a Cashier actually rings up a customer's purchase.

1. **Start your shift.** Before you can sell anything, you must open a shift — enter your
   starting cash amount (how much is physically in the drawer when you start). This exists so
   that, at the end of the day, the system can tell you whether the drawer matches what it should.
2. **Add items to the cart.** Tap a product tile to add it, or scan/type a barcode. Some products
   can be sold by the piece or by the pack (a box of 12, for example) — you'll see both options
   if the product supports it.
3. **Choose Member or Non-Member.** Cooperative members get member pricing; non-members pay a
   VAT-inclusive price on top. This choice is locked in once you've added the first item — clear
   the cart to change it.
4. **Choose payment method** — Cash or GCash. For cash, the screen shows quick-tap buttons for
   common bill amounts and calculates change automatically. For GCash, you'll enter the reference
   number from the transaction.
5. **Complete the sale.** A receipt appears, ready to print.

**Working offline:** if the internet or Wi-Fi drops mid-shift, the app keeps working — sales are
saved on the device itself and automatically sync to the server once the connection comes back.
You'll see a small banner letting you know you're offline.

**Closing your shift.** At the end of your shift, count the actual cash in the drawer — you'll
enter it broken down by denomination (how many ₱1000 bills, how many ₱500, and so on) rather than
just typing one total number, so a miscounted bill shows up clearly instead of hiding inside one
number. The system then tells you whether you're balanced, short, or over, and by how much.

### GCash Monitor

Tracks the cooperative's GCash e-wallet float — the cash you keep on hand to let customers
cash-in or cash-out.

- **Cash-In**: a customer gives you physical cash, you send them GCash credit. This *decreases*
  your float balance and *increases* the physical cash in your drawer.
- **Cash-Out**: a customer sends you GCash, you give them physical cash. This *increases* your
  float balance and *decreases* the physical cash in your drawer.

Like the POS, this requires an open shift, since it moves physical cash in or out of the same
drawer.

### My Sales / Sales History

**My Sales** shows a Cashier their own past transactions for the current shift or day. **Sales
History** (Manager/Owner only) shows every sale for the branches you can see, with the ability to
void a mistaken sale (which automatically puts the stock back).

### Shift History (Manager/Owner)

A log of every cashier's opened and closed shifts, with the cash-count breakdown and whether each
shift balanced, was short, or was over. This is the main tool for spotting and following up on
cash discrepancies.

### Products, Categories, Units, Suppliers

The catalog side of the system:

- **Products** — everything you sell: name, barcode/SKU, cost price, markup, and whether it can
  be sold by pack as well as by piece.
- **Categories** — groupings like "Grocery" or "Hardware," which can be nested (a category can
  have sub-categories).
- **Units** — the measurement units your products use (Piece, Pack, Kilogram, etc.)
- **Suppliers** — who you buy stock from.

### Stock Batch / Stock by Branch / Stock Transfers

Inventory is tracked in **batches** — every time stock arrives, it becomes a new batch with its
own cost and (if applicable) expiry date. When a sale happens, the system automatically sells
from the *oldest* batch first (this is called FIFO — First In, First Out), which keeps your cost
accounting accurate and helps rotate stock before it expires.

- **Stock Batch** — log new deliveries and see all batches for your branch, including which are
  expiring soon.
- **Stock by Branch** — a cross-branch view (Manager/Owner) of how much of each product is where.
- **Stock Transfers** — move stock from one branch to another. The receiving branch gets the
  exact same batch details (cost, expiry) that the stock originally had — nothing is lost in
  transit.

### Branches (Owner only)

Add, edit, or deactivate the cooperative's physical branch locations.

### Expenses, Accounts Payable, Recurring Bills

The money-going-out side of the operation:

- **Expenses** — one-off costs: a repair, a one-time purchase, anything paid immediately.
- **Accounts Payable** — money owed to a supplier that hasn't been paid yet, with a due date.
- **Recurring Bills** — things that repeat every month automatically, like rent or electricity —
  set it up once with an estimated amount and due day, and the system reminds you to log the
  actual bill each month rather than making you set it up from scratch every time.

Both cash and GCash payment methods are tracked here too, and — importantly — a cash bill payment
is correctly factored into that branch's shift cash-count, so paying a supplier in cash from the
till doesn't make a cashier's drawer look short by mistake.

### Profit & Loss (Manager/Owner)

A financial report combining revenue, cost of goods sold, and expenses into gross and net profit
for any date range, either for one branch or, for an Owner, compared side-by-side across every
branch.

### Users (Manager/Owner)

Manage staff accounts. A Manager can only create Cashier accounts at their own branch; only an
Owner can create Managers or assign someone to a different branch. Accounts are **deactivated**,
not deleted — this keeps historical sales/shift records intact while blocking that person from
logging in.

---

## Troubleshooting

**"php: command not found" / "composer: command not found" / "npm: command not found"**
The program didn't finish installing correctly, or your computer hasn't been restarted since
installing it. Restart your computer and try again. On Windows, if it still fails, search
"Environment Variables" in the Start menu and confirm PHP/Composer/Node's install folders are
listed under the `Path` variable.

**The page loads but everything looks unstyled / broken layout**
The visual interface hasn't finished building yet. Wait for `composer dev`'s terminal output to
settle down (stop scrolling), then refresh the browser page.

**"could not find driver" or database-related errors**
Your PHP installation is missing the SQLite extension. If you used Laragon or Herd (recommended
above), this shouldn't happen — if it does, reinstalling via one of those tools is the easiest
fix.

**Forgot everyone's password / want a completely fresh start**
Run this to wipe the database and reload the starter accounts from Step 4:
```powershell
php artisan migrate:fresh --seed
```
⚠️ This **permanently deletes all existing data** in your local database and starts over — only
do this if you're okay losing whatever you'd added since setup.

**Changes made in the code editor aren't showing up in the browser**
Make sure the `composer dev` terminal window is still open and running — if you closed it, the
app (and the tool that rebuilds the interface automatically) has stopped.

**Still stuck?**
Check the terminal window running `composer dev` for a red error message — it usually names the
specific file or line causing the problem, which is the fastest way to describe the issue to
whoever's helping you fix it.
