import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductReview, SubmitProductReviewRequest } from '../../models';

@Injectable({ providedIn: 'root' })
export class ProductReviewService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProductReviews(productId: number): Observable<ProductReview[]> {
    return this.http.get<ProductReview[]>(`${this.apiUrl}/products/${productId}/reviews`);
  }

  submitReview(productId: number, request: SubmitProductReviewRequest): Observable<ProductReview> {
    return this.http.post<ProductReview>(`${this.apiUrl}/products/${productId}/reviews`, request);
  }
}
