import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReturnOrder, CreateReturnOrderRequest, CreateReturnOrderResponse } from '../../models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReturnOrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Get all return orders for the current customer
   * API Endpoint: GET /api/return-orders/my-returns?email={customerEmail}
   */
  getReturnOrders(): Observable<ReturnOrder[]> {
    const url = `${this.apiUrl}/return-orders/my-returns`;
    const email = this.authService.currentUser?.email;
    const params = new HttpParams().set('email', email || '');
    return this.http.get<ReturnOrder[]>(url, { params });
  }

  /**
   * Get details of a specific return order
   * API Endpoint: GET /api/return-orders/{returnCode}?email={customerEmail}
   */
  getReturnOrderById(returnCode: string): Observable<ReturnOrder> {
    const url = `${this.apiUrl}/return-orders/${returnCode}`;
    const email = this.authService.currentUser?.email;
    const params = new HttpParams().set('email', email || '');
    return this.http.get<ReturnOrder>(url, { params });
  }

  /**
   * Create a new return order for selected items
   * API Endpoint: POST /api/return-orders/create?email={customerEmail}
   */
  createReturnOrder(request: CreateReturnOrderRequest): Observable<CreateReturnOrderResponse> {
    const url = `${this.apiUrl}/return-orders/create`;
    const email = this.authService.currentUser?.email;
    const params = new HttpParams().set('email', email || '');
    return this.http.post<CreateReturnOrderResponse>(url, request, { params });
  }
}
