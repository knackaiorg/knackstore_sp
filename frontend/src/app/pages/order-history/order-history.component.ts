import { Component, OnInit } from '@angular/core';
import { Order } from '../../models';
import { OrderService } from '../../core/services/order.service';

@Component({ selector: 'app-order-history', templateUrl: './order-history.component.html' })
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  constructor(private orderService: OrderService) {}
  ngOnInit() { this.orderService.getOrders().subscribe(o => { this.orders = o; this.loading = false; }); }
  getStatusClass(status: string): string {
    return { PLACED: 'bg-primary', PROCESSING: 'bg-info', SHIPPED: 'bg-warning', DELIVERED: 'bg-success', CANCELLED: 'bg-danger' }[status] || 'bg-secondary';
  }
}
