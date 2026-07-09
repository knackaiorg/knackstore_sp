import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReviewEligibilityDTO, ReviewListWsDTO, ReviewWsDTO, SubmitProductReviewRequest } from '../../models';

@Injectable({ providedIn: 'root' })
export class ProductReviewService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProductReviews(productId: number): Observable<ReviewListWsDTO> {
    return this.http.get<ReviewListWsDTO>(`${this.apiUrl}/products/${productId}/reviews`);
  }

  getReviewEligibility(productId: number): Observable<ReviewEligibilityDTO> {
    return this.http.get<ReviewEligibilityDTO>(`${this.apiUrl}/products/${productId}/reviews/me`);
  }

  submitReview(productId: number, request: SubmitProductReviewRequest): Observable<ReviewWsDTO> {
    return this.http.post<ReviewWsDTO>(`${this.apiUrl}/products/${productId}/reviews`, request);
  }
}
