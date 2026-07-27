import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, AddEntryRequest, ReturnOrder, CreateReturnOrderRequest } from '../../models';
import { OrderService } from '../../core/services/order.service';
import { ReturnOrderService } from '../../core/services/return-order.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  returnOrders: ReturnOrder[] = [];
  filteredReturnOrders: ReturnOrder[] = [];
  
  loading = true;
  reorderingId: string | null = null;
  expandedReturnOrderId: string | null = null;

  // Modal state for return flow
  returnModalOrder: Order | null = null;
  selectedReturnItemsInModal: Set<number> = new Set(); // set of entry indices
  selectedReturnReasonsInModal: Map<number, string> = new Map(); // entryIndex -> reason
  returnModalError: string | null = null; // error message in modal
  returnModalSuccess: string | null = null; // success message in modal

  activeTab: 'orders' | 'returns' = 'orders';

  statusOptions: string[] = ['All', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  selectedStatus: string = 'All';

  returnReasonOptions: string[] = [
    'DEFECT_PRODUCT',
    'NOT_AS_DESCRIBED',
    'CHANGED_MIND',
    'NO_LONGER_NEEDED',
    'WRONG_ITEM_RECEIVED',
    'DAMAGED_IN_SHIPPING',
    'OTHER'
  ];

  refundStatusOptions: string[] = ['All', 'PENDING', 'APPROVED', 'SHIPPED', 'COMPLETED', 'REJECTED'];
  selectedRefundStatus: string = 'All';

  returnStatusOptions: string[] = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
  selectedReturnStatus: string = 'All';

  constructor(
    private orderService: OrderService,
    private returnOrderService: ReturnOrderService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadReturnOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe(o => {
      this.orders = o;
      this.applyFilter();
    });
  }

  loadReturnOrders(): void {
    this.returnOrderService.getReturnOrders().subscribe(
      (orders) => {
        this.returnOrders = orders;
        this.applyReturnOrderFilter();
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching return orders', error);
        this.loading = false;
      }
    );
  }

  onTabChange(tab: 'orders' | 'returns'): void {
    this.activeTab = tab;
  }

  onStatusFilterChange(): void {
    this.applyFilter();
  }

  onRefundStatusFilterChange(): void {
    this.applyReturnOrderFilter();
  }

  onReturnStatusFilterChange(): void {
    this.applyReturnOrderFilter();
  }

  private applyFilter(): void {
    this.filteredOrders =
      this.selectedStatus === 'All'
        ? this.orders
        : this.orders.filter(order => order.status === this.selectedStatus);
  }

  private applyReturnOrderFilter(): void {
    this.filteredReturnOrders =
      this.selectedReturnStatus === 'All'
        ? this.returnOrders
        : this.returnOrders.filter(order => order.status === this.selectedReturnStatus);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'status-badge status-pending',
      CONFIRMED: 'status-badge status-processing',
      PROCESSING: 'status-badge status-processing',
      PACKED: 'status-badge status-packed',
      SHIPPED: 'status-badge status-shipped',
      OUT_FOR_DELIVERY: 'status-badge status-out-for-delivery',
      DELIVERED: 'status-badge status-delivered',
      RETURN_REQUESTED: 'status-badge status-return-requested',
      RETURNED: 'status-badge status-returned',
      REFUND_PROCESSING: 'status-badge status-refund-processing',
      REFUNDED: 'status-badge status-refunded',
      CANCELLED: 'status-badge status-cancelled',
      FAILED_PAYMENT: 'status-badge status-failed-payment',
    };
    return statusMap[status] || 'status-badge status-default';
  }

  getRefundStatusClass(status: string): string {
    return {
      PENDING: 'bg-warning',
      APPROVED: 'bg-info',
      SHIPPED: 'bg-primary',
      COMPLETED: 'bg-success',
      REJECTED: 'bg-danger',
    }[status] || 'bg-secondary';
  }

  getReturnStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'status-badge status-pending',
      APPROVED: 'status-badge status-processing',
      REJECTED: 'status-badge status-cancelled',
      COMPLETED: 'status-badge status-delivered',
    };
    return statusMap[status] || 'status-badge status-default';
  }

  getItemConditionClass(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      UNOPENED: 'condition-badge condition-unopened',
      OPENED: 'condition-badge condition-opened',
      DEFECTIVE: 'condition-badge condition-defective',
    };
    return conditionMap[condition] || 'condition-badge condition-default';
  }

  getItemSummary(order: Order): string {
    const entries = order.entries;
    if (!entries || entries.length === 0) {
      return '-';
    }
    const firstItemName = entries[0].productName;
    const remaining = entries.length - 1;
    return remaining > 0 ? `${firstItemName} +${remaining} more` : firstItemName;
  }

  toggleReturnOrderDetails(returnCode: string): void {
    this.expandedReturnOrderId = this.expandedReturnOrderId === returnCode ? null : returnCode;
  }

  isReturnOrderExpanded(returnCode: string): boolean {
    return this.expandedReturnOrderId === returnCode;
  }

  onReorder(order: Order): void {
    this.reorderingId = order.orderCode;

    this.cartService.reorder(order.orderCode).subscribe({
      next: () => {
        this.reorderingId = null;
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error('Reorder failed', err);
        this.reorderingId = null;
      }
    });
  }

  calculateReturnOrderSubtotal(returnOrder: ReturnOrder): number {
    return returnOrder.returnEntries.reduce((sum, item) => sum + item.refundAmount, 0);
  }

  // Navigate to order details page
  viewDetails(orderCode: string): void {
    this.router.navigate(['/account/orders', orderCode]);
  }

  // Open return modal for the selected order
  openReturnModal(order: Order): void {
    if (order.status === 'RETURN_REQUESTED') {
      return; // Cannot return if already requested
    }
    this.returnModalOrder = order;
    this.selectedReturnItemsInModal.clear();
    this.selectedReturnReasonsInModal.clear();
    this.returnModalError = null;
    this.returnModalSuccess = null;
  }

  // Close return modal without saving
  closeReturnModal(): void {
    this.returnModalOrder = null;
    this.selectedReturnItemsInModal.clear();
    this.selectedReturnReasonsInModal.clear();
    this.returnModalError = null;
    this.returnModalSuccess = null;
  }

  // Toggle item selection in modal
  toggleReturnItemInModal(entryIndex: number): void {
    if (this.selectedReturnItemsInModal.has(entryIndex)) {
      this.selectedReturnItemsInModal.delete(entryIndex);
      this.selectedReturnReasonsInModal.delete(entryIndex);
    } else {
      this.selectedReturnItemsInModal.add(entryIndex);
    }
  }

  // Check if item is selected in modal
  isReturnItemSelectedInModal(entryIndex: number): boolean {
    return this.selectedReturnItemsInModal.has(entryIndex);
  }

  // Set return reason in modal
  setReturnReasonInModal(entryIndex: number, reason: string): void {
    this.selectedReturnReasonsInModal.set(entryIndex, reason);
  }

  // Get return reason from modal
  getReturnReasonInModal(entryIndex: number): string {
    return this.selectedReturnReasonsInModal.get(entryIndex) || '';
  }

  // Get the count of selected items for button label
  getReturnButtonLabel(): string {
    const count = this.selectedReturnItemsInModal.size;
    if (!this.returnModalOrder) return '';
    const totalItems = this.returnModalOrder.entries.length;
    if (count === totalItems && totalItems > 0) {
      return 'Return All';
    }
    return count > 0 ? `Return (${count})` : 'Return';
  }

  // Check if return button should be enabled
  isReturnButtonEnabled(): boolean {
    return this.selectedReturnItemsInModal.size > 0;
  }

  onCreateReturnOrder(): void {
    this.returnModalError = null; // Clear any previous errors
    this.returnModalSuccess = null;

    if (!this.returnModalOrder || this.selectedReturnItemsInModal.size === 0) {
      this.returnModalError = 'Please select at least one item to return';
      return;
    }

    // Validate that all selected items have a return reason
    for (const entryIndex of Array.from(this.selectedReturnItemsInModal)) {
      const reason = this.getReturnReasonInModal(entryIndex);
      if (!reason) {
        const entry = this.returnModalOrder.entries[entryIndex];
        this.returnModalError = `Please select a return reason for ${entry.productName}`;
        return;
      }
    }

    // Build return entries from selected items
    const returnEntries = Array.from(this.selectedReturnItemsInModal).map((entryIndex) => {
      const entry = this.returnModalOrder!.entries[entryIndex];
      const reason = this.getReturnReasonInModal(entryIndex);

      return {
        orderEntryId: entryIndex + 1,
        quantityToReturn: entry.quantity,
        itemCondition: 'UNOPENED',
        notes: ''
      };
    });

    // Get the primary return reason from the first selected item
    const firstIndex = Array.from(this.selectedReturnItemsInModal)[0];
    const returnReason = this.getReturnReasonInModal(firstIndex);

    // Build the create return order request
    const createReturnRequest = {
      orderCode: this.returnModalOrder.orderCode,
      returnType: 'PARTIAL',
      returnReason: returnReason,
      returnTrackingNumber: '',
      returnEntries: returnEntries
    };

    // Call the service to create the return order
    this.returnOrderService.createReturnOrder(createReturnRequest).subscribe({
      next: (response) => {
        this.returnModalSuccess = `Return order created successfully! Return Code: ${response.returnCode}`;
        // Reload the return orders list
        this.loadReturnOrders();
        // Close the modal after a short delay to show success message
        setTimeout(() => {
          this.closeReturnModal();
        }, 2000);
      },
      error: (err) => {
        console.error('Failed to create return order:', err);
        this.returnModalError = 'Failed to create return order. Please try again.';
      }
    });
  }

  calculateOrderSubtotal(order: Order): number {
    return order.entries.reduce((sum, item) => sum + item.totalPrice, 0);
  }
}