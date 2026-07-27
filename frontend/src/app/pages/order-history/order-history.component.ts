import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CancelOrderRequest, Order } from '../../models';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  reorderingId: string | null = null;
  cancellingId: string | null = null;

  showCancelDialog = false;
  selectedCancelReason = '';
  otherCancelReason = '';
  cancelReasonError = '';
  orderToCancel: Order | null = null;

  cancelReasonOptions: Array<{ label: string; value: string }> = [
    { label: 'Changed my mind', value: 'Changed my mind' },
    { label: 'Found a better price elsewhere', value: 'Found a better price elsewhere' },
    { label: 'Delivery takes too long', value: 'Delivery takes too long' },
    { label: 'Ordered by mistake', value: 'Ordered by mistake' },
    { label: 'Other', value: 'OTHER' }
  ];

  statusOptions: string[] = ['All', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  selectedStatus: string = 'All';

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.orderService.getOrders().subscribe(o => {
      this.orders = o;
      this.applyFilter();
      this.loading = false;
    });
  }

  canCancelOrder(order: Order): boolean {
    const normalizedStatus = (order.status || '').toUpperCase();
    return normalizedStatus === 'PENDING' || normalizedStatus === 'CONFIRMED';
  }

  openCancelDialog(order: Order): void {
    this.orderToCancel = order;
    this.selectedCancelReason = '';
    this.otherCancelReason = '';
    this.cancelReasonError = '';
    this.showCancelDialog = true;
  }

  closeCancelDialog(): void {
    if (this.cancellingId) {
      return;
    }

    this.showCancelDialog = false;
    this.orderToCancel = null;
    this.selectedCancelReason = '';
    this.otherCancelReason = '';
    this.cancelReasonError = '';
  }

  onCancelReasonOptionChange(): void {
    if (this.cancelReasonError) {
      this.cancelReasonError = '';
    }
  }

  submitCancelOrder(): void {
    if (!this.orderToCancel) {
      return;
    }

    if (!this.selectedCancelReason) {
      this.cancelReasonError = 'Please select a cancellation reason.';
      return;
    }

    const trimmedOtherReason = this.otherCancelReason.trim();
    if (this.selectedCancelReason === 'OTHER' && trimmedOtherReason.length < 5) {
      this.cancelReasonError = 'Please enter at least 5 characters for "Other" reason.';
      return;
    }

    const payload: CancelOrderRequest = {
      reason: this.selectedCancelReason === 'OTHER' ? trimmedOtherReason : this.selectedCancelReason
    };
    const orderCode = this.orderToCancel.orderCode;
    this.cancellingId = orderCode;
    this.cancelReasonError = '';

    this.orderService.cancelOrder(orderCode, payload).subscribe({
      next: (updatedOrder) => {
        this.orders = this.orders.map(order => {
          if (order.orderCode !== orderCode) {
            return order;
          }

          return {
            ...order,
            status: updatedOrder?.status || 'CANCELLED'
          };
        });
        this.applyFilter();
        this.cancellingId = null;
        this.notificationService.success(`Order ${orderCode} has been cancelled successfully.`, 5000);
        this.closeCancelDialog();
      },
      error: () => {
        this.cancelReasonError = 'Unable to cancel this order right now. Please try again.';
        this.cancellingId = null;
      }
    });
  }

  onStatusFilterChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredOrders =
      this.selectedStatus === 'All'
        ? this.orders
        : this.orders.filter(order => order.status === this.selectedStatus);
  }

  getStatusClass(status: string): string {
    return {
      CONFIRMED: 'bg-primary',
      PENDING: 'bg-info',
      SHIPPED: 'bg-warning',
      DELIVERED: 'bg-success',
    }[status] || 'bg-secondary';
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
}