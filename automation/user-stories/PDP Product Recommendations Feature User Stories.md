# **User Stories — Product Recommendations on PDP**

**Feature:**  Product Recommendations on PDP   
**Format:** Given / When / Then acceptance criteria   
**Story Point Scale:** Fibonacci (1, 2, 3, 5, 8\) — relative effort   
**Priority Scale:** P0 (blocker/foundation) → P3 (nice-to-have)

**US-1: Show "frequently bought together" recommendations on PDP**  
**Maps to:** BR-002, BR-004   
**As a** customer (guest or logged-in) **I want** to see products that are actually bought together with the item I'm viewing (e.g., laptop \-\> mouse, keyboard, bag) **So that** I discover genuinely relevant add-ons instead of generic similar items  
**Priority:** P0   
**Story Points:** 5   
**Dependencies:** US-1 (precomputed pairing data must exist)

**Acceptance Criteria:**

- **Given** a product has 3 or more co-purchased products in the precomputed data  
    
- **When** its PDP is rendered  
    
- **Then** the top 3 products by co-purchase frequency are shown, and no same-category-only product is shown ahead of a co-purchase-based one  
    
- **Given** a co-purchased product returned by the lookup is out of stock or discontinued  
    
- **When** recommendations are assembled  
    
- **Then** it is excluded from the results (open question \- confirm handling with team; flagged in FSD)  
    
- **Given** the viewed product itself would qualify as its own recommendation (e.g., via a variant)  
    
- **When** recommendations are assembled  
    
- **Then** the viewed product is excluded from its own recommendation list  
    
- **Given** duplicate products could qualify via multiple signals  
    
- **When** the final recommendation list is built  
    
- **Then** each product appears only once (deduplicated)

**US-2: Display recommendation section on PDP**  
**Maps to:** BR-001, BR-004, BR-005, BR-006, BR-008   
**As a** customer (guest or logged-in) **I want** to see a clearly presented recommendations section on the product page **So that** I can easily browse and act on suggested products  
**Priority:** P1   
**Story Points:** 3   
**Dependencies:** US-2, US-3 (needs a data source to render)

**Acceptance Criteria:**

- **Given** I am viewing any product detail page  
    
- **When** the page loads  
    
- **Then** I see a "Frequently Bought Together" (or similar) section positioned below the product description, near the reviews section \- not above the fold  
    
- **Given** the recommendation section is displayed  
    
- **When** I view each recommended product card  
    
- **Then** it shows the same image, name, price, and rating format used on the product listing page, for visual consistency  
    
- **Given** I am browsing as a guest or as a logged-in customer  
    
- **When** I view a PDP  
    
- **Then** the recommendation section behaves identically for both \- no login required

