import { Component } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import {
  QuickOrderCsvUploadResponse,
  QuickOrderErrorItem,
  QuickOrderSearchResult,
  QuickOrderService
} from '../../core/services/quick-order.service';

interface QuickOrderRow {
  entryId?: number;
  sku: string;
  quantity: number;
  searchResults: QuickOrderSearchResult[];
}

@Component({
  selector: 'app-quick-order',
  templateUrl: './quick-order.component.html',
  styleUrls: ['./quick-order.component.css']
})
export class QuickOrderComponent {
  private readonly minimumRows = 5;
  private readonly maximumRows = 100;

  tableData: QuickOrderRow[] = this.createEmptyRows(this.minimumRows);
  sessionId: string | null = null;
  isUploading = false;
  isDownloadingTemplate = false;
  isAddingToCart = false;
  errorMessage = '';
  successMessage = '';
  uploadErrors: QuickOrderErrorItem[] = [];

  get canAddRow(): boolean {
    return this.tableData.length < this.maximumRows;
  }

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
    this.uploadErrors = [];

    this.quickOrderService.uploadCsv(file).subscribe({
      next: (response) => {
        this.applyUploadResponse(response, 'append');
      },
      error: (err) => {
        const backendMessage = err?.error?.message;
        this.errorMessage = backendMessage || 'CSV upload failed. Please upload a valid .csv file.';
        this.tableData = this.createEmptyRows(this.minimumRows);
        this.sessionId = null;
        this.uploadErrors = [];
      },
      complete: () => {
        this.isUploading = false;
        if (event?.target) event.target.value = '';
      }
    });
  }

  onSkuInput(index: number): void {
    const row = this.tableData[index];
    if (!row) return;

    row.entryId = undefined;
    const query = (row.sku ?? '').trim();

    if (!query) {
      row.searchResults = [];
      return;
    }

    this.quickOrderService.searchProducts(query).subscribe({
      next: (response) => {
        if ((this.tableData[index]?.sku ?? '').trim() !== query) return;
        this.tableData[index].searchResults = response?.results ?? [];
      },
      error: () => {
        if (this.tableData[index]) {
          this.tableData[index].searchResults = [];
        }
      }
    });
  }

  clearSearchResults(index: number): void {
    setTimeout(() => {
      if (this.tableData[index]) {
        this.tableData[index].searchResults = [];
      }
    }, 150);
  }

  useSearchResult(index: number, result: QuickOrderSearchResult): void {
    const row = this.tableData[index];
    if (!row) return;

    row.sku = result.skuCode;
    row.searchResults = [];
  }

  removeRow(index: number): void {
    this.tableData.splice(index, 1);
    this.ensureMinimumRows();
  }

  addRow(): void {
    if (!this.canAddRow) {
      this.errorMessage = `You can add up to ${this.maximumRows} rows only.`;
      return;
    }

    this.tableData.push({
      sku: '',
      quantity: 1,
      searchResults: []
    });
  }

  onQuantityInput(index: number): void {
    const row = this.tableData[index];
    if (!row) return;

    const normalized = Math.floor(Number(row.quantity));
    row.quantity = Number.isFinite(normalized) && normalized > 0 ? normalized : 1;
  }

  resetTable(): void {
    this.tableData = this.createEmptyRows(this.minimumRows);
    this.sessionId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadErrors = [];
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
    const validRows = this.getValidRows();
    if (!validRows.length) {
      this.errorMessage = 'Enter at least one SKU with quantity greater than 0.';
      return;
    }

    this.isAddingToCart = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadErrors = [];

    const csvFile = this.buildCsvFile(validRows);
    this.quickOrderService.uploadCsv(csvFile).subscribe({
      next: (uploadResponse) => {
        this.applyUploadResponse(uploadResponse, 'replace');

        if (!uploadResponse.sessionId || (uploadResponse.validCount ?? 0) === 0) {
          this.isAddingToCart = false;
          if (!this.errorMessage) {
            this.errorMessage = 'No valid rows available to add to cart.';
          }
          return;
        }

        this.quickOrderService.addAllToCart(uploadResponse.sessionId).subscribe({
          next: (response) => {
            const addedIds = new Set((response?.addedItems ?? []).map(item => item.entryId));
            if (addedIds.size > 0) {
              this.tableData = this.tableData.filter(row => !row.entryId || !addedIds.has(row.entryId));
              this.ensureMinimumRows();
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
      },
      error: (err) => {
        const backendMessage = err?.error?.message;
        this.errorMessage = backendMessage || 'Failed to validate rows for quick order.';
        this.isAddingToCart = false;
      }
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private applyUploadResponse(response: QuickOrderCsvUploadResponse, mode: 'append' | 'replace' = 'replace'): void {
    this.sessionId = response?.sessionId ?? null;

    const uploadedRows: QuickOrderRow[] = (response?.stagingItems ?? []).map(item => ({
      entryId: item.entryId,
      sku: item.skuCode ?? '',
      quantity: item.quantity,
      searchResults: []
    }));

    if (mode === 'append') {
      const existingRows = this.tableData.filter(row => !!(row.sku ?? '').trim()).map(row => ({
        entryId: row.entryId,
        sku: row.sku,
        quantity: row.quantity,
        searchResults: []
      }));
      this.tableData = [...existingRows, ...uploadedRows];
    } else {
      this.tableData = uploadedRows;
    }

    this.ensureMinimumRows();

    this.uploadErrors = response?.errors ?? [];
    if ((response?.errorCount ?? 0) > 0) {
      this.errorMessage = `${response.errorCount} item(s) were not added due to errors.`;
    } else {
      this.errorMessage = '';
    }
  }

  private getValidRows(): Array<{ sku: string; quantity: number }> {
    return this.tableData
      .map(row => ({
        sku: (row.sku ?? '').trim(),
        quantity: Number(row.quantity)
      }))
      .filter(row => !!row.sku && Number.isFinite(row.quantity) && row.quantity > 0);
  }

  private buildCsvFile(rows: Array<{ sku: string; quantity: number }>): File {
    const content = ['SKU,Quantity', ...rows.map(row => `${row.sku},${row.quantity}`)].join('\n');
    return new File([content], 'quick-order-manual.csv', { type: 'text/csv' });
  }

  private createEmptyRows(count: number): QuickOrderRow[] {
    return Array.from({ length: count }, () => ({
      sku: '',
      quantity: 1,
      searchResults: []
    }));
  }

  private ensureMinimumRows(): void {
    while (this.tableData.length < this.minimumRows) {
      this.tableData.push({
        sku: '',
        quantity: 1,
        searchResults: []
      });
    }
  }
}