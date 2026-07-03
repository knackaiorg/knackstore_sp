import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductQuestion, SubmitProductAnswerRequest, SubmitProductQuestionRequest } from '../../models';

@Injectable({ providedIn: 'root' })
export class ProductQuestionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProductQuestions(productId: number): Observable<ProductQuestion[]> {
    return this.http.get<ProductQuestion[]>(`${this.apiUrl}/products/${productId}/questions`);
  }

  submitQuestion(productId: number, request: SubmitProductQuestionRequest): Observable<ProductQuestion> {
    return this.http.post<ProductQuestion>(`${this.apiUrl}/products/${productId}/questions`, request);
  }

  submitAnswer(productId: number, questionId: number, request: SubmitProductAnswerRequest): Observable<ProductQuestion> {
    return this.http.post<ProductQuestion>(`${this.apiUrl}/products/${productId}/questions/${questionId}/answer`, request);
  }
}
