**User Story: Low Stock Badge**

**Title:** Display Low Stock Badge on Product Listing Page and Product Detail Page

**As a** customer browsing the Knack Store website  
**I want to** see a "Low Stock" badge/ indicator on a product when its available quantity falls below a defined limit  
**So that** I can make a timely purchase decision before the item sells out

---

**AC1 — Badge Trigger Condition and Configuration**

* When a customer views or attempts to add a product to the cart, the system shall display a Low Stock badge if the available quantity is **10 units or fewer**.  
* Default threshold value: **10 units** or as per the product 

**AC2 — Badge Placement**

* **PLP (Product Listing Page):** Badge displayed on the product card/tile, near the price or product title.  
* **PDP (Product Detail Page):** Badge displayed near the Add to Cart button / stock availability area.  
* The threshold shall be configurable at the individual product/variant level via the admin/merchandising level.

**AC3 — Badge Content and Colour Format**

The badge shall change colour based on stock level, to draw attention without appearing alarming:

| Available Quantity | Badge Colour |
| :---- | :---- |
| 10 units | Default text colour (no warning styling) |
| 4 – 9 units | Orange |
| 1 – 3 units | Red |
| 0 units | "Out of Stock" label (grey / red-strikethrough) — Low Stock badge does **not** display |

* Badge message format: **"Only \[X\] left in stock"**, where X is the real-time available quantity (actual number, not rounded or approximated).  
* When available quantity reaches zero, the system shall display **"Out of Stock"** instead of the Low Stock badge.

**AC4 — Variant-Level Evaluation**

* For products with variants (size, colour, storage, etc.), the badge shall reflect the stock of the **specific variant currently selected/viewed** — not an aggregate across all variants.  
* On the PLP, if a default variant is shown, the badge reflects that variant's stock.  
* On the PDP, the badge shall update dynamically when the customer switches variant selection, without a full-page reload.

**AC5 — Stock Reservation**

* Adding an item to the cart, or starting checkout, shall place a temporary hold on that quantity.  
* The hold/reservation shall be released automatically after a short window **(15 minutes)** if the order is not completed.  
* If two customers attempt to purchase the last unit at the same time, only one purchase shall succeed. Customer who is purchasing first will get the product.   
* The customer whose purchase does not succeed shall receive a clear message: **"Product is out of stock."**  
* If the customer is not placing the order within stipulated time, the products will get restock. 

