
# In-Store Customer, Sales, and Product Management Tool for Vend/Lightspeed

A complete browser-based platform for searching, viewing, and managing LEGACY retail store customers, products, and sales-designed for use by in-store staff. This is useful when searching customer orders from Vend before switching to Square. This system provides real-time search, customer lookup, sales recording, PDF generation, and inventory management, with a modular Node.js backend, a MySQL database, and a clean, modern JavaScript-powered frontend.

---
# This requires an active MySQL database of customised Vend information. A dummy will be provided at a later date.

## Overview

This tool enables retail staff to:
- **Search for customers and sales** using name or order details.
- **View and manage known and unknown customers** with dynamic UI for each scenario.
- **Review sales/orders**, including PDF receipt generation and archiving.
- **Quickly generate and reprint order PDFs** from the last 10 jobs.
- **Maintain inventory and customer history** with all data stored centrally in a MySQL database for reliability, speed, and reporting.

It’s built for high-throughput, low-friction use in physical retail environments.

---

## Key Features

- **Real-time search** for customers, products, and orders from any device on the local network.
- **Seamless PDF generation and archiving**: Receipts, product info, and more, with rotating history for the last 10 actions.
- **Dedicated views for known customers and unknown/walk-in customers.**
- **Bulk and detailed sales entry and lookup.**
- **Beautiful, modular frontend** using shared JS and CSS for instant load times and high reliability.
- **Logo, styling, and layout** easily customizable via assets and shared stylesheets.
- **All data stored in a MySQL database** for robust, persistent storage and reporting.

---

## Workflow Summary

### 1. **Customer & Product Search**

- Staff can search for customers by name or company, OR by searching for order details (date, amount, invoice number)
- The **main dashboard** (`/index/`) provides a unified search bar with live filtering.
- Known customers get a detailed view (`/search-customer/customer-details.html`); unknown or walk-in customers get a simplified screen showing all unknown orders/unattributed (`/search-all/unknown-details.html`).

### 2. **PDF Generation and Printing**

- Invoices can be generated as PDFs if customers should request them (legally required).
- Last 10 generated PDFs are kept in `public/shared/pdfs/` for instant retrieval and reprinting.

### 3. **Styling & Customization**

- All UI components use shared styles (`public/shared/styles/`) and are easily themed.
- Logos can be swapped in `/assets/` for instant branding.

---

<img width="1273" height="765" alt="image" src="https://github.com/user-attachments/assets/77fbee24-838a-4c36-918a-953f0b28d4ba" />
<img width="1690" height="1074" alt="image" src="https://github.com/user-attachments/assets/bce1546c-a0fc-421d-ac5a-b608f03e5c71" />
<img width="1733" height="1155" alt="image" src="https://github.com/user-attachments/assets/c7b6719b-a487-4dde-bf35-373699e43ff1" />
<img width="757" height="1068" alt="image" src="https://github.com/user-attachments/assets/f3530328-a3f0-4f0a-874a-2bb015cdb1d3" />




