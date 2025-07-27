
# Barcode Scanner Price Check Screen

A browser-based, real-time product lookup and price check tool for retail staff or customers using Square.  
This web app is designed for use on in-store terminals, POS systems, or tablets with a connected barcode scanner, offering instant product identification, pricing, and image display through a modern, animated UI.

---
# In order to use the tool you must specify a Square API auth token in an `.env` file.
## Overview

This tool enables staff or customers to:

- **Scan a product barcode** using a connected scanner or keyboard input.
- **Instantly display product details**—including item name, price, currency, and product image—on a large, clear screen.
- **Visually highlight search status and feedback** with animated backgrounds and status messages.
- **Integrate seamlessly with a live product lookup backend** via WebSocket for ultra-fast response.

**Ideal for Self-serve customer price-check kiosks**


---

## Key Features

- **Live WebSocket Communication:**  
  Sends barcode data to a backend service and displays real-time responses.
- **Animated, colorful UI:**  
  Engaging gradient backgrounds and clear feedback for every scan.
- **Auto-fades and resets:**  
  Details are shown temporarily, then the screen resets for the next scan.
- **Image support:**  
  Displays product images if available.
- **Keyboard and scanner compatible:**  
  Accepts direct keyboard input (typical of USB barcode scanners) and pasting.
- **Error and wait handling:**  
  Smart overlays prevent double scans and show clear “please wait” messages.

---

## Workflow

1. **Staff or customer scans a barcode** (or types/pastes it in).
2. **App sends the code to a WebSocket backend** (address is configurable in the code).
3. **Status updates appear** (“Searching...”, “Almost there”, etc.).
4. **Product details are displayed:** name, price, currency, and image (if available).
5. **After a few seconds, the UI resets** for the next scan.

---

## Setup & Usage

### 1. Host the HTML file

- Place the HTML file on any internal web server or simply open it in a modern browser (Chrome/Edge/Firefox).
- **Configure the WebSocket address** in the `<script>`:
  ```js
  ws = new WebSocket('ws://<YOUR_SERVER_IP>:<PORT>');
Change this line to point to your own backend service.

-   Ensure your backend server is running and ready to accept WebSocket connections with barcode payloads.
    

### 2. Connect a Barcode Scanner

-   Most USB barcode scanners act as keyboards, so scanning will input the code directly into the app.
    

### 3. Branding

-   Replace `asw.png` with your own logo or store branding as desired.

<img width="805" height="1330" alt="image" src="https://github.com/user-attachments/assets/e671cddd-17d3-4fb8-9913-c2b2f0093317" />
<img width="791" height="1318" alt="image" src="https://github.com/user-attachments/assets/642a9dd6-b34d-4e7a-8e43-831793b897e4" />

