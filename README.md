# Amazon Egypt Product Scraper

A web scraping project built with **Playwright**, **Node.js**, and **ExcelJS** that extracts product information from Amazon Egypt search results and exports the data into both **JSON** and **Excel** formats.

---

## Overview

This scraper automates the following workflow:

1. Launches a Chromium browser using Playwright.
2. Navigates to Amazon Egypt.
3. Searches for a specified keyword.
4. Scrapes product information from multiple search result pages.
5. Handles pagination automatically.
6. Exports the collected data to:
   - JSON file
   - Excel spreadsheet

The project demonstrates practical usage of browser automation, DOM extraction, pagination handling, data processing, file generation, and error recovery.

---

## Features

### Product Data Extraction

The scraper collects:

- Product Name
- Product Price
- Product Rating
- Number of Reviews
- Product URL

---

### Multi-Page Scraping

The scraper automatically navigates through multiple result pages and aggregates all extracted products into a single dataset.

Current configuration:

```javascript
const pagesToScrape = 5;
```

---

### Efficient DOM Extraction

Instead of requesting each element individually from Node.js, the scraper uses:

```javascript
page.$$eval()
```

to perform extraction directly inside the browser context, reducing communication overhead and improving performance.

---

### Retry Logic

Search operations are protected with retry attempts to handle temporary failures.

```javascript
for (let attempt = 1; attempt <= 3; attempt++)
```

This improves reliability when dealing with unstable network conditions.

---

### Human-Like Interaction

The project includes a custom click implementation that:

- Moves the mouse to a random position inside the target element
- Uses randomized click coordinates
- Adds random delays before interactions

Example:

```javascript
await humanClick(page, nextButton);
```

This approach helps avoid overly deterministic browser behavior.

---

### Optimized Browser Configuration

The scraper reduces unnecessary resource loading by blocking:

- Images
- SVG files
- CSS files

```javascript
await page.route(
    '**/*.{png,jpg,jpeg,svg,css}',
    route => route.abort()
);
```

This improves scraping speed and reduces bandwidth consumption.

---

### Anti-Bot Adjustments

The browser context is customized using:

- Custom User-Agent
- Custom Viewport
- Custom Locale
- Custom Timezone
- WebDriver masking

Example:

```javascript
Object.defineProperty(
    navigator,
    'webdriver',
    {
        get: () => undefined
    }
);
```

---

### JSON Export

All extracted products are exported to:

```text
output/totalItems.json
```

with formatted indentation for readability.

---

### Excel Export

The scraper generates a structured Excel workbook using ExcelJS.

Features:

- Styled headers
- Adjustable column widths
- Multi-line product names
- Wrapped text
- Clickable product hyperlinks

Output file:

```text
output/totalItems.xlsx
```

---

## Project Structure

```text
amazon-playwright-scraper/
│
├── output/
│   ├── totalItems.json
│   └── totalItems.xlsx
│
├── Amazon_scraper.mjs
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

## Technologies Used

- Node.js
- Playwright
- Chromium
- ExcelJS

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/amazon-playwright-scraper.git
```

Move into the project folder:

```bash
cd amazon-playwright-scraper
```

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

---

## Usage

Run the scraper:

```bash
npm start
```

The script will:

1. Open Amazon Egypt
2. Search for laptops
3. Scrape up to 5 pages
4. Save the collected data into JSON and Excel files

---

## Example Output

### JSON

```json
{
  "itemName": "Laptop Example",
  "itemPrice": "25000",
  "itemReviews": "4.5",
  "reviewNumber": "125",
  "itemlink": "https://www.amazon.eg/example"
}
```

### Excel

| Item Name | Price | Reviews Rating | Review Number | Product Link |
|------------|---------|----------------|----------------|-------------|
| Laptop Example | 25000 | 4.5 | 125 | Open Product |

---

## Learning Objectives

This project was created as part of a hands-on learning journey focused on:

- Browser Automation
- Web Scraping
- Playwright
- DOM Manipulation
- Pagination Handling
- Data Export
- Error Handling
- Anti-Bot Awareness

---

## Disclaimer

This project is intended for educational purposes only.

Always review and respect the Terms of Service and robots.txt policies of any website before scraping data.

---

## Author

Mohamed Ali

GitHub: https://github.com/Mohamed-Ali-Auto-dev