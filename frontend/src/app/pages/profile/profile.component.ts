import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address, Customer } from '../../models';
import { CustomerService } from '../../core/services/customer.service';
import { Router } from '@angular/router';

@Component({ selector: 'app-profile', templateUrl: './profile.component.html' })
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saving = false;
  success = '';
  addressForm!: FormGroup;
  showAddressModal = false;
  addresses: Address[] = [];
  editingAddressIndex = -1;

  constructor(private fb: FormBuilder, private customerService: CustomerService, private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      defaultAddress: this.fb.group({
        firstName: [''], lastName: [''], line1: [''], line2: [''],
        city: [''], state: [''], postcode: [''], country: ['India'], phone: ['']
      })
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
      phone: ['']
    });

    this.customerService.getProfile().subscribe(c => {
      this.form.patchValue(c);
      this.loading = false;
    });
      this.loadAddresses();
  }

   loadAddresses() {
    this.customerService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
      },
      error: () => {
        this.addresses = [];
      }
    });
  }

  openAddressModal() {
    this.editingAddressIndex = -1;
    this.addressForm.reset({ country: 'India' });
    this.showAddressModal = true;
  }

  closeAddressModal() {
    this.showAddressModal = false;
    this.addressForm.reset({ country: 'India' });
    this.editingAddressIndex = -1;
  }

  saveAddress() {
    if (this.addressForm.invalid) return;
    
    const address = this.addressForm.value;
    this.saving = true;

    if (this.editingAddressIndex === -1) {
      this.customerService.addAddress(address).subscribe({
        next: (newAddress) => {
          this.addresses.push(newAddress);
          this.saving = false;
          this.success = 'Address added successfully!';
          setTimeout(() => this.success = '', 3000);
          this.closeAddressModal();
        },
        error: () => this.saving = false
      });
    } else {
      const addressId = this.addresses[this.editingAddressIndex].id;
      if (addressId !== undefined) {
        this.customerService.updateAddress(addressId, address).subscribe({
          next: (updatedAddress) => {
            this.addresses[this.editingAddressIndex] = updatedAddress;
            this.saving = false;
            this.success = 'Address updated successfully!';
            setTimeout(() => this.success = '', 3000);
            this.closeAddressModal();
          },
          error: () => this.saving = false
        });
      }
    }
  }

  editAddress(index: number) {
    this.editingAddressIndex = index;
    this.addressForm.patchValue(this.addresses[index]);
    this.showAddressModal = true;
  }

  deleteAddress(index: number) {
    if (confirm('Are you sure you want to delete this address?')) {
      const address = this.addresses[index];
      if (address?.id !== undefined) {
        this.customerService.deleteAddress(address.id).subscribe({
          next: () => {
            this.addresses.splice(index, 1);
            this.success = 'Address deleted successfully!';
            setTimeout(() => this.success = '', 3000);
          },
          error: () => this.success = 'Error deleting address'
        });
      }
    }
  }

  

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.customerService.updateProfile(this.form.value).subscribe({
      next: () => { this.saving = false; this.success = 'Profile updated!'; setTimeout(() => this.success = '', 3000); },
      error: () => this.saving = false
    });
  }

    goToMyAddresses() {
    this.router.navigate(['/account/profile/myaddresses']);
  }
}
