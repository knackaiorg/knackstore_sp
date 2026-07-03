import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '../../models';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';

@Component({ selector: 'app-order-detail', templateUrl: './order-detail.component.html' })
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
}