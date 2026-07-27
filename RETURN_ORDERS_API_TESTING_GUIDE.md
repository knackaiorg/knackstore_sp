# Return Orders API - Testing Guide

## Overview

This guide provides comprehensive instructions for testing all Return Orders API endpoints using:
1. **Postman Collection** (GUI-based testing)
2. **Bash Test Script** (Command-line testing)
3. **Manual cURL Commands** (Individual endpoint testing)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Endpoints Overview](#api-endpoints-overview)
3. [Testing with Postman](#testing-with-postman)
4. [Testing with Bash Script](#testing-with-bash-script)
5. [Testing with cURL](#testing-with-curl)
6. [Return Reasons Reference](#return-reasons-reference)
7. [Item Condition Reference](#item-condition-reference)
8. [Test Scenarios](#test-scenarios)
9. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Quick Start

### Prerequisites
- Backend server running on `http://localhost:8080` (or your configured BASE_URL)
- Postman installed (optional, for GUI testing)
- cURL installed (usually pre-installed on macOS/Linux)
- jq installed for JSON processing (optional, but recommended)

### Option 1: Using Postman (Recommended for GUI Testing)

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `Return_Orders_API_Collection.postman_collection.json`
4. Configure environment variables:
   - `baseUrl`: http://localhost:8080
   - `customerEmail`: customer@example.com
   - `orderCode`: ORD-001
   - `returnCode`: (will be auto-populated after creating a return)
5. Click on individual requests and click **Send**

### Option 2: Using Bash Script (Automated Testing)

```bash
# Run with default settings
./test-return-orders-api.sh

# Run with custom base URL and email
./test-return-orders-api.sh http://localhost:8080 test@example.com
```

### Option 3: Using cURL (Manual Testing)

See the [Testing with cURL](#testing-with-curl) section below.

---

## API Endpoints Overview

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/return-orders/create` | Create a new return order |
| GET | `/api/return-orders/my-returns` | Get all returns for customer |
| GET | `/api/return-orders/{returnCode}` | Get specific return details |
| GET | `/api/return-orders/order/{orderCode}` | Get all returns for an order |

### Admin Endpoints - Return Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/return-orders/{returnCode}/process` | Approve/Reject return |
| PUT | `/api/return-orders/{returnCode}/mark-received` | Mark items as received |
| PUT | `/api/return-orders/{returnCode}/complete` | Complete return processing |

### Admin Endpoints - Refund Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/return-orders/admin/refund-eligible` | List returns eligible for refund |
| GET | `/api/return-orders/admin/refunded` | List refunded returns |
| POST | `/api/return-orders/admin/process-refunds` | Process all eligible refunds |
| POST | `/api/return-orders/{returnCode}/process-refund` | Process specific refund |

---

## Testing with Postman

### Import Collection

1. **Open Postman**
2. **Click "Import"** button (top-left)
3. **Select "Upload Files"** tab
4. **Choose** `Return_Orders_API_Collection.postman_collection.json`
5. **Click "Import"**

### Configure Environment

The collection includes default variables, but you can customize them:

1. **Click "Environments"** (left sidebar)
2. **Create new or edit existing environment**
3. **Set variables:**
   - `baseUrl`: `http://localhost:8080`
   - `customerEmail`: `customer@example.com`
   - `orderCode`: `ORD-001`
   - `returnCode`: Leave empty (will be auto-populated)

### Run Individual Tests

1. **Expand folder** (e.g., "Customer Endpoints")
2. **Click on a request** (e.g., "Create Return Order")
3. **Review the request details**
4. **Click "Send"**
5. **View response** in the Response panel below

### Run All Tests in Sequence

1. **Click "Runner"** (top-right)
2. **Select collection** "Return Orders API Collection"
3. **Select environment** (the one with your settings)
4. **Click "Run"**
5. View detailed results as tests execute

### Postman Test Scripts

Each endpoint includes JavaScript tests that:
- Validate HTTP status codes (200-299)
- Check response structure
- Extract values for use in subsequent requests (e.g., returnCode)
- Provide formatted console output

---

## Testing with Bash Script

### Run Default Test

```bash
./test-return-orders-api.sh
```

This runs all 15 test scenarios with:
- Base URL: `http://localhost:8080`
- Customer Email: `customer@example.com`

### Run with Custom Parameters

```bash
./test-return-orders-api.sh http://yourserver.com:8080 youremail@example.com
```

### Test Output

The script provides:
- Colored output (Green for pass, Red for fail)
- HTTP response codes
- Formatted JSON responses
- Test summary at the end

### What Tests Are Included

1. Create Full Return Order (DEFECT_PRODUCT)
2. Get All Return Orders
3. Get Specific Return Order
4. Get Returns for Order Code
5. Create Partial Return (NOT_AS_DESCRIBED)
6. Create Return (DAMAGED_IN_SHIPPING)
7. Process Return - Approve
8. Mark Items as Received
9. Complete Return
10. Create Return for Rejection Test
11. Process Return - Reject
12. Get Refund-Eligible Returns
13. Get Refunded Returns
14. Process Specific Refund
15. Process All Eligible Refunds

---

## Testing with cURL

### 1. Create a Return Order

```bash
curl -X POST http://localhost:8080/api/return-orders/create?email=customer@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "ORD-001",
    "returnType": "FULL",
    "returnReason": "DEFECT_PRODUCT",
    "returnTrackingNumber": "TRACK-123456789",
    "returnEntries": [
      {
        "orderEntryId": 1,
        "quantityToReturn": 1,
        "itemCondition": "UNOPENED",
        "notes": "Product arrived with defects"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Return order created successfully",
  "returnCode": "RET-001",
  "status": "PENDING",
  "estimatedRefund": 99.99
}
```

### 2. Get All My Returns

```bash
curl -X GET "http://localhost:8080/api/return-orders/my-returns?email=customer@example.com" \
  -H "Content-Type: application/json"
```

### 3. Get Specific Return Details

```bash
curl -X GET "http://localhost:8080/api/return-orders/RET-001?email=customer@example.com" \
  -H "Content-Type: application/json"
```

### 4. Get Returns for Specific Order

```bash
curl -X GET "http://localhost:8080/api/return-orders/order/ORD-001?email=customer@example.com" \
  -H "Content-Type: application/json"
```

### 5. Process Return (Approve)

```bash
curl -X PUT http://localhost:8080/api/return-orders/RET-001/process \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "adminNotes": "Return approved after inspection",
    "refundAmount": 99.99
  }'
```

### 6. Mark Items as Received

```bash
curl -X PUT http://localhost:8080/api/return-orders/RET-001/mark-received \
  -H "Content-Type: application/json" \
  -d '{
    "itemsReceived": true,
    "notes": "Items received and verified"
  }'
```

### 7. Complete Return

```bash
curl -X PUT http://localhost:8080/api/return-orders/RET-001/complete \
  -H "Content-Type: application/json"
```

### 8. Get Refund-Eligible Returns

```bash
curl -X GET http://localhost:8080/api/return-orders/admin/refund-eligible \
  -H "Content-Type: application/json"
```

### 9. Get Refunded Returns

```bash
curl -X GET http://localhost:8080/api/return-orders/admin/refunded \
  -H "Content-Type: application/json"
```

### 10. Process Specific Refund

```bash
curl -X POST http://localhost:8080/api/return-orders/RET-001/process-refund \
  -H "Content-Type: application/json"
```

### 11. Process All Eligible Refunds

```bash
curl -X POST http://localhost:8080/api/return-orders/admin/process-refunds \
  -H "Content-Type: application/json"
```

---

## Return Reasons Reference

The following return reasons can be used when creating a return order:

| Reason Code | Description | Auto-Complete | Notes |
|-------------|-------------|---|-------|
| `DEFECT_PRODUCT` | Product is defective | ✅ Yes | Auto-completes to COMPLETED status |
| `NOT_AS_DESCRIBED` | Item not as described | ❌ No | Requires admin approval |
| `CHANGED_MIND` | Customer changed mind | ❌ No | Requires admin approval |
| `NO_LONGER_NEEDED` | No longer needed | ❌ No | Requires admin approval |
| `WRONG_ITEM_RECEIVED` | Wrong item received | ❌ No | Requires admin approval |
| `DAMAGED_IN_SHIPPING` | Item damaged in shipping | ❌ No | Requires admin approval |
| `OTHER` | Other reason | ❌ No | Requires admin approval |

**Important:** When `returnReason` is `DEFECT_PRODUCT` and admin approves with status `APPROVED`, the system automatically:
- Changes status to `COMPLETED`
- Marks items as received
- Prepares for immediate refund processing

---

## Item Condition Reference

When specifying item conditions in return entries, use one of:

| Condition | Description |
|-----------|-------------|
| `UNOPENED` | Item in original sealed packaging |
| `OPENED` | Item opened but not used |
| `USED` | Item used but in good condition |
| `DAMAGED` | Item damaged (defective or shipping damage) |
| `OTHER` | Other condition |

---

## Test Scenarios

### Scenario 1: Full Return - Defective Product (Auto-Complete)

This scenario demonstrates the special auto-complete logic for defective products.

**Steps:**
1. Customer creates return with `returnReason: "DEFECT_PRODUCT"`
2. Admin processes with `status: "APPROVED"`
3. System automatically:
   - Changes status to `COMPLETED`
   - Marks items as received
   - Prepares for refund

**cURL Commands:**
```bash
# Step 1: Create return
RETURN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/return-orders/create?email=customer@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "ORD-001",
    "returnType": "FULL",
    "returnReason": "DEFECT_PRODUCT",
    "returnEntries": [
      {
        "orderEntryId": 1,
        "quantityToReturn": 1,
        "itemCondition": "UNOPENED",
        "notes": "Product is defective"
      }
    ]
  }')

RETURN_CODE=$(echo $RETURN_RESPONSE | jq -r '.returnCode')
echo "Return Code: $RETURN_CODE"

# Step 2: Admin approves
curl -X PUT http://localhost:8080/api/return-orders/$RETURN_CODE/process \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "adminNotes": "Defective product - auto-approved"
  }'

# Step 3: Check status (should be COMPLETED)
curl -X GET http://localhost:8080/api/return-orders/$RETURN_CODE?email=customer@example.com
```

### Scenario 2: Partial Return - Not as Described

This scenario demonstrates creating and processing a partial return.

**Steps:**
1. Customer creates partial return with multiple items
2. Admin marks as received after inspection
3. Admin completes and processes refund

**cURL Commands:**
```bash
# Create partial return
RETURN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/return-orders/create?email=customer@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "ORD-002",
    "returnType": "PARTIAL",
    "returnReason": "NOT_AS_DESCRIBED",
    "returnEntries": [
      {
        "orderEntryId": 2,
        "quantityToReturn": 2,
        "itemCondition": "OPENED",
        "notes": "Color does not match description"
      },
      {
        "orderEntryId": 3,
        "quantityToReturn": 1,
        "itemCondition": "UNOPENED",
        "notes": "Wrong size received"
      }
    ]
  }')

RETURN_CODE=$(echo $RETURN_RESPONSE | jq -r '.returnCode')

# Admin processes return
curl -X PUT http://localhost:8080/api/return-orders/$RETURN_CODE/process \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "adminNotes": "Items verified - not as described"
  }'

# Mark items as received
curl -X PUT http://localhost:8080/api/return-orders/$RETURN_CODE/mark-received \
  -H "Content-Type: application/json" \
  -d '{
    "itemsReceived": true,
    "notes": "All items received and verified"
  }'

# Complete return
curl -X PUT http://localhost:8080/api/return-orders/$RETURN_CODE/complete

# Process refund
curl -X POST http://localhost:8080/api/return-orders/$RETURN_CODE/process-refund
```

### Scenario 3: Return Rejection

This scenario demonstrates rejecting a return request.

**Steps:**
1. Customer creates return
2. Admin rejects with explanation

```bash
# Create return
RETURN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/return-orders/create?email=customer@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "ORD-003",
    "returnType": "FULL",
    "returnReason": "CHANGED_MIND",
    "returnEntries": [
      {
        "orderEntryId": 4,
        "quantityToReturn": 1,
        "itemCondition": "UNOPENED"
      }
    ]
  }')

RETURN_CODE=$(echo $RETURN_RESPONSE | jq -r '.returnCode')

# Admin rejects
curl -X PUT http://localhost:8080/api/return-orders/$RETURN_CODE/process \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "adminNotes": "Return window expired - cannot process change of mind returns after 30 days"
  }'
```

### Scenario 4: Batch Refund Processing

This scenario demonstrates processing refunds for all eligible returns.

```bash
# Get eligible returns
curl -X GET http://localhost:8080/api/return-orders/admin/refund-eligible

# Process all eligible refunds
curl -X POST http://localhost:8080/api/return-orders/admin/process-refunds

# Verify refunded returns
curl -X GET http://localhost:8080/api/return-orders/admin/refunded
```

---

## Common Issues & Troubleshooting

### Issue 1: Connection Refused

**Error:** `curl: (7) Failed to connect to localhost port 8080: Connection refused`

**Solution:**
- Ensure backend server is running
- Check backend logs: `tail -f backend.log`
- Verify correct port in BASE_URL
- Check firewall settings

### Issue 2: JSON Parse Errors

**Error:** `parse error: Invalid numeric literal`

**Solution:**
- Ensure all JSON is properly formatted
- Use jq to validate JSON: `echo '{...}' | jq .`
- Check for missing commas or quotes in request body

### Issue 3: 400 Bad Request

**Error:** HTTP 400 response

**Solution:**
- Verify all required fields are present
- Check parameter types (e.g., string vs number)
- Validate against DTO structure
- Check request content-type header

### Issue 4: 404 Not Found

**Error:** HTTP 404 response

**Solution:**
- Verify endpoint path spelling
- Check if returnCode exists
- Ensure baseUrl is correct
- Check API controller is deployed

### Issue 5: 401 Unauthorized

**Error:** HTTP 401 response

**Solution:**
- Add authentication headers if required
- Check customer email parameter
- Verify admin permissions for admin endpoints

### Issue 6: Test Script Fails to Execute

**Error:** `Permission denied: ./test-return-orders-api.sh`

**Solution:**
```bash
chmod +x test-return-orders-api.sh
./test-return-orders-api.sh
```

---

## Additional Resources

- **Postman Documentation:** https://learning.postman.com/
- **cURL Documentation:** https://curl.se/docs/
- **REST API Best Practices:** https://restfulapi.net/
- **JSON Reference:** https://www.json.org/

---

## Support

For issues or questions regarding the Return Orders API:
1. Check logs: `tail -f backend.log`
2. Review controller code: `ReturnOrderController.java`
3. Check service implementation: `ReturnOrderService.java`
4. Verify database state: Check return_order table
5. Contact the development team

---

**Last Updated:** July 24, 2026
**Version:** 1.0

