import { writeFile } from "node:fs/promises"; 
import { chromium } from "playwright";
import ExcelJS from "exceljs";
// Humanizing to deal Anti-bots
const randomDelay = (min = 2, max = 5) => {
    const ms = (Math.random() * (max - min) + min) * 1000;
    return new Promise(res => setTimeout(res, ms));
}
async function humanClick(page, elementLocator) {
    if (await elementLocator.count() > 0 && await elementLocator.isVisible()) {
        const boundingBox = await elementLocator.boundingBox();
        if (boundingBox) {
            const targetX = boundingBox.x + (boundingBox.width * (0.2 + Math.random() * 0.6));
            const targetY = boundingBox.y + (boundingBox.height * (0.2 + Math.random() * 0.6));
            await page.mouse.move(targetX, targetY, { steps: Math.floor(Math.random() * 12) + 8 });
            await randomDelay(0.3, 0.8);
            await page.mouse.click(targetX, targetY);
            return true;
        }
    }
    await elementLocator.click();
    return true;
}
async function savepData(arrayData) {
    try {
        await writeFile("output/totalItems.json", JSON.stringify(arrayData, null, 4), "utf-8");
        console.log(`Data recorded succesfully in totalItems.json \n Total items:- ${arrayData.length}`);
    } catch (fsError) {
        console.error("there is an recording error", fsError.message);
    }
}
async function saveToExcel(arrayData) {
    try {
        if (arrayData.length === 0) return;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Products");
        worksheet.columns = [
            {
                header: "Item Name",
                key: "itemName",
                width: 50
            },
            {
                header: "Price",
                key: "itemPrice",
                width: 15
            },
            {
                header: "Reviews Rating",
                key: "itemReviews",
                width: 15
            },
            {
                header: "Review Number",
                key: "reviewNumber",
                width: 15
            },
            {
                header: "Product Link",
                key: "itemlink",
                width: 25
            }
        ];
        worksheet.getRow(1).font = {
            bold: true,
            size: 12
        };
        arrayData.forEach(item => {
            const formattedName = item.itemName
                ?.replace(/\//g, "/\n")
                .replace(/ - /g, "\n")
                || "";
            worksheet.addRow({
                itemName: formattedName,
                itemPrice: item.itemPrice,
                itemReviews: item.itemReviews,
                reviewNumber: item.reviewNumber,
                itemlink: {
                    text: "Open Product",
                    hyperlink: item.itemlink
                }
            });
        });
        worksheet.eachRow((row, rowNumber) => {

            if (rowNumber !== 1) {
                row.height = 80;
            }
            row.eachCell((cell) => {
                cell.alignment = {
                    wrapText: true,
                    vertical: "top"
                };
            });
        });
        await workbook.xlsx.writeFile("output/totalItems.xlsx");
        console.log("Excel file created successfully");
    } catch (error) {
        console.error("Excel Error:", error.message);
    }
}
async function initializeBrowser() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'Africa/Cairo'
    });
    const page = await context.newPage();
    await page.route('**/*.{png,jpg,jpeg,svg,css}', route => route.abort());
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await page.goto("https://www.amazon.eg/", { waitUntil: 'networkidle', timeout: 60000 });
    return { browser, page };
}
async function performSearch(page, searchQuery) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await page.locator("#twotabsearchtextbox").fill(searchQuery);
            await page.press("#twotabsearchtextbox", 'Enter');
            await page.waitForLoadState('networkidle');
            return true;
        } catch (error) {
            console.log("there is an error lets try again ");
            if (attempt === 3) throw new Error("There is an error we cant do search");
        }
    }
}
async function scrapeCurrentPage(page) {
    await page.waitForSelector('.s-result-list', { timeout: 10000 });
    
    const pageItems = await page.$$eval('.s-result-list [data-component-type="s-search-result"]', (elements) => {
        return elements.map((item) => {
            try {
                const nameEl = item.querySelector('[data-cy="title-recipe"] h2');
                const linkEl = item.querySelector('[data-cy="title-recipe"] a');
                const reviewsEl = item.querySelector('[data-cy="reviews-block"] .a-color-base');
                const reviewsNumEl = item.querySelector('[data-cy="reviews-block"] .s-underline-text');
                const priceEl = item.querySelector('[data-cy="price-recipe"] .a-price-whole');
                if (!nameEl) return null;
                const rawLink = linkEl ? linkEl.getAttribute('href') : "null";
                if (rawLink === "null" || rawLink.includes('javascript:void(0)')) {
                    return null; 
                }
                return {
                    itemName: nameEl.textContent ? nameEl.textContent.trim() : "null",
                    itemPrice: priceEl ? priceEl.textContent.trim() : "null",
                    itemReviews: reviewsEl ? reviewsEl.textContent.trim() : "null",
                    reviewNumber: reviewsNumEl ? reviewsNumEl.textContent.trim() : "null",
                    itemlink: `https://www.amazon.eg${rawLink}`
                };
            } catch (err) {
                return null;
            }
        }).filter(el => el !== null);
        
    });
    return pageItems;
}
async function navigateToNextPage(page) {
    const nextButton = page.locator('.s-pagination-strip .s-pagination-next');
    if (await nextButton.count() > 0 && await nextButton.isVisible()) {
        console.log("waiting for next page");
        await humanClick(page, nextButton);
        await page.waitForLoadState('networkidle');
        await randomDelay(2, 4);
        return true;
    }
    return false; 
}
async function run(searchQuery) {
    let allPagesItems = []; 
    let browserInstance;
    try {
        const { browser, page } = await initializeBrowser();
        browserInstance = browser;
        await performSearch(page, searchQuery);
        const pagesToScrape = 5;
        for (let p = 1; p <= pagesToScrape; p++) {
            console.log(`Page ${p} `);
            const currentData = await scrapeCurrentPage(page);
            console.log(`${currentData.length} Items in this page`);
            allPagesItems = allPagesItems.concat(currentData);
            if (p === pagesToScrape) break;
            const hasNext = await navigateToNextPage(page);
            if (!hasNext) {
                console.log("Pages ended");
                break;
            }
        }
        if (allPagesItems.length > 0) {
            await savepData(allPagesItems);
            await saveToExcel(allPagesItems);
        } else {
            console.log("No data to save");
        }
    } catch (globalError) {
        console.error(`Unexpected error ${globalError.message}`);
        
        if (allPagesItems.length > 0) {
            await savepData(allPagesItems)
            await saveToExcel(allPagesItems);;
        } else {
            console.log("There is't any data to save");
        }

    } finally {
        if (browserInstance) {
            await browserInstance.close();
            console.log("data scrabed succesfully");
        }
    }
}

run("laptops");
