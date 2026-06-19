// ---- Auth ----
export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
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
  category: ProductCategory;
  variants: ProductVariant[];
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
}

export interface Cart {
  id: number;
  entries: CartEntry[];
  totalPrice: number;
  totalItems: number;
}

export interface AddEntryRequest {
  productId: number;
  variantId?: number;
  quantity: number;
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
  inStock?: boolean;
  variantId: number | null;
  variantSku: string | null;
  variantDescription: string | null;
}

export interface Wishlist {
  id: number;
  totalItems: number;
  entries: WishlistEntry[];
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

export interface Order {
  id: number;
  orderCode: string;
  status: string;
  totalPrice: number;
  paymentMethod: string;
  trackingNumber: string;
  placedDate: string;
  deliveryAddress: Address;
  entries: OrderEntry[];
}

export interface PlaceOrderRequest {
  deliveryAddress: Address;
  paymentMethod: string;
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
