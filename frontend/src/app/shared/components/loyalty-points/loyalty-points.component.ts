import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoyaltyService } from '../../../core/services/loyalty.service';
import { LoyaltyBalance } from '../../../models/loyalty.model';

/**
 * LoyaltyPointsComponent
 * Lets a customer redeem rewards points as a discount on their cart, or remove
 * a redemption already applied. Mirrors the promo-code widget's UX conventions.
 */
@Component({
  selector: 'app-loyalty-points',
  templateUrl: './loyalty-points.component.html',
  styleUrls: ['./loyalty-points.component.scss']
})
export class LoyaltyPointsComponent implements OnInit, OnChanges {
  @Input() redeemedPoints = 0;
  @Input() pointsDiscountAmount = 0;

  // Emit when a redemption is applied or removed so the parent can refresh the cart.
  @Output() pointsChanged = new EventEmitter<void>();

  balance: LoyaltyBalance | null = null;
  redeemForm!: FormGroup;
  isRedeeming = false;
  isRemoving = false;
  showMessage = false;
  messageText = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private loyaltyService: LoyaltyService
  ) {}

  ngOnInit(): void {
    this.redeemForm = this.fb.group({
      points: [null, [Validators.required, Validators.min(1)]]
    });
    this.loadBalance();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Refresh the balance whenever the cart's redemption state changes (e.g. after checkout).
    if (changes['redeemedPoints'] && !changes['redeemedPoints'].firstChange) {
      this.loadBalance();
    }
  }

  loadBalance(): void {
    this.loyaltyService.getBalance().subscribe({
      next: (b) => (this.balance = b),
      error: () => {}
    });
  }

  redeemPoints(): void {
    this.redeemForm.markAllAsTouched();
    if (this.redeemForm.invalid || !this.balance) return;

    const points = Math.floor(this.redeemForm.value.points);
    this.isRedeeming = true;
    this.hideMessage();

    this.loyaltyService.redeemPoints(points).subscribe({
      next: (response) => {
        this.isRedeeming = false;
        if (response.success) {
          this.showSuccessMessage(response.message);
          this.redeemForm.reset();
          this.pointsChanged.emit();
        } else {
          this.showErrorMessage(response.message);
        }
      },
      error: (error) => {
        this.isRedeeming = false;
        this.showErrorMessage(error.error?.message || 'Failed to redeem points. Please try again.');
      }
    });
  }

  removePoints(): void {
    this.isRemoving = true;
    this.hideMessage();

    this.loyaltyService.removeRedeemedPoints().subscribe({
      next: (response) => {
        this.isRemoving = false;
        if (response.success) {
          this.showSuccessMessage(response.message);
          this.pointsChanged.emit();
        } else {
          this.showErrorMessage(response.message);
        }
      },
      error: (error) => {
        this.isRemoving = false;
        this.showErrorMessage(error.error?.message || 'Failed to remove points. Please try again.');
      }
    });
  }

  redeemAllEligible(): void {
    if (!this.balance) return;
    this.redeemForm.patchValue({ points: this.balance.pointsBalance });
  }

  private showSuccessMessage(message: string): void {
    this.messageText = message;
    this.messageType = 'success';
    this.showMessage = true;
    setTimeout(() => this.hideMessage(), 5000);
  }

  private showErrorMessage(message: string): void {
    this.messageText = message;
    this.messageType = 'error';
    this.showMessage = true;
    setTimeout(() => this.hideMessage(), 5000);
  }

  hideMessage(): void {
    this.showMessage = false;
  }

  get pointsControl() {
    return this.redeemForm.get('points');
  }

  get canRedeem(): boolean {
    return !!this.balance && this.balance.pointsBalance >= this.balance.minRedeemPoints;
  }
}
