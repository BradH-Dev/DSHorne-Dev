# Cost of Goods Sold Tool

A streamlined browser-based tool to process Square CoGS reports, map product categories to Xero accounts, and generate journal-ready CSVs for Xero import.

---
# In order to use the tool you must specify a Square API auth token in an `.env` file.
---
## Overview

This tool helps small businesses efficiently manage their Cost of Goods Sold (CoGS) reports by:

- Uploading CoGS files exported from Square
- Automatically mapping categories to Xero sales accounts
- Optionally reconciling Square data with manual invoice data from Xero
- Generating two output files:
  - `upload_to_xero.csv`: ready for import into Xero's journal system
  - `check_uncategorised.csv`: shows uncategorised product totals and net figures excluding freight

---

## Workflow Summary

### 1. Map Square Categories

- The page auto-loads current categories from `categories.csv` and then updates them, based on all categories available in your Square account
- Each category is mapped via dropdown to a Xero account group:
  - **Leather**
  - **Leathercraft**
  - **Souvenirs**
- Your selections are saved immediately to disk

### 2. Upload Square CoGS File

**Export from Square:**

- Go to **Reports → Inventory reports → Cost of Goods Sold**
- Set your desired **date range**
- Click **Export** to download the CSV

**In the tool:**

- Click `📁 Choose Cost of Goods file from Square`
- Wait for the file to upload and validate

### 3. Generate Report

- Click **Generate report...**
- You’ll be asked whether to include **manual invoices** which were generated earlier and imported to Xero:
  - **Yes**: Enter the same start/end date range used in Square
  - **No**: Continue using Square data only

The tool will:

- Stream backend progress in real time
- Generate and auto-download:
  - `upload_to_xero.csv` - for importing into Xero
  - `check_uncategorised.csv` - for uncategorised reconciliation

---

## Importing into Xero

1. Click **Take me to Xero imports...**
2. Upload `upload_to_xero.csv`
3. Review and edit the **draft journal** created in Xero
4. Use `check_uncategorised.csv` to reconcile:
   - Missing categories
   - Freight/postage-related discrepancies

---

## Tech Stack

- **Frontend:** Vanilla JavaScript (modular), HTML, CSS
- **Backend:** Node.js + Express
- **CSV I/O:** `csv-parser`, `csv-writer`
- **Concurrency Control:** Mutex locking for safe file access
- **Persistence Layer:** Flat `.csv` files (no database)

---
<img width="1018" height="724" alt="image" src="https://github.com/user-attachments/assets/b6fe000c-09fd-4c40-9e2a-f12ffa878afc" />
<img width="654" height="132" alt="image" src="https://github.com/user-attachments/assets/d36ab2d8-22af-4292-b4c4-8adf788d9b0e" />
