import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, Category } from '../../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/featured`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getBrands(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/products/brands`);
  }

  searchProducts(filters: { search?: string; category?: string; brand?: string; minPrice?: number; maxPrice?: number }): Observable<Product[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.brand) params = params.set('brand', filters.brand);
    if (filters.minPrice != null) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice != null) params = params.set('maxPrice', filters.maxPrice);
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getProductsByCategory(code: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/category/${code}`);
  }

  getProductsForComparison(skus: string[]): Observable<Product[]> {
    return this.http.post<Product[]>(`${this.apiUrl}/products/features/compare`, { skus });
  }
}
