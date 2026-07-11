import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SavedAddress } from '../../models';
import { CustomerService } from '../../core/services/customer.service';
import { AddressService } from '../../core/services/address.service';

@Component({ selector: 'app-profile', templateUrl: './profile.component.html' })
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saving = false;
  success = '';

  // Multi-Address Book: "My Addresses" section state.
  addresses: SavedAddress[] = [];
  addressesLoading = true;
  addressForm!: FormGroup;
  editingAddressId: number | null = null; // null while showAddressForm is true means "adding new"
  showAddressForm = false;
  addressSaving = false;
  addressError = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private addressService: AddressService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['']
    });
    this.customerService.getProfile().subscribe(c => {
      this.form.patchValue(c);
      this.loading = false;
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
      phone: ['', Validators.required],
      makeDefault: [false]
    });

    this.loadAddresses();
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.customerService.updateProfile(this.form.value).subscribe({
      next: () => { this.saving = false; this.success = 'Profile updated!'; setTimeout(() => this.success = '', 3000); },
      error: () => this.saving = false
    });
  }

  loadAddresses() {
    this.addressesLoading = true;
    this.addressService.list().subscribe({
      next: list => { this.addresses = list; this.addressesLoading = false; },
      error: () => this.addressesLoading = false
    });
  }

  startAddAddress() {
    this.editingAddressId = null;
    this.addressForm.reset({ country: 'India', makeDefault: this.addresses.length === 0 });
    this.showAddressForm = true;
    this.addressError = '';
  }

  startEditAddress(addr: SavedAddress) {
    this.editingAddressId = addr.id;
    this.addressForm.patchValue({ ...addr, makeDefault: addr.defaultAddress });
    this.showAddressForm = true;
    this.addressError = '';
  }

  cancelAddressForm() {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressError = '';
  }

  saveAddress() {
    if (this.addressForm.invalid) { this.addressForm.markAllAsTouched(); return; }
    this.addressSaving = true;
    this.addressError = '';
    const request = this.addressForm.value;
    const obs = this.editingAddressId
      ? this.addressService.update(this.editingAddressId, request)
      : this.addressService.add(request);
    obs.subscribe({
      next: () => {
        this.addressSaving = false;
        this.showAddressForm = false;
        this.editingAddressId = null;
        this.loadAddresses();
      },
      error: (err) => {
        this.addressSaving = false;
        this.addressError = err?.error?.message || 'Could not save this address. Please check the details and try again.';
      }
    });
  }

  deleteAddress(addr: SavedAddress) {
    if (!window.confirm(`Delete the address at ${addr.line1}, ${addr.city}?`)) return;
    this.addressService.delete(addr.id).subscribe(() => this.loadAddresses());
  }

  setDefaultAddress(addr: SavedAddress) {
    if (addr.defaultAddress) return;
    this.addressService.setDefault(addr.id).subscribe(() => this.loadAddresses());
  }

  af(name: string) { return this.addressForm.get(name); }
}
