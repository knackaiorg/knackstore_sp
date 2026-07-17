import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavedAddress, SaveAddressRequest } from '../../models';
import { environment } from '../../../environments/environment';

// Multi-Address Book: talks to /api/customers/me/addresses. Kept as its own
// service (rather than folded into CustomerService) since it's a distinct
// resource with its own list/add/edit/delete/set-default lifecycle, used from
// both the profile page ("My Addresses") and checkout (saved-address picker).
@Injectable({ providedIn: 'root' })
export class AddressService {
  private apiUrl = `${environment.apiUrl}/customers/me/addresses`;
  constructor(private http: HttpClient) {}

  list(): Observable<SavedAddress[]> {
    return this.http.get<SavedAddress[]>(this.apiUrl);
  }

  add(request: SaveAddressRequest): Observable<SavedAddress> {
    return this.http.post<SavedAddress>(this.apiUrl, request);
  }

  update(addressId: number, request: SaveAddressRequest): Observable<SavedAddress> {
    return this.http.put<SavedAddress>(`${this.apiUrl}/${addressId}`, request);
  }

  delete(addressId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${addressId}`);
  }

  setDefault(addressId: number): Observable<SavedAddress> {
    return this.http.post<SavedAddress>(`${this.apiUrl}/${addressId}/default`, {});
  }
}
