/**
 * Loyalty / Rewards Points Models
 */

export interface LoyaltyBalance {
  pointsBalance: number;
  redeemableValue: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  minRedeemPoints: number;
  pointValue: number; // rupee value of a single point
}

export type LoyaltyTransactionType = 'EARNED' | 'REDEEMED' | 'REFUNDED' | 'BONUS';

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTransactionType;
  points: number;
  orderCode: string | null;
  description: string | null;
  createdDate: string;
}

export interface LoyaltyHistoryResponse {
  transactions: LoyaltyTransaction[];
}

export interface RedeemPointsRequest {
  points: number;
}

export interface RedeemPointsResponse {
  success: boolean;
  message: string;
  pointsRedeemed: number;
  discountAmount: number;
  remainingBalance: number;
}
