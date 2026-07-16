import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import jsPDF from 'jspdf';
import { Product } from '../../models';
import { ProductCompareService } from '../../core/services/product-compare.service';
import { ProductService } from '../../core/services/product.service';

type FacetKey = 'basic' | 'pricing' | 'ratings' | 'inventory' | 'variants' | 'insights';

interface CompareFacet {
  key: FacetKey;
  label: string;
}

interface CompareAttribute {
  key: string;
  label: string;
  facet: FacetKey;
  value: (product: Product) => string;
}

@Component({
  selector: 'app-compare-products',
  templateUrl: './compare-products.component.html',
  styleUrls: ['./compare-products.component.css']
})
export class CompareProductsComponent implements OnInit {
  comparedProducts: Product[] = [];
  selectedCodes: string[] = [];
  loading = false;
  loadError = '';
  showDifferencesOnly = false;
  selectedFacets: FacetKey[] = [];
  isConfirmModalOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingAction: 'remove' | 'clear' | null = null;
  private pendingProductId: number | null = null;

  readonly facets: CompareFacet[] = [
    { key: 'basic', label: 'Basic' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'ratings', label: 'Ratings' },
    { key: 'inventory', label: 'Availability' },
    { key: 'variants', label: 'Variants' },
    { key: 'insights', label: 'Insights' }
  ];

  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  readonly attributeDefinitions: CompareAttribute[] = [
    { key: 'id', label: 'Product ID', facet: 'basic', value: p => String(p.id) },
    { key: 'code', label: 'Code', facet: 'basic', value: p => p.code || '-' },
    { key: 'name', label: 'Name', facet: 'basic', value: p => p.name || '-' },
    { key: 'brand', label: 'Brand', facet: 'basic', value: p => p.brand || '-' },
    { key: 'category', label: 'Category', facet: 'basic', value: p => p.category?.name || '-' },
    { key: 'categoryCode', label: 'Category Code', facet: 'basic', value: p => p.category?.code || '-' },
    { key: 'basePrice', label: 'Base Price', facet: 'pricing', value: p => this.currencyFormatter.format(p.basePrice || 0) },
    {
      key: 'variantPriceRange',
      label: 'Variant Price Range',
      facet: 'pricing',
      value: p => {
        const prices = p.variants?.map(v => v.price).filter(v => v != null) || [];
        if (!prices.length) return '-';
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return `${this.currencyFormatter.format(min)} - ${this.currencyFormatter.format(max)}`;
      }
    },
    {
      key: 'averageVariantPrice',
      label: 'Average Variant Price',
      facet: 'pricing',
      value: p => {
        const prices = p.variants?.map(v => v.price).filter(v => v != null) || [];
        if (!prices.length) return '-';
        const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        return this.currencyFormatter.format(avg);
      }
    },
    { key: 'averageRating', label: 'Average Rating', facet: 'ratings', value: p => `${p.averageRating ?? 0} / 5` },
    { key: 'reviewCount', label: 'Review Count', facet: 'ratings', value: p => String(p.reviewCount ?? 0) },
    { key: 'featured', label: 'Featured', facet: 'ratings', value: p => p.featured ? 'Yes' : 'No' },
    { key: 'stockQuantity', label: 'Stock Quantity', facet: 'inventory', value: p => String(p.stockQuantity ?? 0) },
    {
      key: 'availability',
      label: 'Availability',
      facet: 'inventory',
      value: p => {
        const stock = p.stockQuantity ?? 0;
        if (stock === 0) return 'Out of stock';
        if (stock < 20) return 'Limited stock';
        return 'In stock';
      }
    },
    {
      key: 'totalVariantStock',
      label: 'Total Variant Stock',
      facet: 'inventory',
      value: p => {
        const total = (p.variants || []).reduce((sum, variant) => sum + (variant.stock || 0), 0);
        return p.variants?.length ? String(total) : '-';
      }
    },
    { key: 'variantCount', label: 'Variant Count', facet: 'variants', value: p => String(p.variants?.length || 0) },
    {
      key: 'variantSkus',
      label: 'Variant SKUs',
      facet: 'variants',
      value: p => {
        const skus = (p.variants || []).map(v => v.sku).filter(Boolean);
        return skus.length ? skus.join(', ') : '-';
      }
    },
    {
      key: 'colorOptions',
      label: 'Color Options',
      facet: 'variants',
      value: p => {
        const colors = Array.from(new Set((p.variants || []).map(v => v.color).filter(Boolean)));
        return colors.length ? colors.join(', ') : '-';
      }
    },
    {
      key: 'storageOptions',
      label: 'Storage / Config Options',
      facet: 'variants',
      value: p => {
        const options = Array.from(new Set((p.variants || []).map(v => v.storage).filter(Boolean)));
        return options.length ? options.join(', ') : '-';
      }
    },
    { key: 'description', label: 'Description', facet: 'basic', value: p => p.description || '-' }
  ];

  constructor(
    private route: ActivatedRoute,
    private compareService: ProductCompareService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const routeCodes = this.extractCodes(params.get('codes'));

      if (!routeCodes.length) {
        const fallbackCodes = this.compareService.selectedProducts
          .map(product => product.code)
          .filter(code => !!code);

        if (fallbackCodes.length) {
          this.selectedCodes = fallbackCodes;
          this.updateRouteCodes();
          return;
        }

        this.selectedCodes = [];
        this.comparedProducts = [];
        this.loadError = '';
        this.loading = false;
        return;
      }

      this.selectedCodes = routeCodes;
      this.fetchComparedProducts(routeCodes);
    });
  }

  private fetchComparedProducts(codes: string[]): void {
    if (!codes.length) {
      this.comparedProducts = [];
      this.loadError = '';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.loadError = '';
    this.productService.getProductsForComparison(codes).subscribe({
      next: products => {
        this.comparedProducts = products;
        this.loading = false;
      },
      error: () => {
        this.comparedProducts = [];
        this.loadError = 'Unable to load comparison details. Please try again.';
        this.loading = false;
      }
    });
  }

  get visibleAttributes(): CompareAttribute[] {
    const filteredByFacet = this.selectedFacets.length
      ? this.attributeDefinitions.filter(attribute => this.selectedFacets.includes(attribute.facet))
      : this.attributeDefinitions;

    if (!this.showDifferencesOnly) {
      return filteredByFacet;
    }

    return filteredByFacet.filter(attribute => this.isAttributeDifferent(attribute));
  }

  toggleFacetSelection(facet: FacetKey): void {
    if (this.selectedFacets.includes(facet)) {
      this.selectedFacets = this.selectedFacets.filter(item => item !== facet);
      return;
    }

    this.selectedFacets = [...this.selectedFacets, facet];
  }

  resetFilters(): void {
    this.selectedFacets = [];
    this.showDifferencesOnly = false;
  }

  isFacetActive(facet: FacetKey): boolean {
    return this.selectedFacets.includes(facet);
  }

  get selectedFacetSummary(): string {
    if (!this.selectedFacets.length) {
      return 'No facet selected: showing all attributes';
    }

    const labels = this.facets
      .filter(facet => this.selectedFacets.includes(facet.key))
      .map(facet => facet.label);

    return `Showing ${labels.join(', ')} attributes`;
  }

  get showInsightsSection(): boolean {
    return !this.selectedFacets.length || this.selectedFacets.includes('insights');
  }

  getAttributeValue(attribute: CompareAttribute, product: Product): string {
    return attribute.value(product);
  }

  getProsItems(product: Product): string[] {
    return this.buildPros(product).map(item => item.replace('+ ', ''));
  }

  getConsItems(product: Product): string[] {
    return this.buildCons(product).map(item => item.replace('- ', ''));
  }

  removeProduct(productId: number): void {
    const product = this.comparedProducts.find(item => item.id === productId);
    if (!product) {
      return;
    }

    this.selectedCodes = this.selectedCodes.filter(code => code !== product.code);
    this.updateRouteCodes();
    this.compareService.remove(productId);
  }

  onRemoveClick(productId: number): void {
    this.pendingAction = 'remove';
    this.pendingProductId = productId;
    this.confirmTitle = 'Remove Product';
    this.confirmMessage = 'Are you sure you want to remove this product from comparison?';
    this.isConfirmModalOpen = true;
  }

  clearAll(): void {
    this.selectedCodes = [];
    this.updateRouteCodes();
    this.compareService.clear();
  }

  onCancelClick(): void {
    this.pendingAction = 'clear';
    this.pendingProductId = null;
    this.confirmTitle = 'Clear Comparison';
    this.confirmMessage = 'Are you sure you want to clear all selected products?';
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.pendingAction = null;
    this.pendingProductId = null;
  }

  confirmModalAction(): void {
    if (this.pendingAction === 'remove' && this.pendingProductId != null) {
      this.removeProduct(this.pendingProductId);
    }

    if (this.pendingAction === 'clear') {
      this.clearAll();
    }

    this.closeConfirmModal();
  }

  backToProducts(): void {
    this.router.navigate(['/products']);
  }

  async exportComparisonPdf(): Promise<void> {
    if (this.comparedProducts.length === 0) {
      return;
    }

    const exportAttributes = this.visibleAttributes.length ? this.visibleAttributes : this.attributeDefinitions;

    const isLandscape = this.comparedProducts.length > 3;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    doc.setFontSize(18);
    doc.text('Product Comparison Report', margin, y);
    y += 22;

    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 22;

    for (let index = 0; index < this.comparedProducts.length; index++) {
      const product = this.comparedProducts[index];

      if (y > pageHeight - 170) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${product.name}`, margin, y);
      y += 18;

      const imageHeight = 64;
      const imageWidth = 64;
      const detailsX = margin + imageWidth + 14;
      let detailsStartY = y;

      try {
        const imageDataUrl = await this.getImageDataUrl(product.imageUrl);
        doc.addImage(imageDataUrl, 'JPEG', margin, y, imageWidth, imageHeight);
      } catch {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Image unavailable', margin + 4, y + 18);
        doc.setTextColor(0, 0, 0);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const details = exportAttributes.map(attribute => `${attribute.label}: ${attribute.value(product)}`);
      if (this.showInsightsSection) {
        details.push(`Pros: ${this.getProsItems(product).join('; ')}`);
        details.push(`Cons: ${this.getConsItems(product).join('; ')}`);
      }

      details.forEach(detail => {
        const lines = doc.splitTextToSize(detail, pageWidth - detailsX - margin);
        doc.text(lines, detailsX, detailsStartY);
        detailsStartY += lines.length * 14 + 2;
      });

      y = Math.max(y + imageHeight, detailsStartY);

      y += 6;
      doc.setDrawColor(225, 225, 225);
      doc.line(margin, y, pageWidth - margin, y);
      y += 16;

      if (y > pageHeight - 80 && index < this.comparedProducts.length - 1) {
        doc.addPage();
        y = margin;
      }
    }

    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  }

  private getImageDataUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Canvas context is unavailable.'));
          return;
        }

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };

      image.onerror = () => reject(new Error('Failed to load image.'));
      image.src = imageUrl;
    });
  }

  private isAttributeDifferent(attribute: CompareAttribute): boolean {
    if (this.comparedProducts.length <= 1) {
      return false;
    }

    const uniqueValues = new Set(
      this.comparedProducts.map(product => attribute.value(product).trim().toLowerCase())
    );

    return uniqueValues.size > 1;
  }

  private extractCodes(codesParam: string | null): string[] {
    if (!codesParam) {
      return [];
    }

    return Array.from(new Set(
      codesParam
        .split(',')
        .map(code => code.trim())
        .filter(code => !!code)
    ));
  }

  private updateRouteCodes(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        codes: this.selectedCodes.length ? this.selectedCodes.join(',') : null
      },
      queryParamsHandling: 'merge'
    });
  }

  private buildPros(product: Product): string[] {
    const pros: string[] = [];

    if ((product.averageRating ?? 0) >= 4.5) {
      pros.push('Strong user ratings');
    }

    if ((product.reviewCount ?? 0) >= 300) {
      pros.push('High review confidence');
    }

    if ((product.stockQuantity ?? 0) >= 100) {
      pros.push('Readily available in stock');
    }

    if ((product.variants?.length || 0) >= 3) {
      pros.push('Multiple variant choices');
    }

    if (product.featured) {
      pros.push('Featured product');
    }

    return pros.length ? pros.map(item => `+ ${item}`) : ['+ Balanced overall offering'];
  }

  private buildCons(product: Product): string[] {
    const cons: string[] = [];

    if ((product.averageRating ?? 0) < 4) {
      cons.push('Lower average rating');
    }

    if ((product.reviewCount ?? 0) < 100) {
      cons.push('Limited review history');
    }

    if ((product.stockQuantity ?? 0) > 0 && (product.stockQuantity ?? 0) < 20) {
      cons.push('Low stock availability');
    }

    if ((product.variants?.length || 0) === 0) {
      cons.push('No variant options');
    }

    if (product.basePrice >= 1500) {
      cons.push('Premium pricing');
    }

    return cons.length ? cons.map(item => `- ${item}`) : ['- No major downsides identified'];
  }
}
