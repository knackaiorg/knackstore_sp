import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SuggestionGroup {
  type: 'products' | 'categories' | 'brands';
  title: string;
  items: any[];
}

interface SuggestionProduct {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
}

interface SuggestionCategory {
  id: number;
  code: string;
  name: string;
  imageUrl: string;
}

interface SuggestionBrand {
  name: string;
}

interface SuggestionsApiResponse {
  products: SuggestionProduct[];
  categories: SuggestionCategory[];
  brands: SuggestionBrand[];
}

@Injectable({ providedIn: 'root' })
export class SearchSuggestionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private escapeHtml(value: string): string {
    return (value || '').replace(/[&<>'"`=\/]/g, char => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
        '`': '&#96;',
        '=': '&#61;',
        '/': '&#47;'
      }[char] || char;
    });
  }

  private escapeRegex(value: string): string {
    return (value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private highlightPhrase(text: string, query: string): string {
    const escapedText = this.escapeHtml(text || '');
    const escapedQuery = this.escapeRegex(query || '');
    if (!escapedQuery) return escapedText;
    const pattern = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(pattern, '<mark>$1</mark>');
  }

  getSuggestions(query: string): Observable<SuggestionGroup[]> {
    const q = (query || '').trim();
    if (!q || q.length < 2) {
      return of([]);
    }

    return this.http
      .get<SuggestionsApiResponse>(`${this.apiUrl}/search/suggestions`, { params: { q } })
      .pipe(
        map(resp => {
          const groups: SuggestionGroup[] = [];

          if (resp?.products?.length) {
            groups.push({
              type: 'products',
              title: 'Products',
              items: resp.products.map(p => ({
                ...p,
                basePrice: p.price,
                highlightedName: this.highlightPhrase(p.name, q),
                subtitle: 'Product'
              }))
            });
          }

          if (resp?.categories?.length) {
            groups.push({
              type: 'categories',
              title: 'Categories',
              items: resp.categories.map(c => ({
                ...c,
                highlightedName: this.highlightPhrase(c.name, q),
                subtitle: c.code
              }))
            });
          }

          if (resp?.brands?.length) {
            groups.push({
              type: 'brands',
              title: 'Brands',
              items: resp.brands.map(b => ({
                ...b,
                highlightedName: this.highlightPhrase(b.name, q),
                subtitle: 'Brand'
              }))
            });
          }

          return groups;
        }),
        catchError(() => of([]))
      );
  }
}
