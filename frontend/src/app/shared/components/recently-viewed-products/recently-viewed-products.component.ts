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
  error: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private recentlyViewedService: RecentlyViewedService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.recentlyViewedService.history$.subscribe((products: Product[]) => {
        this.products = this.excludeProductId
          ? products.filter((p: Product) => p.id !== this.excludeProductId)
          : products;
      }),
      this.recentlyViewedService.loading$.subscribe((loading: boolean) => {
        this.loading = loading;
      }),
      this.recentlyViewedService.error$.subscribe((error: string | null) => {
        this.error = error;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
