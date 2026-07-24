// ---- Auth ----
export interface AuthResponse {
  customerId: number;
  token: string;
  email: string;
  firstName: string;
  lastName: string;
}

// ---- Promo Code ----
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// ---- Address ----
export interface Address {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

// Multi-Address Book: a saved entry in a customer's "My Addresses" list.
// Deliberately separate from Address above -- that plain shape is also used
// for an Order's frozen deliveryAddress snapshot and the checkout form, which
// have neither an id nor a default flag.
export interface SavedAddress extends Address {
  id: number;
  defaultAddress: boolean;
}

export interface SaveAddressRequest extends Address {
  makeDefault?: boolean;
}
// ---- Notifications ----
export interface StockNotificationItem {
  id: number;
  userId: number;
  sku: string;
  email: string;
  notificationStatus: string;
  subscribedAt: string;
  notifiedAt: string | null;
}

export interface FetchAllNotificationsResponse {
  success: boolean;
  message: string;
  notifications: StockNotificationItem[];
  totalCount: number;
}
export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}
// ---- Category ----
export interface Category {
  id: number;
  code: string;
  name: string;
  description: string;
  imageUrl: string;
}

// ---- Product ----
export interface ProductVariant {
  id: number;
  sku: string;
  color: string;
  storage: string;
  price: number;
  stock: number;
  availableStock: number;
}

export interface ProductCategory {
  id: number;
  code: string;
  name: string;
  imageUrl: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  brand: string;
  basePrice: number;
  imageUrl: string;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  stockQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  category: ProductCategory;
  variants: ProductVariant[];
  keySpec?: string;
}

export interface SubmitProductReviewRequest {
  rating: number;
  comment?: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  rating: number;
  comment?: string;
  reviewerName: string;
  createdAt: string;
  helpfulCount?: number;
}

// Backend returns reviews wrapped with aggregate stats, not a bare array.
export interface ProductReviewListResponse {
  reviews: ProductReview[];
  totalCount: number;
  averageRating: number;
  ratingBreakdown?: Record<number, number>;
}

export interface ReviewEligibility {
  alreadyReviewed: boolean;
}

export interface ProductQuestion {
  id: number;
  productId: number;
  questionText: string;
  askedBy: string;
  askedById?: number;
  askedAt: string;
  createdAt: string
  answer?: AnswerModel;
  // answerModel?: AnswerModel;
  answererRole?: string;
  answeredAt?: string;
}

export interface AnswerModel {
  answerText: string;
  answererLabel: string;
}

export interface SubmitProductQuestionRequest {
  question: string;
}

export interface SubmitProductAnswerRequest {
  answer: string;
}

// ---- Product Comparison ----
export interface ComparisonResponse {
  products: Product[];
  notFoundIds: number[];
  maxCompareItems: number;
}

// ---- Cart ----
export interface CartEntry {
  entryId: number;
  productId: number;
  productCode: string;
  productName: string;
  productImageUrl: string;
  variantId: number;
  variantSku: string;
  variantDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  reservedUntil: string | null;
  validForCheckout: boolean;
}

export interface Cart {
  id: number;
  entries: CartEntry[];
  subtotal: number;
  appliedPromoCode: string | null;
  discountAmount: number;
  totalPrice: number;
  totalItems: number;
}

export interface AddEntryRequest {
  productId: number;
  variantId?: number;
  quantity: number;
}

// ---- Saved Carts ----
export interface SavedCartEntry {
  entryId: number;
  productId: number;
  productCode: string;
  productName: string;
  productImageUrl: string;
  variantId: number | null;
  variantSku: string | null;
  variantDescription: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SavedCart {
  id: number;
  cartNumber: string;
  skuCount: number;
  totalPrice: number;
  createdAt: string;
  message?: string;
  entries: SavedCartEntry[];
}

// ---- Wishlist ----
export interface WishlistEntry {
  entryId: number;
  addedAt: string;
  productId: number;
  productCode: string;
  productName: string;
  productImageUrl: string;
  price: number;
  variantId: number | null;
  variantSku: string | null;
  variantDescription: string | null;
}

export interface Wishlist {
  id: number;
  totalItems: number;
  entries: WishlistEntry[];
  stockAlertEnrolled?: boolean;
}

export interface ToggleWishlistEntryRequest {
  productId: number;
  variantId?: number;
}

// ---- Order ----
export interface OrderEntry {
  productCode: string;
  productName: string;
  variantSku: string;
  variantDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryOption {
  option: string;
  deliveryTime: string;
  cost: number;
  isDefault: boolean;
}


export interface Order {
  id: number;
  orderCode: string;
  status: string;
  subtotal: number;
  appliedPromoCode: string | null;
  discountAmount: number;
  totalPrice: number;
  paymentMethod: string;
  trackingNumber: string;
  placedDate: string;
  deliveryDate?: string;
  deliveryAddress: Address;
  entries: OrderEntry[];
}

export interface ReorderResponse {
  success: boolean;
  message: string;
  updatedCart: Cart;
  itemsAdded: number;
  itemsUnavailable: number;
}

export interface PlaceOrderRequest {
  deliveryAddress: Address;
  paymentMethod: string;
  orderStatus: string;
  deliveryOption?: DeliveryOption;
}

// ---- Customer ----
export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  defaultAddress: Address;
}