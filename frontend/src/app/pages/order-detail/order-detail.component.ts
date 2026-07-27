import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '../../models';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';

@Component({ selector: 'app-order-detail', templateUrl: './order-detail.component.html', styleUrls: ['./order-detail.component.css'] })
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  reordering = false;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      this.orderService.getOrder(p['orderCode']).subscribe(o => { this.order = o; this.loading = false; });
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
}