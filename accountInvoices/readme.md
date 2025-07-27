
# Account Customer Invoicing & Stock Management System

A modern, browser-based application for generating Xero-compatible invoices and managing inventory via Square.  
This tool enables fast, accurate order lookup, custom CSV invoice creation, and real-time stock adjustment or recount, all in one workflow. It’s ideal for back-office staff or anyone handling account orders, bulk sales, or regular inventory corrections.

---

## Overview

- **Generate account invoices** for customers, with CSV export for easy Xero import.
- **Search, select, and populate orders** from Square Online with full item and pricing details.
- **Real-time item lookup** with smart dropdown search by SKU/barcode or product name.
- **Dynamic stock adjustment**: reduce or re-count inventory levels in Square, with clear warnings and confirmation.
- **Inline editing** of quantities, discounts, and prices (with GST-inclusive/exclusive toggle).
- **Animated, user-friendly UI** with tooltips, help popup, and persistent progress feedback.
- **Seinfeld quote of the day** for fun and engagement!

---

## Key Features

- **Order Search & Import:**  
  Instantly search and select recent Square orders (Open, Completed, etc.) to auto-populate the invoice table.
- **Live Product Lookup:**  
  Search and autofill by SKU, barcode, or product name. Dropdown results fetch from Square’s API in real time.
- **Batch Item Details Fetch:**  
  Fast, parallel API requests to retrieve pricing, GST, and category details for bulk invoice generation.
- **Inline Table Editing:**  
  - Editable columns for SKU, Item, Quantity, Discount
  - Quick “Edit” button for manual price override (supports GST incl/excl toggle)
  - “Use unit cost” toggle to switch from retail to wholesale/unit pricing (with safety checks)
  - Row-level delete
- **Dynamic Price Calculation:**  
  Real-time calculation of line totals, discounts, and GST, with auto-updating overall invoice total.
- **Stock Update Workflow:**  
  - **Reduce stock as sold:** Triggers Square inventory adjustment with CoGS impact.
  - **Re-count stock:** Performs physical count update without affecting CoGS.
  - Pop-up confirmation to prevent mistakes.
- **CSV Invoice Generation:**  
  Produces Xero-ready CSV file with mapped categories, GST, and customer details, ready for import.
- **Help & Feedback:**  
  Rich popup guides and warnings
- **Seinfeld Quote Widget:**  
  Fetches a daily random Seinfeld quote (with speaker, episode, and Yarn link).

---

## Workflow

1. **Search and Import Order:**  
   - Use “Search Orders...” to find a recent Square order, then click to import all line items.
2. **Table Editing:**  
   - Add/edit/remove rows, or search/add individual SKUs or products via dropdown.
   - Adjust quantities, prices, discounts, and toggle between GST modes.
   - Optionally, override prices or switch to unit cost for wholesale/contract customers.
3. **Invoice CSV Generation:**  
   - Click “Generate invoice CSV...” to download a ready-to-import Xero invoice file.
   - The app fetches required category details from Square and maps to the correct Xero account codes.
4. **Stock Update (Optional):**  
   - After exporting, review and confirm stock reduction (as sold) or re-count directly in Square.
   - Use the clear summary popups to double-check before any irreversible change.
5. **Enjoy daily Seinfeld wisdom!**  
   - See a fresh quote and get George-isms as feedback when refreshing.

---

## Setup & Usage

### 1. Host the HTML File

- Place the `index.html` (and associated `script.js`) on your web server or open in any modern browser.
- The app expects to communicate with a backend server providing `/api/items/search`, `/api/items/batch-details`, `/api/orders/search`, `/api/orders/batch-retrieve`, `/category`, and `/api/proxy/stock` endpoints.
- The backend must be authenticated for Square API and provide CORS if necessary.

### 2. Connect to Square

- Configure backend endpoints and Square API tokens as required (see `script.js` for headers).
- The default location and team member IDs are coded in (customize as needed).

### 3. For Xero Integration

- Exported CSV is designed for direct import into Xero’s invoice import tool.
- Default Xero account codes are mapped by product category (edit logic in `script.js` if your chart of accounts differs).

### 4. Branding

- The UI is clean and modern; tweak the CSS inside `<style>` tags to adjust branding or colors.

---

## Table Columns

| Column         | Editable? | Description                                             |
|----------------|-----------|---------------------------------------------------------|
| SKU            | Yes       | Scan or search for SKU/barcode; autofills item details  |
| Item           | Yes       | Product name (with variation, if applicable)            |
| Quantity       | Yes       | Number of units (each, ft², m², etc.)                   |
| Price (per)    | No        | Auto-calculated from Square (editable via "Edit")       |
| Price (all)    | No        | Line total, including GST/discounts as toggled          |
| Discount (%)   | Yes       | Per-line discount; supports percent                     |
| Edit price     | -         | “Edit” button for manual override; GST-sensitive        |
| Delete         | -         | Remove row from table                                   |

- Use the top-right GST checkbox to toggle GST-inclusive/exclusive mode for all calculations.

---

## Popups & Confirmation

- **Order Search:** Popup table with click-to-import and “Load more” for pagination.
- **Stock Reduction:** Detailed confirmation with line-by-line summary before changes are sent to Square.
- **CSV Generation:** Are-you-sure popup and real-time progress indicator for API calls.
- **Help:** Full usage instructions and FAQ via a friendly popup (George-isms included).
- **Success/Error:** Final popup with results and instructions on what to do next.

---

## Customization

- **Square API Location/Team:**  
  Edit the default `location_id` and `team_member_id` in the code for your store.
- **Xero Account Codes:**  
  Change logic for mapping categories to account codes to fit your Xero configuration.
- **GST/Tax Logic:**  
  Adjust the `divisor` and GST strings as required for your region.
- **Quote of the Day:**  
  Uses a WebSocket to fetch random Seinfeld quotes (or fallback list if not available).
- **Category Mappings:**  
  See the `fetchCategoryDetails` function for how categories are mapped to Xero codes.