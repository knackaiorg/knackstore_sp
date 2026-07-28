import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CancelOrderRequest, Cart, DeliveryOption, Order, PlaceOrderRequest } from '../../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  placeOrder(request: PlaceOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, request);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  reorder(orderCode: string): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/orders/${orderCode}/reorder`, {});
  }

  cancelOrder(orderCode: string, request: CancelOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${orderCode}/cancel`, request);
  }

  getOrder(orderCode: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderCode}`);
  }

  getDeliveryOptions(): Observable<DeliveryOption[]> {
    return this.http.get<DeliveryOption[]>(`${this.apiUrl}/orders/delivery-options`);
  }
}
