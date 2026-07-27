import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CancelOrderRequest, Order, OrderEntry } from '../../models';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  private readonly fallbackOrderImage =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%228%22 fill=%22%23eef2f6%22/%3E%3Cpath d=%22M16 44l10-12 8 9 6-7 8 10H16z%22 fill=%22%2399a3ad%22/%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%225%22 fill=%22%23b5bec8%22/%3E%3C/svg%3E';

  order: Order | null = null;
  loading = true;
  reordering = false;
  cancelling = false;

  showCancelDialog = false;
  selectedCancelReason = '';
  otherCancelReason = '';
  cancelReasonError = '';

  cancelReasonOptions: Array<{ label: string; value: string }> = [
    { label: 'Changed my mind', value: 'Changed my mind' },
    { label: 'Found a better price elsewhere', value: 'Found a better price elsewhere' },
    { label: 'Delivery takes too long', value: 'Delivery takes too long' },
    { label: 'Ordered by mistake', value: 'Ordered by mistake' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private notificationService: NotificationService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      this.orderService.getOrder(p['orderCode']).subscribe(o => { this.order = o; this.loading = false; });
    });
  }

  canCancelOrder(): boolean {
    const normalizedStatus = (this.order?.status || '').toUpperCase();
    return normalizedStatus === 'PENDING' || normalizedStatus === 'CONFIRMED';
  }

  openCancelDialog(): void {
    this.selectedCancelReason = '';
    this.otherCancelReason = '';
    this.cancelReasonError = '';
    this.showCancelDialog = true;
  }

  closeCancelDialog(): void {
    if (this.cancelling) {
      return;
    }

    this.showCancelDialog = false;
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
    if (!this.order) {
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

    this.cancelling = true;
    this.cancelReasonError = '';

    this.orderService.cancelOrder(this.order.orderCode, payload).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.cancelling = false;
        this.notificationService.success(`Order ${this.order?.orderCode} has been cancelled successfully.`, 5000);
        this.closeCancelDialog();
      },
      error: () => {
        this.cancelReasonError = 'Unable to cancel this order right now. Please try again.';
        this.cancelling = false;
      }
    });
  }

  onReorder(): void {
    if (!this.order) return;

    this.cartService.reorder(this.order.orderCode).subscribe({
      next: () => {
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error('Reorder failed', err);
      }
    });
  }

  getEntryImage(entry: OrderEntry): string {
    return entry?.productImageUrl?.trim() || this.fallbackOrderImage;
  }

  onOrderImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target && target.src !== this.fallbackOrderImage) {
      target.src = this.fallbackOrderImage;
    }
  }
}