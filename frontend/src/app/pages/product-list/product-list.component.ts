import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, Category } from '../../models';
import { ProductService } from '../../core/services/product.service';
import { ProductCompareService } from '../../core/services/product-compare.service';

@Component({ selector: 'app-product-list', templateUrl: './product-list.component.html', styleUrls: ['./product-list.component.css'] })
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  brands: string[] = [];
  selectedForCompare: Product[] = [];
  loading = true;
  filters = { search: '', category: '', brand: '', minPrice: null as number | null, maxPrice: null as number | null };
  compareErrorMessage = '';
  isStickyActionModalOpen = false;
  stickyActionTitle = '';
  stickyActionMessage = '';
  private pendingStickyAction: 'compare' | 'cancel' | null = null;

  constructor(
    private productService: ProductService,
    private compareService: ProductCompareService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.productService.getCategories().subscribe(c => this.categories = c);
    this.productService.getBrands().subscribe(b => this.brands = b);
    this.compareService.selectedProducts$.subscribe(products => {
      this.selectedForCompare = products;
      if (products.length < this.compareService.maxSelection) {
        this.compareErrorMessage = '';
      }
    });
    this.route.queryParams.subscribe(params => {
      this.filters.search = params['search'] || '';
      this.filters.category = params['category'] || '';
      this.filters.brand = params['brand'] || '';
      this.filters.minPrice = params['minPrice'] ? +params['minPrice'] : null;
      this.filters.maxPrice = params['maxPrice'] ? +params['maxPrice'] : null;
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading = true;
    const f: any = {};
    if (this.filters.search) f.search = this.filters.search;
    if (this.filters.category) f.category = this.filters.category;
    if (this.filters.brand) f.brand = this.filters.brand;
    if (this.filters.minPrice != null) f.minPrice = this.filters.minPrice;
    if (this.filters.maxPrice != null) f.maxPrice = this.filters.maxPrice;
    this.productService.searchProducts(f).subscribe(p => { this.products = p; this.loading = false; });
  }

  applyFilters() {
    const qp: any = {};
    if (this.filters.search) qp['search'] = this.filters.search;
    if (this.filters.category) qp['category'] = this.filters.category;
    if (this.filters.brand) qp['brand'] = this.filters.brand;
    if (this.filters.minPrice != null) qp['minPrice'] = this.filters.minPrice;
    if (this.filters.maxPrice != null) qp['maxPrice'] = this.filters.maxPrice;
    this.router.navigate(['/products'], { queryParams: qp });
  }

  clearFilters() {
    this.filters = { search: '', category: '', brand: '', minPrice: null, maxPrice: null };
    this.router.navigate(['/products']);
  }

  onCompareToggle(product: Product, checked: boolean): void {
    if (checked) {
      const result = this.compareService.add(product);
      this.compareErrorMessage = result.success ? '' : (result.message || 'Unable to add product for comparison.');
      return;
    }

    this.compareService.remove(product.id);
  }

  isCompared(productId: number): boolean {
    return this.compareService.isSelected(productId);
  }

  isCompareDisabledForProduct(product: Product): boolean {
    if (this.isCompared(product.id)) {
      return false;
    }

    if (this.selectedForCompare.length >= this.maxCompare) {
      return true;
    }

    if (this.selectedForCompare.length === 0) {
      return false;
    }

    const selectedCategoryCode = this.selectedForCompare[0].category?.code;
    return !!selectedCategoryCode && product.category?.code !== selectedCategoryCode;
  }

  clearCompareSelection(): void {
    this.compareService.clear();
    this.compareErrorMessage = '';
  }

  onStickyCancelClick(): void {
    this.pendingStickyAction = 'cancel';
    this.stickyActionTitle = 'Clear Selected Products';
    this.stickyActionMessage = 'Are you sure you want to clear all selected products from comparison?';
    this.isStickyActionModalOpen = true;
  }

  onStickyCompareClick(): void {
    if (!this.canCompare) {
      return;
    }

    this.pendingStickyAction = 'compare';
    this.stickyActionTitle = 'Go To Compare Page';
    this.stickyActionMessage = 'Proceed to compare the selected products now?';
    this.isStickyActionModalOpen = true;
  }

  closeStickyActionModal(): void {
    this.isStickyActionModalOpen = false;
    this.pendingStickyAction = null;
  }

  confirmStickyAction(): void {
    if (this.pendingStickyAction === 'cancel') {
      this.clearCompareSelection();
    }

    if (this.pendingStickyAction === 'compare') {
      this.goToComparePage();
    }

    this.closeStickyActionModal();
  }

  goToComparePage(): void {
    const codes = this.selectedForCompare
      .map(product => product.code)
      .filter(code => !!code);

    this.router.navigate(['/compare/products'], {
      queryParams: { codes: codes.join(',') }
    });
  }

  get maxCompare(): number {
    return this.compareService.maxSelection;
  }

  get minCompare(): number {
    return this.compareService.minSelection;
  }

  get canCompare(): boolean {
    return this.selectedForCompare.length >= this.minCompare;
  }

  get activeCategory(): string { return this.categories.find(c => c.code === this.filters.category)?.name || 'All Products'; }
}
