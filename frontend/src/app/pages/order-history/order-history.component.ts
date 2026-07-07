import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, AddEntryRequest } from '../../models';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  reorderingId: string | null = null;

  statusOptions: string[] = ['All', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  selectedStatus: string = 'All';

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.orderService.getOrders().subscribe(o => {
      this.orders = o;
      this.applyFilter();
      this.loading = false;
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