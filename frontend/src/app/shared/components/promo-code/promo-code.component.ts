import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PromoCodeService } from '../../../core/services/promo-code.service';
import { CartService } from '../../../core/services/cart.service';

/**
 * PromoCodeComponent
 * Allows users to apply and remove promo codes on the cart
 * 
 * Features:
 * - Reactive form with validation
 * - Alphanumeric validation
 * - Max length 20 characters
 * - Apply and remove promo codes
 * - Display success/error messages
 * - Loading states for API calls
 */
@Component({
  selector: 'app-promo-code',
  templateUrl: './promo-code.component.html',
  styleUrls: ['./promo-code.component.scss']
})
export class PromoCodeComponent implements OnInit {
  @Input() appliedPromoCode: string | null = null;
  @Input() discountAmount: number = 0;
  
  // Emit event when promo code is applied or removed successfully
  // Parent component should refresh cart data
  @Output() promoCodeChanged = new EventEmitter<void>();

  promoForm!: FormGroup;
  isApplying = false;
  isRemoving = false;
  showMessage = false;
  messageText = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private promoCodeService: PromoCodeService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize reactive form with validators
   * - Required validator (checked on submit)
   * - Max length 20 characters
   * - Alphanumeric pattern validation
   */
  private initializeForm(): void {
    this.promoForm = this.fb.group({
      code: ['', [
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9]*$/) // Alphanumeric only
      ]]
    });
  }

  /**
   * Apply promo code
   * Validates form, calls API, displays result
   */
  applyPromoCode(): void {
    // Mark as touched to show validation errors
    this.promoForm.markAllAsTouched();

    const codeControl = this.promoForm.get('code');
    if (!codeControl) return;

    // Check if code is empty
    const code = codeControl.value?.trim();
    if (!code) {
      this.showErrorMessage('Please enter a promo code');
      return;
    }

    // Check form validity
    if (this.promoForm.invalid) {
      this.showErrorMessage('Please enter a valid promo code (alphanumeric only, max 20 characters)');
      return;
    }

    // Call API to apply promo code
    this.isApplying = true;
    this.hideMessage();

    this.promoCodeService.applyPromoCode(code).subscribe({
      next: (response) => {
        this.isApplying = false;
        
        if (response.success) {
          // Success - show message and refresh cart
          this.showSuccessMessage(response.message);
          this.promoForm.reset();
          
          // Emit event to parent to refresh cart
          this.promoCodeChanged.emit();
        } else {
          // Failed - show error message from backend
          this.showErrorMessage(response.message);
        }
      },
      error: (error) => {
        this.isApplying = false;
        // Display error message from backend or generic error
        const errorMessage = error.error?.message || 'Failed to apply promo code. Please try again.';
        this.showErrorMessage(errorMessage);
      }
    });
  }

  /**
   * Remove currently applied promo code
   */
  removePromoCode(): void {
    this.isRemoving = true;
    this.hideMessage();

    this.promoCodeService.removePromoCode().subscribe({
      next: (response) => {
        this.isRemoving = false;
        
        if (response.success) {
          // Success - show message and refresh cart
          this.showSuccessMessage(response.message);
          
          // Emit event to parent to refresh cart
          this.promoCodeChanged.emit();
        } else {
          this.showErrorMessage(response.message);
        }
      },
      error: (error) => {
        this.isRemoving = false;
        const errorMessage = error.error?.message || 'Failed to remove promo code. Please try again.';
        this.showErrorMessage(errorMessage);
      }
    });
  }

  /**
   * Display success message
   */
  private showSuccessMessage(message: string): void {
    this.messageText = message;
    this.messageType = 'success';
    this.showMessage = true;
    
    // Auto hide after 5 seconds
    setTimeout(() => this.hideMessage(), 5000);
  }

  /**
   * Display error message
   */
  private showErrorMessage(message: string): void {
    this.messageText = message;
    this.messageType = 'error';
    this.showMessage = true;
    
    // Auto hide after 5 seconds
    setTimeout(() => this.hideMessage(), 5000);
  }

  /**
   * Hide message
   */
  hideMessage(): void {
    this.showMessage = false;
  }

  /**
   * Check if form control has error and is touched
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.promoForm.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  /**
   * Get form control for template access
   */
  get codeControl() {
    return this.promoForm.get('code');
  }
}
