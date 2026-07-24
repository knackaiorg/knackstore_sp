#!/bin/bash

# Return Orders API Test Script
# This script tests all the Return Orders APIs
# Usage: ./test-return-orders-api.sh [base_url] [customer_email]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${1:-http://localhost:8080}"
CUSTOMER_EMAIL="${2:-customer@example.com}"
ORDER_CODE="ORD-001"
RETURN_CODE=""
ADMIN_NOTES="Test admin notes"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test headers
print_test_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Helper function to make API calls and display results
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "\n${YELLOW}Test $TESTS_RUN: $description${NC}"
    echo "Method: $method"
    echo "URL: $BASE_URL$endpoint"

    if [ ! -z "$data" ]; then
        echo "Data: $data"
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    echo "Response Code: $http_code"
    echo "Response Body:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"

    if [[ "$http_code" =~ ^[2]([0-9]{2})$ ]]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# ============================================
# CUSTOMER ENDPOINTS
# ============================================

print_test_header "CUSTOMER ENDPOINTS - TESTING RETURN ORDER CREATION AND RETRIEVAL"

# Test 1: Create a Full Return Order
make_request "POST" "/api/return-orders/create?email=$CUSTOMER_EMAIL" \
'{
  "orderCode": "'$ORDER_CODE'",
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
}' \
"Create Full Return Order (DEFECT_PRODUCT - should auto-complete)"

# Extract return code from response for subsequent tests
RETURN_CODE=$(echo "$body" | jq -r '.returnCode' 2>/dev/null || echo "RET-TEST-001")
echo "Extracted Return Code: $RETURN_CODE"

# Test 2: Get My Return Orders
make_request "GET" "/api/return-orders/my-returns?email=$CUSTOMER_EMAIL" \
"" \
"Get All Return Orders for Customer"

# Test 3: Get Specific Return Order Details
make_request "GET" "/api/return-orders/$RETURN_CODE?email=$CUSTOMER_EMAIL" \
"" \
"Get Return Order Details"

# Test 4: Get Return Orders for Specific Order
make_request "GET" "/api/return-orders/order/$ORDER_CODE?email=$CUSTOMER_EMAIL" \
"" \
"Get All Return Orders for Specific Order Code"

# Test 5: Create a Partial Return Order with Different Reason
make_request "POST" "/api/return-orders/create?email=$CUSTOMER_EMAIL" \
'{
  "orderCode": "ORD-002",
  "returnType": "PARTIAL",
  "returnReason": "NOT_AS_DESCRIBED",
  "returnTrackingNumber": "TRACK-987654321",
  "returnEntries": [
    {
      "orderEntryId": 2,
      "quantityToReturn": 2,
      "itemCondition": "OPENED",
      "notes": "Item does not match description"
    },
    {
      "orderEntryId": 3,
      "quantityToReturn": 1,
      "itemCondition": "UNOPENED",
      "notes": "Wrong item received"
    }
  ]
}' \
"Create Partial Return Order (NOT_AS_DESCRIBED)"

# Test 6: Create Return Order with Other Reason
make_request "POST" "/api/return-orders/create?email=$CUSTOMER_EMAIL" \
'{
  "orderCode": "ORD-003",
  "returnType": "FULL",
  "returnReason": "DAMAGED_IN_SHIPPING",
  "returnEntries": [
    {
      "orderEntryId": 4,
      "quantityToReturn": 1,
      "itemCondition": "DAMAGED",
      "notes": "Package was damaged during shipping"
    }
  ]
}' \
"Create Return Order with DAMAGED_IN_SHIPPING Reason"

# ============================================
# ADMIN ENDPOINTS - RETURN PROCESSING
# ============================================

print_test_header "ADMIN ENDPOINTS - RETURN PROCESSING"

# Test 7: Process Return - Approve
make_request "PUT" "/api/return-orders/$RETURN_CODE/process" \
'{
  "status": "APPROVED",
  "adminNotes": "Return approved after inspection - item is indeed defective",
  "refundAmount": 99.99
}' \
"Process Return Order - APPROVE"

# Test 8: Mark Items as Received
make_request "PUT" "/api/return-orders/$RETURN_CODE/mark-received" \
'{
  "itemsReceived": true,
  "notes": "Items received and inspected - condition verified"
}' \
"Mark Returned Items as Received"

# Test 9: Complete Return
make_request "PUT" "/api/return-orders/$RETURN_CODE/complete" \
"" \
"Complete Return Order"

# Test 10: Create Another Return for Processing Test
RETURN_CODE_2=$(date +%s)
make_request "POST" "/api/return-orders/create?email=$CUSTOMER_EMAIL" \
'{
  "orderCode": "ORD-004",
  "returnType": "FULL",
  "returnReason": "CHANGED_MIND",
  "returnEntries": [
    {
      "orderEntryId": 5,
      "quantityToReturn": 1,
      "itemCondition": "UNOPENED",
      "notes": "Changed my mind about the purchase"
    }
  ]
}' \
"Create Return Order for Admin Processing Test"

RETURN_CODE_2=$(echo "$body" | jq -r '.returnCode' 2>/dev/null || echo "RET-TEST-002")

# Test 11: Process Return - Reject
make_request "PUT" "/api/return-orders/$RETURN_CODE_2/process" \
'{
  "status": "REJECTED",
  "adminNotes": "Return rejected - changed mind returns not eligible after 30 days"
}' \
"Process Return Order - REJECT"

# ============================================
# ADMIN ENDPOINTS - REFUND MANAGEMENT
# ============================================

print_test_header "ADMIN ENDPOINTS - REFUND MANAGEMENT"

# Test 12: Get Refund-Eligible Returns
make_request "GET" "/api/return-orders/admin/refund-eligible" \
"" \
"Get Refund-Eligible Return Orders"

# Test 13: Get Refunded Returns
make_request "GET" "/api/return-orders/admin/refunded" \
"" \
"Get All Refunded Return Orders"

# Test 14: Process Refund for Specific Return
make_request "POST" "/api/return-orders/$RETURN_CODE/process-refund" \
"" \
"Process Refund for Specific Return Order"

# Test 15: Process Refunds for All Eligible Returns
make_request "POST" "/api/return-orders/admin/process-refunds" \
"" \
"Process Refunds for All Eligible Return Orders"

# ============================================
# TEST SUMMARY
# ============================================

print_test_header "TEST SUMMARY"

echo -e "Total Tests Run: ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi

