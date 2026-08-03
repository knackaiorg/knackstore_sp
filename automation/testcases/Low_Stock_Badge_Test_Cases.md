I need to extract the text from the `.docx` file to understand the user story. Let me unpack it.

Ran terminal command: $src = 'c:\Users\Vaishaks\git\Project-Low-Budget\Prompts\Low stock badge User story.docx'
$zip = 'c:\Users\Vaishaks\git\Project-Low-Budget\Prompts_tmp.zip'
$out = 'c:\Users\Vaishaks\git\Project-Low-Budget\Prompts\_tmp_extract'
Copy-Item $src $zip -Force
if(Test-Path $out){Remove-Item $out -Recurse -Force}
Expand-Archive $zip $out -Force
[xml]$xml = Get-Content "$out\word\document.xml"
$ns = @{w='http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
$xml.SelectNodes('//w:p', $ns) | ForEach-Object {
$_.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }
} | Out-String

Ran terminal command: [xml]$xml = Get-Content 'c:\Users\Vaishaks\git\Project-Low-Budget\Prompts\_tmp_extract\word\document.xml'
$nsmgr = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$nsmgr.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $xml.SelectNodes('//w:p', $nsmgr)
foreach($p in $paragraphs){
  $line = ''
  $runs = $p.SelectNodes('.//w:t', $nsmgr)
  foreach($r in $runs){ $line += $r.InnerText }
  if($line.Trim()){ Write-Output $line }
}

Ran terminal command: $xmlContent = [xml](Get-Content 'c:\Users\Vaishaks\git\Project-Low-Budget\Prompts\_tmp_extract\word\document.xml' -Raw)
$nsmgr = New-Object System.Xml.XmlNamespaceManager($xmlContent.NameTable)
$nsmgr.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $xmlContent.SelectNodes('//w:p', $nsmgr)
$output = @()
foreach($p in $paragraphs){
  $line = ''
  $runs = $p.SelectNodes('.//w:t', $nsmgr)
  foreach($r in $runs){ $line += $r.InnerText }
  if($line.Trim() -ne ''){ $output += $line }
}
$output -join "`n"

The terminal output seems truncated. Let me try a different approach:

Ran terminal command: $xmlContent = [xml](Get-Content 'c:\Users\Vaishaks\git\Project-Low-Budget\Prompts\_tmp_extract\word\document.xml' -Raw); $nsmgr = New-Object System.Xml.XmlNamespaceManager($xmlContent.NameTable); $nsmgr.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main'); $paragraphs = $xmlContent.SelectNodes('//w:p', $nsmgr); $result = ''; foreach($p in $paragraphs){ $line = ''; $runs = $p.SelectNodes('.//w:t', $nsmgr); foreach($r in $runs){ $line += $r.InnerText }; if($line.Trim()){ $result += $line + "`n" } }; $result | Out-File 'c:\Users\Vaishaks\git\Project-Low-Budget\Prompts_extracted_story.txt' -Encoding utf8; Write-Output 'Done'

Read [](file:///c%3A/Users/Vaishaks/git/Project-Low-Budget/Prompts/_extracted_story.txt)

Now I have the full user story. Let me generate the Automation Scoping & Test Plan Matrix with 10 test cases (7 happy paths, 3 negative paths), with the top 4 critical ones first (3 happy + 1 negative).

Created 1 todo

Now I have all the context needed. Here is the complete **Automation Scoping & Test Plan Matrix** based on the "Low Stock Badge" user story:

---

# Automation Scoping & Test Plan Matrix — Low Stock Badge

## INPUT DATA

### 1. User Story / Acceptance Criteria

**Title:** Display Low Stock Badge on Product Listing Page and Product Detail Page  
**URL Under Test:** `http://localhost:4200/products/1`

**Acceptance Criteria Summary:**

- AC1: Badge triggers when available qty ≤ 10
- AC2: Badge placement on PLP (product card) and PDP (near Add to Cart)
- AC3: Badge colour changes by stock level (10=default, 4–9=orange, 1–3=red, 0=Out of Stock)
- AC4: Variant-level evaluation (badge reflects selected variant's stock, dynamic update)
- AC5: Stock reservation (15-min hold, race-condition handling, restock on timeout)

### 2. Technical Context & Constraints

- **Application Type:** Web UI (Angular, localhost:4200)
- **Known Automation Blockers:** Race-condition scenario (AC5 – two simultaneous purchases) may require parallel browser sessions or API-level seeding; real-time stock updates may need backend/API test data hooks.

---

## Section 1: Automation Scoping Matrix

> **Top 4 Critical (3 Happy + 1 Negative) listed first**, then remaining tests.

| Test ID   | Scenario Description                                                                                   | Priority | Automation Scoped | Test Type | Automation Feasibility Reason                                                                                                    |
| :-------- | :----------------------------------------------------------------------------------------------------- | :------- | :---------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **TC-01** | **PDP – "Only [X] left in stock" badge displays when product qty is between 1–10**                     | Critical | YES               | Positive  | Core AC1 requirement; deterministic – seed product with known qty via API/DB, assert badge text contains exact number.           |
| **TC-02** | **PDP – Badge colour is Orange when qty is 4–9 units**                                                 | Critical | YES               | Positive  | AC3 colour rule; verify computed CSS (`color`/`background-color`) on the badge element after seeding qty=5.                      |
| **TC-03** | **PDP – Badge colour is Red when qty is 1–3 units**                                                    | Critical | YES               | Positive  | AC3 colour rule; same technique as TC-02 with qty=2; high business impact (urgency signal).                                      |
| **TC-04** | **PDP – "Out of Stock" label shown and Add to Cart disabled when qty = 0 (no Low Stock badge)**        | Critical | YES               | Negative  | AC3 zero-stock rule; assert badge is NOT present, "Out of Stock" label visible, and cart button is disabled/hidden.              |
| TC-05     | PLP – Low Stock badge visible on product card when qty ≤ 10                                            | High     | YES               | Positive  | AC2 PLP placement; navigate to listing page, verify badge element on the product tile.                                           |
| TC-06     | PDP – Badge updates dynamically when user switches product variant                                     | High     | YES               | Positive  | AC4 variant-level; select variant with different stock, assert badge text updates without page reload (no navigation event).     |
| TC-07     | PDP – Badge shows default text colour (no warning) when qty = 10                                       | High     | YES               | Positive  | AC3 boundary; seed product qty exactly 10, verify no orange/red styling applied.                                                 |
| TC-08     | PDP – Badge does NOT display when qty > 10 (e.g., 11+)                                                 | Medium   | YES               | Negative  | Boundary negative for AC1; product with qty=15 should show no badge element at all.                                              |
| TC-09     | PDP – Stock reservation timeout releases hold and restocks product after 15 min                        | Medium   | YES               | Positive  | AC5 reservation timeout; add to cart, wait/simulate timeout (mock timer or API call), verify badge re-appears with restored qty. |
| TC-10     | PDP – Second customer receives "Product is out of stock" when last unit is already reserved by another | Medium   | YES               | Negative  | AC5 race condition; use two browser contexts – first adds last unit to cart, second attempts purchase and asserts error message. |

---

## Section 2: Automation Execution Strategy

### High-Value Targets (Top 3 for immediate ROI)

1. **TC-01** – Validates the fundamental badge trigger logic. If this fails, the entire feature is broken.
2. **TC-03** – Red badge (1–3 units) is the highest-urgency visual signal; incorrect colour undermines purchase intent.
3. **TC-04** – Zero-stock must block purchase; failure here causes order failures and customer complaints.

### Manual / Out-of-Scope Rationale

All 10 scenarios are scoped for automation (`YES`). However, the following considerations apply:

| Scenario               | Risk/Note                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-09 (15-min timeout) | Real wall-clock wait is impractical; requires **API/time-travel mock** to simulate expiry. If no backend hook exists, defer to manual until API support is available.  |
| TC-10 (race condition) | Requires **parallel browser contexts** and precise timing. Feasible with Playwright's multi-context support, but may be flaky without deterministic stock-seeding API. |

### Prerequisites & Test Data Requirements

| Requirement                   | Details                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Stock-seeding API/DB hook** | Must be able to set a product's available quantity to a specific value (0, 2, 5, 10, 15) before each test.     |
| **Product with variants**     | At least one product (e.g., product ID 1) must have ≥ 2 variants with independently configurable stock levels. |
| **User role**                 | Standard customer account (no admin privileges needed for test execution).                                     |
| **Environment**               | `http://localhost:4200` running with backend connected; stock data must be resettable between tests.           |
| **Parallel context support**  | TC-10 requires two authenticated browser sessions; Playwright `browser.newContext()` is sufficient.            |

---

_No code generated — this deliverable is strictly an automation scoping and test planning artifact per the prompt constraints._

Completed: _Generate automation test plan matrix_ (1/1)

The matrix is complete — 10 test cases (7 happy, 3 negative), with the top 4 critical scenarios (TC-01 through TC-04: 3 happy + 1 negative) prioritized first. Would you like me to save this as a markdown file in your Prompts folder?
