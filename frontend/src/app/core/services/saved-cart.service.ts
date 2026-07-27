import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavedCart } from '../../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavedCartService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  saveCurrentCart(): Observable<SavedCart> {
    return this.http.post<SavedCart>(`${this.apiUrl}/saved-carts`, {});
  }

  list(): Observable<SavedCart[]> {
    return this.http.get<SavedCart[]>(`${this.apiUrl}/saved-carts`);
  }

  get(id: number): Observable<SavedCart> {
    return this.http.get<SavedCart>(`${this.apiUrl}/saved-carts/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/saved-carts/${id}`);
  }

  removeEntry(savedCartId: number, entryId: number): Observable<SavedCart> {
    return this.http.delete<SavedCart>(`${this.apiUrl}/saved-carts/${savedCartId}/entries/${entryId}`);
  }

  addToCart(savedCartId: number): Observable<SavedCart> {
    return this.http.post<SavedCart>(`${this.apiUrl}/saved-carts/${savedCartId}/add-to-cart`, {});
  }
}
