### **User Story 1: Guest User Tracking & Display**

**As a** Guest User, **I want to** see a list of my recently viewed products on the Homepage and Product Detail Pages **so that** I can easily find and return to items I was previously considering during my session.  
**Acceptance Criteria:**

> * **Given** I navigate to a Product Detail Page (PDP), **When** the page loads, **Then** that product is saved to my browser's localStorage.  
> * **Given** I have viewed products, **When** I go to the Homepage or another PDP, **Then** I see a horizontal strip displaying up to 10 of my most recently viewed products.  
> * **Given** I view a product I have already looked at, **When** the list updates, **Then** the product is moved to the front of the list (position 1\) and is not duplicated.  
> * **Given** I have viewed more than 10 products, **Then** only the 10 most recent products are kept in localStorage and displayed.

**Estimated Effort:** **5 Story Points** *(Reasoning: Requires setting up the shared Angular UI component, implementing the localStorage logic, array manipulation for deduplication, and placing the component on two different page templates.)*

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### **User Story 2: Logged-In User Tracking & Persistence**

**As a** Logged-In User, **I want to** have my recently viewed products saved to my account **So that** my browsing history is preserved across different sessions and devices.  
**Acceptance Criteria:**

> * **Given** I am logged into my account, **When** I view a PDP, **Then** the view event is recorded to the server-side database.  
> * **Given** I log into my account, **When** the system loads my recently viewed items, **Then** it fetches my server-side history and starts fresh for the session (it does **not** merge the guest history I had before logging in).  
> * **Given** I access the site from a different device and log in, **Then** I see the exact same recently viewed history.

**Estimated Effort:** **5 Story Points** *(Reasoning: Requires backend API development (GET/POST endpoints), database table/schema updates to map user IDs to product IDs, and frontend integration to switch from local storage to API calls upon authentication.)*

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### **User Story 3: Product Card UI & Interactions**

**As a** Shopper (Guest or Logged-In), **I want to** see clear product details and quick actions on my recently viewed cards **So that** I can visually recognize the product and quickly add it to my cart or view its details.  
**Acceptance Criteria:**

> * **Given** a product is in the recently viewed strip, **Then** its card displays the Product Image (primary focus), Product Name, and Price.  
> * **Given** the product has no variants (e.g., size, color), **Then** a small "Add to Cart" button is displayed on the card.  
> * **Given** I click the "Add to Cart" button, **Then** the item is added to my cart without leaving the current page.  
> * **Given** the product has variants, **Then** no "Add to Cart" button is shown, and clicking anywhere on the card redirects me to that product's PDP.

**Estimated Effort:** **3 Story Points** *(Reasoning: UI/UX styling for the cards, conditional rendering logic for the "Add to Cart" button based on product payload, and cart API integration.)*

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### **User Story 4: Clear History & Empty States**

**As a** Shopper (Guest or Logged-In), **I want to** be able to clear my recently viewed history **So that** I have control over my browsing data and privacy.  
**Acceptance Criteria:**

> * **Given** I have items in my recently viewed list, **Then** I see a "Clear history" link near the section header.  
> * **Given** I click "Clear history", **When** I am a guest, **Then** my localStorage is cleared. **When** I am logged in, **Then** my server-side history is deleted.  
> * **Given** my history is cleared successfully, **Then** the entire Recently Viewed component (including the title) disappears from the UI immediately.  
> * **Given** I have exactly 0 items in my browsing history, **Then** the Recently Viewed section is completely hidden on both the Homepage and PDP.

**Estimated Effort:** **3 Story Points** *(Reasoning: Requires a new DELETE endpoint for logged-in users, local storage clearing logic, and frontend state management to immediately unmount/hide the Angular component.)*

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

### 

