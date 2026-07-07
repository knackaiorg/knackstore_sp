import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '../../models';
import { OrderService } from '../../core/services/order.service';

@Component({ selector: 'app-order-detail', templateUrl: './order-detail.component.html' })
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  constructor(private route: ActivatedRoute, private orderService: OrderService) {}
  ngOnInit() {
    this.route.params.subscribe(p => {
      this.orderService.getOrder(p['orderCode']).subscribe(o => { this.order = o; this.loading = false; });
    });
  }
}
