import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuickOrderStagingItem {
  entryId: number;
  skuCode: string;
  productName: string;
  price: number;
  quantity: number;
  availableStock: number;
}

export interface QuickOrderErrorItem {
  rowNumber: number;
  skuCode: string;
  productName: string;
  quantity: number;
  reason: string;
  message: string;
}

export interface QuickOrderCsvUploadResponse {
  sessionId: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  stagingItems: QuickOrderStagingItem[];
  errors: QuickOrderErrorItem[];
}

export interface AddAllToCartResponse {
  totalItems: number;
  addedCount: number;
  failedCount: number;
  addedItems: Array<{
    entryId: number;
    skuCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    mergedWithExisting: boolean;
  }>;
  failedItems: Array<{
    entryId: number;
    skuCode: string;
    productName: string;
    quantity: number;
    reason: string;
    message: string;
  }>;
}

export interface QuickOrderSearchResult {
  productId: number;
  skuCode: string;
  productName: string;
  brand: string;
  imageUrl: string;
  price: number;
  availableStock: number;
  inStock: boolean;
}

export interface QuickOrderSearchResponse {
  results: QuickOrderSearchResult[];
}

@Injectable({ providedIn: 'root' })
export class QuickOrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/quick-order/download-template`, { responseType: 'blob' });
  }

  uploadCsv(file: File): Observable<QuickOrderCsvUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<QuickOrderCsvUploadResponse>(`${this.apiUrl}/quick-order/upload-csv`, formData);
  }

  addAllToCart(sessionId: string): Observable<AddAllToCartResponse> {
    return this.http.post<AddAllToCartResponse>(`${this.apiUrl}/quick-order/add-all-to-cart/${encodeURIComponent(sessionId)}`, {});
  }

  searchProducts(query: string): Observable<QuickOrderSearchResponse> {
    return this.http.get<QuickOrderSearchResponse>(`${this.apiUrl}/quick-order/search`, {
      params: { q: query }
    });
  }
}