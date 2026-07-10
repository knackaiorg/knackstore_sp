import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRecommendations(productId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products/${productId}/recommendations`);
  }

  triggerCompute(): Observable<any> {
    return this.http.post(`${this.baseUrl}/recommendations/compute`, {});
  }
}


