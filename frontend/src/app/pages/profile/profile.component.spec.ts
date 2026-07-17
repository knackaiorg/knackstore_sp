import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { CustomerService } from '../../core/services/customer.service';
import { AddressService } from '../../core/services/address.service';
import { SavedAddress } from '../../models';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let customerServiceStub: any;
  let addressServiceStub: any;

  const defaultAddr: SavedAddress = {
    id: 1, firstName: 'Jane', lastName: 'Doe', line1: '221B Baker Street', city: 'Hyderabad',
    state: 'Telangana', postcode: '500081', country: 'India', phone: '+91 9000000000', defaultAddress: true
  };
  const secondAddr: SavedAddress = {
    id: 2, firstName: 'Jane', lastName: 'Doe', line1: '99 Second St', city: 'Bengaluru',
    state: 'Karnataka', postcode: '560001', country: 'India', phone: '+91 9111111111', defaultAddress: false
  };

  beforeEach(async () => {
    customerServiceStub = {
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ firstName: 'Jane', lastName: 'Doe', phone: '+91 9000000000' })),
      updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of({}))
    };
    addressServiceStub = {
      list: jasmine.createSpy('list').and.returnValue(of([defaultAddr, secondAddr])),
      add: jasmine.createSpy('add').and.returnValue(of(defaultAddr)),
      update: jasmine.createSpy('update').and.returnValue(of(defaultAddr)),
      delete: jasmine.createSpy('delete').and.returnValue(of(undefined)),
      setDefault: jasmine.createSpy('setDefault').and.returnValue(of(defaultAddr))
    };

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: CustomerService, useValue: customerServiceStub },
        { provide: AddressService, useValue: addressServiceStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('creates and loads both the profile and the address book on init', () => {
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.addresses).toEqual([defaultAddr, secondAddr]);
    expect(component.addressesLoading).toBeFalse();
  });

  it('startAddAddress opens a blank form and defaults makeDefault true only when the book is empty', () => {
    addressServiceStub.list.and.returnValue(of([]));
    fixture.detectChanges();

    component.startAddAddress();

    expect(component.showAddressForm).toBeTrue();
    expect(component.editingAddressId).toBeNull();
    expect(component.addressForm.value.makeDefault).toBeTrue();
  });

  it('startAddAddress does not default makeDefault when addresses already exist', () => {
    fixture.detectChanges(); // two addresses loaded

    component.startAddAddress();

    expect(component.addressForm.value.makeDefault).toBeFalse();
  });

  it('startEditAddress pre-fills the form from the selected saved address', () => {
    fixture.detectChanges();

    component.startEditAddress(secondAddr);

    expect(component.editingAddressId).toBe(2);
    expect(component.addressForm.value.line1).toBe('99 Second St');
    expect(component.addressForm.value.makeDefault).toBeFalse();
  });

  it('saveAddress calls add() when adding a new address and reloads the list', () => {
    fixture.detectChanges();
    component.startAddAddress();
    component.addressForm.patchValue({
      firstName: 'Jane', lastName: 'Doe', line1: 'New St', city: 'Pune',
      state: 'Maharashtra', postcode: '411001', country: 'India', phone: '+91 9222222222'
    });

    component.saveAddress();

    expect(addressServiceStub.add).toHaveBeenCalled();
    expect(addressServiceStub.update).not.toHaveBeenCalled();
    expect(component.showAddressForm).toBeFalse();
  });

  it('saveAddress calls update() (not add()) when editing an existing address', () => {
    fixture.detectChanges();
    component.startEditAddress(secondAddr);

    component.saveAddress();

    expect(addressServiceStub.update).toHaveBeenCalledWith(2, jasmine.any(Object));
    expect(addressServiceStub.add).not.toHaveBeenCalled();
  });

  it('saveAddress does not call the API when the form is invalid', () => {
    fixture.detectChanges();
    component.startAddAddress();
    component.addressForm.patchValue({ firstName: '' }); // required field left blank

    component.saveAddress();

    expect(addressServiceStub.add).not.toHaveBeenCalled();
  });

  it('saveAddress surfaces a server error message instead of closing the form', () => {
    addressServiceStub.add.and.returnValue(throwError(() => ({ error: { message: 'Bad postcode' } })));
    fixture.detectChanges();
    component.startAddAddress();
    component.addressForm.patchValue({
      firstName: 'Jane', lastName: 'Doe', line1: 'New St', city: 'Pune',
      state: 'Maharashtra', postcode: '411001', country: 'India', phone: '+91 9222222222'
    });

    component.saveAddress();

    expect(component.addressError).toBe('Bad postcode');
    expect(component.showAddressForm).toBeTrue();
  });

  it('deleteAddress asks for confirmation and only calls the API when confirmed', () => {
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteAddress(secondAddr);

    expect(addressServiceStub.delete).not.toHaveBeenCalled();
  });

  it('deleteAddress calls the API and reloads when confirmed', () => {
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteAddress(secondAddr);

    expect(addressServiceStub.delete).toHaveBeenCalledWith(2);
  });

  it('setDefaultAddress is a no-op for an address that is already default', () => {
    fixture.detectChanges();

    component.setDefaultAddress(defaultAddr);

    expect(addressServiceStub.setDefault).not.toHaveBeenCalled();
  });

  it('setDefaultAddress calls the API for a non-default address', () => {
    fixture.detectChanges();

    component.setDefaultAddress(secondAddr);

    expect(addressServiceStub.setDefault).toHaveBeenCalledWith(2);
  });
});
