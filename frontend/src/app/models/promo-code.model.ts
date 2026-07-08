/**
 * Promo Code Models
 * Interfaces for promo code request/response
 */

export interface ApplyPromoCodeRequest {
  code: string;
}

export interface ApplyPromoCodeResponse {
  success: boolean;
  message: string;
  code?: string;
  discountAmount?: number;
}

export interface RemovePromoCodeResponse {
  success: boolean;
  message: string;
}
