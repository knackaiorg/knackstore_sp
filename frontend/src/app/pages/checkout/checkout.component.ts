import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Cart, DeliveryOption } from '../../models';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({ selector: 'app-checkout', templateUrl: './checkout.component.html' })
export class CheckoutComponent implements OnInit {
  cart: Cart | null = null;
  addressForm!: FormGroup;
  paymentMethod = 'CREDIT_CARD';
  step = 1;
  placing = false;

  deliveryOptions: DeliveryOption[] = [];
  selectedDeliveryOption!: DeliveryOption;

  constructor(
    private fb: FormBuilder, private cartService: CartService,
    private orderService: OrderService, private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.loadCart().subscribe(c => this.cart = c);
    this.orderService.getDeliveryOptions().subscribe(options => {
      this.deliveryOptions = options;
      this.selectedDeliveryOption = options.find(o => o.isDefault) || options[0];
    });
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
    this.customerService.getProfile().subscribe(customer => {
      if (customer.defaultAddress) {
        this.addressForm.patchValue(customer.defaultAddress);
      } else {
        this.addressForm.patchValue({ firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone });
      }
    });
  }

  nextStep() {
    if (this.step === 1) {
      if (this.addressForm.valid) {
        this.step = 2;
      } else {
        this.addressForm.markAllAsTouched();
      }
    } else if (this.step === 2) {
      this.step = 3;
    }
  }

  placeOrder() {
    this.placing = true;
    this.orderService.placeOrder({
      deliveryAddress: this.addressForm.value,
      paymentMethod: this.paymentMethod,
      orderStatus: 'PENDING',
      deliveryOption: this.selectedDeliveryOption
    }).subscribe({
      next: order => this.router.navigate(['/order-confirmation', order.orderCode]),
      error: () => this.placing = false
    });
  }

  get shippingCost(): number {
    if (!this.selectedDeliveryOption) return 0;
    
    // Free 2-Day Delivery if subtotal >= $200
    if (this.cart && this.cart.subtotal >= 200 && this.selectedDeliveryOption.option === '2-Day Delivery') {
      return 0;
    }
    
    return this.selectedDeliveryOption.cost ?? 0;
  }

  get orderTotal(): number {
    return (this.cart?.totalPrice ?? 0) + this.shippingCost;
  }

  f(name: string) { return this.addressForm.get(name); }
}
