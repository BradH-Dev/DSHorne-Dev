# Leather Stock Linking Tool

A browser-based admin tool to link and synchronise stock between in-store and online Square products, with price-driven ratio logic and instant Square API updates. Square does offer this natively, but not for products which are within families.

----------

# In order to use the tool you must specify a Square API auth token in an `.env` file.

----------

## Overview

This tool is designed for small retail businesses selling both in-store and online via Square.

It ensures that sales in one channel trigger the correct inventory reduction in the other - **using price as the universal conversion**.

In order for automatic features to work, you must ensure that Square webhooks are setup correctly. I am using Ngrok which simply allows for Square to send webhook events to /webhook as an endpoint to be received by the server.

**Key features:**

-   Real-time SKU and product name search for both in-store and online Square catalogs
    
-   Support for all product variations (size, colour, etc)
    
-   Ratio calculation based on prices, ensuring stock balance always reflects real sales value
    
-   “Force” button for immediate, accurate online stock sync after edits or restocks
    
-   Popup confirmations and real-time status messages
    
-   Full change tracking and audit logs
    

----------

## Workflow Summary

### 1. Link In-Store and Online Products

-   In the browser, search for your **in-store SKU/name** and **online SKU/name** in the table.
    
-   Select the correct Square item variation if prompted.
    
-   The tool auto-populates current prices and calculates the correct conversion ratio (e.g., _Online will reduce by X per 1x in-store sale_).
    
    

### 2. Save & Manage Links

-   Edits are auto-saved to the backend as you type.
    
-   Use **Insert row** to link more products.
    
-   Use **Delete** to remove a link.
    

### 3. Confirm and Reduce Stock

-   Click **Review stock...** to see a preview of upcoming inventory changes.
    
-   Click **Confirm and reduce stock** to trigger the changes in Square, with live status updates.
    

### 4. Use the Force Button

-   The **Force** button sets the online product’s stock based on the latest in-store count and the price ratio, for instant accuracy.
    
-   Recommended after changing rows, editing prices, or updating in-store counts.
    

----------

## Example Use Case

> You sell “Kangaroo Dry Black” for **$154/m² in-store** and for **$92/piece online** (each piece ≈ 0.59 m²).  
> When 3 pieces are sold online, in-store stock is reduced by 1.77 m².  
> When 1.5 m² is sold in-store, online stock is reduced by 2.54 pieces.

----------

## Import/Export & Persistence

-   All product links, tokens, and ratios are saved on the backend (`priceSync/saveData`) in a simple JSON file. This is largely scalable as you would need to have millions of products before you noticed any slow down.
    
-   Changes and price updates are logged with timestamps (`/logging` routes).
    
-   Price data is fetched from Square with daily update tracking for accuracy.
    

----------

## Tech Stack

-   **Frontend:** Vanilla JavaScript (modular, ES6), HTML, CSS
    
-   **Backend:** Node.js, Express, Socket.IO for real-time updates
    
-   **Persistence:** Auto-save to JSON (no external DB required)
    
-   **API:** Square API (secure, token-protected, never exposed to client)


<img width="2654" height="1447" alt="image" src="https://github.com/user-attachments/assets/2af57d7e-36c4-4f49-8723-a2cc2f4e4fd2" />
