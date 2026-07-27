import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AddSavedCartToCartResponse,
  SavedCartDetail,
  SavedCartSummary,
  SaveCartRequest
} from '../../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavedCartService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  saveCurrentCart(request: SaveCartRequest): Observable<SavedCartDetail> {
    return this.http.post<SavedCartDetail>(`${this.apiUrl}/saved-carts`, request);
  }

  getSavedCarts(): Observable<SavedCartSummary[]> {
    return this.http.get<SavedCartSummary[]>(`${this.apiUrl}/saved-carts`);
  }

  getSavedCart(savedCartId: number): Observable<SavedCartDetail> {
    return this.http.get<SavedCartDetail>(`${this.apiUrl}/saved-carts/${savedCartId}`);
  }

  deleteSavedCart(savedCartId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/saved-carts/${savedCartId}`);
  }

  removeEntry(savedCartId: number, entryId: number): Observable<SavedCartDetail> {
    return this.http.delete<SavedCartDetail>(`${this.apiUrl}/saved-carts/${savedCartId}/entries/${entryId}`);
  }

  addAllToActiveCart(savedCartId: number): Observable<AddSavedCartToCartResponse> {
    return this.http.post<AddSavedCartToCartResponse>(`${this.apiUrl}/saved-carts/${savedCartId}/add-to-cart`, {});
  }
}
