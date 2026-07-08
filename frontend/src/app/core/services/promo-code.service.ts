import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplyPromoCodeRequest,
  ApplyPromoCodeResponse,
  RemovePromoCodeResponse
} from '../../models/promo-code.model';

/**
 * PromoCodeService
 * Handles all promo code related API calls
 * - Apply promo code to cart
 * - Remove promo code from cart
 */
@Injectable({
  providedIn: 'root'
})
export class PromoCodeService {
  private apiUrl = `${environment.apiUrl}/promo-codes`;

  constructor(private http: HttpClient) {}

  /**
   * Apply promo code to the current cart
   * @param code Promo code string (will be trimmed)
   * @returns Observable of apply response with success status and message
   */
  applyPromoCode(code: string): Observable<ApplyPromoCodeResponse> {
    const request: ApplyPromoCodeRequest = {
      code: code.trim() // Trim spaces before sending
    };
    return this.http.post<ApplyPromoCodeResponse>(`${this.apiUrl}/apply`, request);
  }

  /**
   * Remove currently applied promo code from cart
   * @returns Observable of remove response with success status and message
   */
  removePromoCode(): Observable<RemovePromoCodeResponse> {
    return this.http.delete<RemovePromoCodeResponse>(`${this.apiUrl}/remove`);
  }
}
