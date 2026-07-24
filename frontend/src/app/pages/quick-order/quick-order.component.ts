import { Component } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { QuickOrderService } from '../../core/services/quick-order.service';

interface QuickOrderRow {
  entryId?: number;
  sku: string;
  quantity: number;
}

@Component({
  selector: 'app-quick-order',
  templateUrl: './quick-order.component.html',
  styleUrls: ['./quick-order.component.css']
})
export class QuickOrderComponent {
  tableData: QuickOrderRow[] = [];
  sessionId: string | null = null;
  isUploading = false;
  isDownloadingTemplate = false;
  isAddingToCart = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private quickOrderService: QuickOrderService,
    private cartService: CartService
  ) {}

  onFileUpload(event: any): void {
    const file = event?.target?.files?.[0] as File | undefined;
    if (!file) return;

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.quickOrderService.uploadCsv(file).subscribe({
      next: (response) => {
        this.sessionId = response?.sessionId ?? null;
        this.tableData = (response?.stagingItems ?? []).map(item => ({
          entryId: item.entryId,
          sku: item.skuCode,
          quantity: item.quantity
        }));

        const errorCount = response?.errorCount ?? 0;
        if (errorCount > 0) {
          this.errorMessage = `${errorCount} row(s) could not be uploaded. Please check your CSV and retry.`;
        }
      },
      error: (err) => {
        const backendMessage = err?.error?.message;
        this.errorMessage = backendMessage || 'CSV upload failed. Please upload a valid .csv file.';
        this.tableData = [];
        this.sessionId = null;
      },
      complete: () => {
        this.isUploading = false;
        if (event?.target) event.target.value = '';
      }
    });
  }

  removeRow(index: number): void {
    this.tableData.splice(index, 1);
  }

  resetTable(): void {
    this.tableData = [];
    this.sessionId = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  downloadCsv(): void {
    this.isDownloadingTemplate = true;
    this.errorMessage = '';

    this.quickOrderService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'QuickOrder_Template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Unable to download template right now. Please try again.';
      },
      complete: () => {
        this.isDownloadingTemplate = false;
      }
    });
  }

  addToCart(): void {
    if (!this.sessionId) {
      this.errorMessage = 'Upload a CSV file before adding items to cart.';
      return;
    }

    if (!this.tableData.length) {
      this.errorMessage = 'No items available to add to cart.';
      return;
    }

    this.isAddingToCart = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.quickOrderService.addAllToCart(this.sessionId).subscribe({
      next: (response) => {
        const addedIds = new Set((response?.addedItems ?? []).map(item => item.entryId));
        if (addedIds.size > 0) {
          this.tableData = this.tableData.filter(row => !row.entryId || !addedIds.has(row.entryId));
        }

        this.successMessage = `${response?.addedCount ?? 0} item(s) added to cart.`;
        if ((response?.failedCount ?? 0) > 0) {
          this.errorMessage = `${response.failedCount} item(s) could not be added due to stock or validation.`;
        }

        this.cartService.loadCart().subscribe({
          next: () => {},
          error: () => {}
        });
      },
      error: (err) => {
        const backendMessage = err?.error?.message;
        this.errorMessage = backendMessage || 'Failed to add quick-order items to cart.';
      },
      complete: () => {
        this.isAddingToCart = false;
      }
    });
  }
}