import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoyaltyBalance,
  LoyaltyHistoryResponse,
  RedeemPointsRequest,
  RedeemPointsResponse
} from '../../models/loyalty.model';

/**
 * LoyaltyService
 * Handles all rewards points related API calls:
 * - Fetch balance / redemption rules
 * - Fetch transaction history
 * - Redeem points against the current cart
 * - Remove a redemption from the current cart
 */
@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private apiUrl = `${environment.apiUrl}/loyalty`;

  // Lets the header badge and any other subscriber stay in sync without an extra HTTP call.
  private balanceSubject = new BehaviorSubject<LoyaltyBalance | null>(null);
  balance$ = this.balanceSubject.asObservable();

  constructor(private http: HttpClient) {}

  getBalance(): Observable<LoyaltyBalance> {
    return this.http.get<LoyaltyBalance>(`${this.apiUrl}/balance`).pipe(
      tap(balance => this.balanceSubject.next(balance))
    );
  }

  getHistory(): Observable<LoyaltyHistoryResponse> {
    return this.http.get<LoyaltyHistoryResponse>(`${this.apiUrl}/history`);
  }

  redeemPoints(points: number): Observable<RedeemPointsResponse> {
    const request: RedeemPointsRequest = { points };
    return this.http.post<RedeemPointsResponse>(`${this.apiUrl}/redeem`, request).pipe(
      tap(() => this.getBalance().subscribe())
    );
  }

  removeRedeemedPoints(): Observable<RedeemPointsResponse> {
    return this.http.delete<RedeemPointsResponse>(`${this.apiUrl}/redeem`).pipe(
      tap(() => this.getBalance().subscribe())
    );
  }

  clearLocal(): void {
    this.balanceSubject.next(null);
  }
}
