import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Address, Cart, SavedAddress } from '../../models';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { CustomerService } from '../../core/services/customer.service';
import { AddressService } from '../../core/services/address.service';

@Component({ selector: 'app-checkout', templateUrl: './checkout.component.html' })
export class CheckoutComponent implements OnInit {
  cart: Cart | null = null;
  addressForm!: FormGroup;
  paymentMethod = 'CREDIT_CARD';
  step = 1;
  placing = false;

  // Multi-Address Book: saved addresses show as a selectable list; "add new
  // address" is always available too (e.g. shipping a gift elsewhere without
  // touching the default), and selectedAddressId === null means the blank
  // form below is what gets submitted.
  savedAddresses: SavedAddress[] = [];
  addressesLoading = true;
  selectedAddressId: number | null = null;
  saveNewAddress = false;

  constructor(
    private fb: FormBuilder, private cartService: CartService,
    private orderService: OrderService, private customerService: CustomerService,
    private addressService: AddressService, private router: Router
  ) {}

  ngOnInit() {
    this.cartService.loadCart().subscribe(c => this.cart = c);
    this.addressForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postcode: ['', Validators.required],
      country: ['India', Validators.required],
      phone: ['', Validators.required]
    });
    this.loadSavedAddresses();
  }

  get isAddingNewAddress(): boolean {
    return this.selectedAddressId === null;
  }

  loadSavedAddresses() {
    this.addressesLoading = true;
    this.addressService.list().subscribe({
      next: list => {
        this.savedAddresses = list;
        this.addressesLoading = false;
        if (list.length > 0) {
          const defaultAddr = list.find(a => a.defaultAddress) ?? list[0];
          this.selectedAddressId = defaultAddr.id;
        } else {
          this.chooseAddNewAddress();
        }
      },
      error: () => {
        this.addressesLoading = false;
        this.chooseAddNewAddress();
      }
    });
  }

  selectSavedAddress(id: number) {
    this.selectedAddressId = id;
  }

  // Always available regardless of whether saved addresses exist -- covers
  // the gifting scenario: ship somewhere else without changing the default.
  chooseAddNewAddress() {
    this.selectedAddressId = null;
    this.saveNewAddress = false;
    this.addressForm.reset({ country: 'India' });
    this.customerService.getProfile().subscribe({
      next: c => this.addressForm.patchValue({ firstName: c.firstName, lastName: c.lastName, phone: c.phone }),
      error: () => { /* prefill is a convenience only; a blank form still works */ }
    });
  }

  nextStep() {
    if (this.isAddingNewAddress) {
      if (this.addressForm.invalid) { this.addressForm.markAllAsTouched(); return; }
    } else if (this.selectedAddressId === null) {
      return;
    }
    this.step = 2;
  }

  buildDeliveryAddress(): Address {
    if (this.isAddingNewAddress) {
      return this.addressForm.value;
    }
    const selected = this.savedAddresses.find(a => a.id === this.selectedAddressId);
    const { id, defaultAddress, ...address } = selected as SavedAddress;
    return address;
  }

  placeOrder() {
    this.placing = true;
    const deliveryAddress = this.buildDeliveryAddress();

    // Saving to the address book is optional and separate from placing the
    // order itself -- "save this address" is a checkbox, never automatic.
    const shouldSave = this.isAddingNewAddress && this.saveNewAddress;
    const afterSave$: Observable<unknown> = shouldSave
      ? this.addressService.add({ ...deliveryAddress, makeDefault: this.savedAddresses.length === 0 })
      : of(null);

    afterSave$.subscribe({
      next: () => this.submitOrder(deliveryAddress),
      error: () => {
        // Saving to the address book is a side effect of placing the order,
        // not a precondition for it -- a save failure (e.g. a format the
        // backend's basic validation rejected) shouldn't block checkout, but
        // silently dropping it would leave the customer thinking it saved
        // when it didn't, so this mirrors the window.alert pattern already
        // used for reorder partial-success elsewhere in this app.
        window.alert('Your order will still be placed, but this address could not be saved to your address book.');
        this.submitOrder(deliveryAddress);
      }
    });
  }

  private submitOrder(deliveryAddress: Address) {
    this.orderService.placeOrder({
      deliveryAddress,
      paymentMethod: this.paymentMethod
    }).subscribe({
      next: order => this.router.navigate(['/order-confirmation', order.orderCode]),
      error: () => this.placing = false
    });
  }

  f(name: string) { return this.addressForm.get(name); }
}
