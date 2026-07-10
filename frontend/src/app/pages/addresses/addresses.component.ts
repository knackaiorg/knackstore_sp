import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '../../../../node_modules/@angular/forms';
import { Address } from '../../models';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.css'
})
export class AddressesComponent implements OnInit  {
  addressForm!: FormGroup;
  loading = true;
  saving = false;
  success = '';
  error = '';
  showAddressModal = false;
  addresses: Address[] = [];
  editingAddressIndex = -1;

  constructor(private fb: FormBuilder, private customerService: CustomerService) {}

  ngOnInit() {
    this.addressForm = this.fb.group({
      firstName: [ '', 
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s-]*$/)
        ]],
      lastName: ['',  [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s-]*$/)
        ]],
      line1: ['', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]],
      line2: ['',[
          Validators.maxLength(100)
        ]],
      city: ['',  [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s]*$/)
        ]],
      state: ['', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s]*$/)
        ]],
      postcode: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[0-9a-zA-Z\s-]*$/)
        ]],
      country: ['India',[
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s]*$/)
        ]],
      phone: ['', [
          Validators.minLength(10),
          Validators.maxLength(15),
          Validators.pattern(/^[0-9+\-\s\(\)]*$/)
        ]]
    });

    this.loadAddresses();
  }

  loadAddresses() {
    this.customerService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;
      },
      error: () => {
        this.addresses = [];
        this.loading = false;
        this.error = 'Failed to load addresses. Please try again.';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  openAddressModal() {
    this.editingAddressIndex = -1;
    this.addressForm.reset({ country: 'India' });
    this.showAddressModal = true;
    this.error = '';
  }

  closeAddressModal() {
    this.showAddressModal = false;
    this.addressForm.reset({ country: 'India' });
    this.editingAddressIndex = -1;
    this.error = '';
  }

   saveAddress() {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      this.error = 'Please fix all errors before submitting.';
      return;
    }

    const address = this.addressForm.value;
    this.saving = true;
    this.error = '';

    if (this.editingAddressIndex === -1) {
      this.customerService.addAddress(address).subscribe({
        next: (newAddress) => {
          this.addresses.push(newAddress);
          this.saving = false;
          this.success = 'Address added successfully!';
          setTimeout(() => this.success = '', 3000);
          this.closeAddressModal();
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to add address. Please try again.';
          console.error('Error adding address:', err);
        }
      });
    } else {
      const addressId = this.addresses[this.editingAddressIndex]?.id;
       if (addressId !== undefined) {
        this.customerService.updateAddress(addressId, address).subscribe({
        next: (updatedAddress) => {
          this.addresses[this.editingAddressIndex] = updatedAddress;
          this.saving = false;
          this.success = 'Address updated successfully!';
          setTimeout(() => this.success = '', 3000);
          this.closeAddressModal();
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update address. Please try again.';
          console.error('Error updating address:', err);
        }
      });
    }
    }
  }

 

  editAddress(index: number) {
    this.editingAddressIndex = index;
    this.addressForm.patchValue(this.addresses[index]);
    this.showAddressModal = true;
    this.error = '';
  }

  deleteAddress(index: number) {
    const address = this.addresses[index];
    const addressId = address?.id;
    if (addressId === undefined) {
      this.success = 'Error deleting address';
      return;
    }

    if (confirm('Are you sure you want to delete this address?')) {
      this.customerService.deleteAddress(addressId).subscribe({
        next: () => {
          this.addresses.splice(index, 1);
          this.success = 'Address deleted successfully!';
          setTimeout(() => this.success = '', 3000);
        },
        error: () => this.success = 'Error deleting address'
      });
    }
  }

  // deleteAddress(index: number) {
  //   if (confirm('Are you sure you want to delete this address?')) {
  //     const address = this.addresses[index];
  //     const addressId = address?.id;
  //     this.customerService.deleteAddress(addressId).subscribe({
  //       next: () => {
  //         this.addresses.splice(index, 1);
  //         this.success = 'Address deleted successfully!';
  //         setTimeout(() => this.success = '', 3000);
  //       },
  //       error: (err) => {
  //         this.error = err.error?.message || 'Error deleting address. Please try again.';
  //         console.error('Error deleting address:', err);
  //       }
  //     });
  //   }
  // }

  goBack() {
    window.location.href = '/account/profile';
  }


  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.addressForm.get(fieldName);
    if (!control || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return `${this.formatFieldName(fieldName)} is required`;
    if (errors['minlength']) return `${this.formatFieldName(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.formatFieldName(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return `${this.formatFieldName(fieldName)} contains invalid characters`;
    return 'Invalid input';
  }

  formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.addressForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const control = this.addressForm.get(fieldName);
    return !!(control && control.valid && (control.dirty || control.touched));
  }
}
