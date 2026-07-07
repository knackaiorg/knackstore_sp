import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '../../models';
import { OrderService } from '../../core/services/order.service';

@Component({ selector: 'app-order-confirmation', template: `
<div class="container py-5 text-center" style="max-width:600px">
  <div *ngIf="loading"><div class="spinner-border text-primary"></div></div>
  <div *ngIf="!loading && order">
    <div class="display-1 mb-3">✅</div>
    <h2 class="fw-bold text-success">Order Placed Successfully!</h2>
    <p class="text-muted">Thank you for your purchase. Your order has been confirmed.</p>
    <div class="card shadow-sm my-4 text-start">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-6"><small class="text-muted">Order Code</small><div class="fw-bold">{{ order.orderCode }}</div></div>
          <div class="col-6"><small class="text-muted">Status</small><div><span class="badge bg-primary">{{ order.status }}</span></div></div>
          <div class="col-6"><small class="text-muted">Total</small><div class="fw-bold text-primary">{{ order.totalPrice | currency:'USD' }}</div></div>
          <div class="col-6"><small class="text-muted">Tracking No.</small><div class="fw-bold">{{ order.trackingNumber }}</div></div>
        </div>
      </div>
    </div>
    <div class="d-flex gap-3 justify-content-center">
      <a [routerLink]="['/account/orders', order.orderCode]" class="btn btn-primary">View Order</a>
      <a routerLink="/products" class="btn btn-outline-secondary">Continue Shopping</a>
    </div>
  </div>
</div>` })
export class OrderConfirmationComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  constructor(private route: ActivatedRoute, private orderService: OrderService) {}
  ngOnInit() {
    this.route.params.subscribe(p => {
      this.orderService.getOrder(p['orderCode']).subscribe(o => { this.order = o; this.loading = false; });
    });
  }
}
