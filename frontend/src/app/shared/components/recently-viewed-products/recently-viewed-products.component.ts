import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { Product } from '../../../models';
import { RecentlyViewedService } from '../../../core/services/recently-viewed.service';

@Component({
  selector: 'app-recently-viewed-products',
  templateUrl: './recently-viewed-products.component.html',
  styleUrls: ['./recently-viewed-products.component.css']
})
export class RecentlyViewedProductsComponent implements OnInit, OnDestroy {
  @Input() excludeProductId: number | null = null;

  products: Product[] = [];
  loading = true;

  private subscription?: Subscription;

  constructor(private recentlyViewedService: RecentlyViewedService) {}

  ngOnInit() {
    this.subscription = this.recentlyViewedService.history$.subscribe(products => {
      this.products = this.excludeProductId
        ? products.filter(p => p.id !== this.excludeProductId)
        : products;
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
