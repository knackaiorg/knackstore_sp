import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../models';

@Injectable({ providedIn: 'root' })
export class ProductCompareService {
  private readonly minCompare = 2;
  private readonly maxCompare = 5;
  private selectedProductsSubject = new BehaviorSubject<Product[]>([]);

  selectedProducts$ = this.selectedProductsSubject.asObservable();

  get selectedProducts(): Product[] {
    return this.selectedProductsSubject.value;
  }

  get minSelection(): number {
    return this.minCompare;
  }

  get maxSelection(): number {
    return this.maxCompare;
  }

  isSelected(productId: number): boolean {
    return this.selectedProducts.some(product => product.id === productId);
  }

  add(product: Product): { success: boolean; message?: string } {
    if (this.isSelected(product.id)) {
      return { success: true };
    }

    if (this.selectedProducts.length > 0) {
      const categoryCode = this.selectedProducts[0].category?.code;
      if (categoryCode && product.category?.code !== categoryCode) {
        return {
          success: false,
          message: `You can only compare products from the same category (${this.selectedProducts[0].category?.name || categoryCode}).`
        };
      }
    }

    if (this.selectedProducts.length >= this.maxCompare) {
      return { success: false, message: `You can compare up to ${this.maxCompare} products.` };
    }

    this.selectedProductsSubject.next([...this.selectedProducts, product]);
    return { success: true };
  }

  remove(productId: number): void {
    this.selectedProductsSubject.next(
      this.selectedProducts.filter(product => product.id !== productId)
    );
  }

  clear(): void {
    this.selectedProductsSubject.next([]);
  }
}