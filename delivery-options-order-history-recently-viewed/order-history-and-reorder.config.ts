export class TestConfig {
  appURL = "http://localhost:4200/"
  loginURL = "http://localhost:4200/login"
  checkoutURL = "http://localhost:4200/checkout"
  myOrdersURL = "http://localhost:4200/account/orders"
  username = "demo@knack.com"
  password = "Demo@1234"

  // TC-001: Expected order list columns
  expectedOrderListColumns = ['Order Reference Number', 'Order Date', 'Order Total', 'Order Status', 'Item Summary']

  // TC-005: Filter status options
  filterStatusAll = 'All'
  filterStatusPending = 'PENDING'
  filterStatusConfirmed = 'CONFIRMED'
  filterStatusShipped = 'SHIPPED'
  filterStatusDelivered = 'DELIVERED'

  // TC-010: Empty state message
  emptyStateMessage = "You haven't placed any orders yet"

  // TC-008: Unavailable items notification
  unavailableItemsMessage = 'One or more items were not added because they are no longer available'

  // TC-009: No items added notification
  noItemsAddedMessage = 'No items could be added'

  // TC-001: Minimum expected order count for test user
  minimumOrderCount = 1
}

