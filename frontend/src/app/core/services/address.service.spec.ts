import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AddressService } from './address.service';
import { environment } from '../../../environments/environment';
import { SavedAddress } from '../../models';

describe('AddressService', () => {
  let service: AddressService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/customers/me/addresses`;

  const sample: SavedAddress = {
    id: 1, firstName: 'Jane', lastName: 'Doe', line1: '221B Baker Street', city: 'Hyderabad',
    state: 'Telangana', postcode: '500081', country: 'India', phone: '+91 9000000000', defaultAddress: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AddressService]
    });
    service = TestBed.inject(AddressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() GETs the address book', () => {
    service.list().subscribe(result => expect(result).toEqual([sample]));
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([sample]);
  });

  it('add() POSTs a new address', () => {
    const { id, defaultAddress, ...request } = sample;
    service.add(request).subscribe(result => expect(result).toEqual(sample));
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(sample);
  });

  it('update() PUTs to the address id', () => {
    const { id, defaultAddress, ...request } = sample;
    service.update(1, request).subscribe(result => expect(result).toEqual(sample));
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(sample);
  });

  it('delete() DELETEs the address id', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('setDefault() POSTs to the /default sub-path', () => {
    service.setDefault(1).subscribe(result => expect(result).toEqual(sample));
    const req = httpMock.expectOne(`${apiUrl}/1/default`);
    expect(req.request.method).toBe('POST');
    req.flush(sample);
  });
});
