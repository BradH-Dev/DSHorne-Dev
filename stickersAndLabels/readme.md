
# Stickers & Shipping Labels Printing Tool

A browser-based admin utility for generating, managing, and printing product barcode labels, in-store stickers, and shipping labels, with seamless integration to in-store hardware and bulk Square catalog support.

This tool provides a streamlined workflow for businesses needing to generate and print barcoded product stickers, shelf labels, and shipping labels. It features PDF generation, instant print integration via a Windows daemon, direct Square catalog integration for SKU, price, and product lookup, **plus direct support for Australia Post and Direct Freight shipping labels**.

> **Note:** You must specify a Square API auth token and other configuration variables in a `.env` file for full automation.

---

## Overview

Designed for small to medium retail stores, this tool makes it easy to:
- Generate barcode sticker PDFs from your product list
- Instantly print shipping labels (including Australia Post and Direct Freight) on in-store printers via a dedicated Windows background service
- Fetch live product data and images from Square
- **Import shipping labels from Australia Post by URL, or upload Direct Freight PDF labels for instant printing**

The backend leverages Node.js (Express) and a modular route/controller structure, while the frontend is a clean, JavaScript-powered web UI.

---

## Key Features

- **Real-time product lookup** (via SKU/name) from your Square catalog  
- **Barcode generation** using standard symbologies (with human-readable SKU/text)
- **PDF generation** for quick batch or single-label printing  
- **Direct shipping label print support:**
  - **Paste an Australia Post label URL** to fetch and print a shipping label instantly
  - **Upload a PDF of a Direct Freight label** for direct in-store printing
- **One-click label printing** enables printing onto a dedicated label printer through Windows
- **Supports both product stickers and larger shipping labels**
- **Persistent PDF archiving** (last 10 jobs) for reprinting or backup
- **Modern UI:** Grid search, live status, and print queues

---

## Workflow Summary

0. **Shipping Labels:**
   - **Paste an Australia Post shipping label URL** and the tool will download and queue the label for instant printing.
   - **Upload a Direct Freight shipping label as a PDF** and print directly from the browser.
1. **Product Lookup & Label Setup**
   - In your browser, search for products by SKU, name, or scan directly.
   - Auto-fills product details from Square, including price, item name, and variations.

2. **Customize & Generate**
   - Select quantity, adjust display text or price if needed.
   - Instantly preview barcode and layout.

3. **Print & Archive**
   - Hit Print to instantly send the PDF or shipping label to your in-store label printer via the Windows daemon.
   - PDFs are archived (`shared/pdfs/barcodes0.pdf` to `barcodes9.pdf`) for reprinting or review.


---

## Example Use Case

You receive a new shipment of products and orders to ship:
- Scan or search items from the browser.
- Generate barcodes for each, automatically using your current Square catalog.
- Instantly print stickers or shelf labels using your connected Windows print station.
- **Paste an Australia Post label URL or upload a Direct Freight PDF to print shipping labels for outgoing orders.**

---

## Import/Export & Persistence

- Uploaded CSV files, shipping labels, and generated PDFs are stored in `shared/pdfs/` (last 10 kept, rotating).
- No customer/product data is stored server-side beyond temporary files.
- Uses `.env` for API tokens and hardware config.

---

## Tech Stack

- **Backend:** Node.js (Express), modular controller/route structure
- **Frontend:** HTML, vanilla JS (modular), modern responsive UI
- **PDF Generation:** Custom logic via [pdf-lib](https://pdf-lib.js.org/)

---

