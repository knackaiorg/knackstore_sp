import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CheckoutComponent } from './checkout.component';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { CustomerService } from '../../core/services/customer.service';
import { AddressService } from '../../core/services/address.service';
import { SavedAddress } from '../../models';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let cartServiceStub: any;
  let orderServiceStub: any;
  let customerServiceStub: any;
  let addressServiceStub: any;
  let routerStub: any;

  const defaultAddr: SavedAddress = {
    id: 1, firstName: 'Jane', lastName: 'Doe', line1: '221B Baker Street', city: 'Hyderabad',
    state: 'Telangana', postcode: '500081', country: 'India', phone: '+91 9000000000', defaultAddress: true
  };
  const otherAddr: SavedAddress = {
    id: 2, firstName: 'Jane', lastName: 'Doe', line1: '99 Second St', city: 'Bengaluru',
    state: 'Karnataka', postcode: '560001', country: 'India', phone: '+91 9111111111', defaultAddress: false
  };

  function setup(savedAddresses: SavedAddress[] = [defaultAddr, otherAddr]) {
    cartServiceStub = { loadCart: jasmine.createSpy('loadCart').and.returnValue(of({ entries: [], subtotal: 0, totalItems: 0, totalPrice: 0 })) };
    orderServiceStub = { placeOrder: jasmine.createSpy('placeOrder').and.returnValue(of({ orderCode: 'ORD-1' })) };
    customerServiceStub = { getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ firstName: 'Jane', lastName: 'Doe', phone: '+91 9000000000' })) };
    addressServiceStub = {
      list: jasmine.createSpy('list').and.returnValue(of(savedAddresses)),
      add: jasmine.createSpy('add').and.returnValue(of(defaultAddr))
    };
    routerStub = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      declarations: [CheckoutComponent],
      imports: [ReactiveFormsModule, FormsModule],
      providers: [
        { provide: CartService, useValue: cartServiceStub },
        { provide: OrderService, useValue: orderServiceStub },
        { provide: CustomerService, useValue: customerServiceStub },
        { provide: AddressService, useValue: addressServiceStub },
        { provide: Router, useValue: routerStub }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('pre-selects the default saved address when the address book is non-empty', () => {
    setup();
    expect(component.selectedAddressId).toBe(1);
    expect(component.isAddingNewAddress).toBeFalse();
  });

  it('falls back to the blank form when the address book is empty', () => {
    setup([]);
    expect(component.selectedAddressId).toBeNull();
    expect(component.isAddingNewAddress).toBeTrue();
  });

  it('"add new address" is available even when saved addresses exist, and switches to the blank form', () => {
    setup();
    component.chooseAddNewAddress();
    expect(component.isAddingNewAddress).toBeTrue();
    expect(component.selectedAddressId).toBeNull();
  });

  it('selectSavedAddress switches selection back to a saved entry', () => {
    setup();
    component.chooseAddNewAddress();
    component.selectSavedAddress(2);
    expect(component.selectedAddressId).toBe(2);
    expect(component.isAddingNewAddress).toBeFalse();
  });

  it('buildDeliveryAddress returns the selected saved address without id/defaultAddress fields', () => {
    setup();
    component.selectSavedAddress(2);
    const result = component.buildDeliveryAddress();
    expect(result.line1).toBe('99 Second St');
    expect((result as any).id).toBeUndefined();
    expect((result as any).defaultAddress).toBeUndefined();
  });

  it('buildDeliveryAddress returns the form value when adding a new address', () => {
    setup();
    component.chooseAddNewAddress();
    component.addressForm.patchValue({
      firstName: 'Jane', lastName: 'Doe', line1: 'New St', city: 'Pune',
      state: 'Maharashtra', postcode: '411001', country: 'India', phone: '+91 9222222222'
    });
    expect(component.buildDeliveryAddress().line1).toBe('New St');
  });

  it('nextStep blocks advancing when adding a new address with an invalid form', () => {
    setup([]);
    component.nextStep();
    expect(component.step).toBe(1);
  });

  it('nextStep advances when a saved address is selected, without needing the form filled', () => {
    setup();
    component.nextStep();
    expect(component.step).toBe(2);
  });

  it('placeOrder does not save to the address book when an existing saved address was used', () => {
    setup();
    component.saveNewAddress = true; // irrelevant when not adding a new address
    component.placeOrder();
    expect(addressServiceStub.add).not.toHaveBeenCalled();
    expect(orderServiceStub.placeOrder).toHaveBeenCalled();
  });

  it('placeOrder does not save to the address book when the checkbox is unchecked', () => {
    setup([]); // forces "adding new"
    component.saveNewAddress = false;
    component.placeOrder();
    expect(addressServiceStub.add).not.toHaveBeenCalled();
    expect(orderServiceStub.placeOrder).toHaveBeenCalled();
  });

  it('placeOrder saves the new address (as default, since the book was empty) when the checkbox is checked', () => {
    setup([]);
    component.saveNewAddress = true;
    component.placeOrder();
    expect(addressServiceStub.add).toHaveBeenCalledWith(jasmine.objectContaining({ makeDefault: true }));
    expect(orderServiceStub.placeOrder).toHaveBeenCalled();
  });

  it('placeOrder still places the order even if saving the new address fails', () => {
    setup([]);
    addressServiceStub.add.and.returnValue(throwError(() => new Error('save failed')));
    spyOn(window, 'alert');
    component.saveNewAddress = true;

    component.placeOrder();

    expect(window.alert).toHaveBeenCalled();
    expect(orderServiceStub.placeOrder).toHaveBeenCalled();
  });

  it('placeOrder navigates to order confirmation on success', () => {
    setup();
    component.placeOrder();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/order-confirmation', 'ORD-1']);
  });
});
