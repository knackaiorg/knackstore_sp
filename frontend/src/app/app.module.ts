import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Pages
import { HomeComponent } from './pages/home/home.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CompareProductsComponent } from './pages/compare-products/compare-products.component';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderConfirmationComponent } from './pages/order-confirmation/order-confirmation.component';
import { OrderHistoryComponent } from './pages/order-history/order-history.component';
import { OrderDetailComponent } from './pages/order-detail/order-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';

// Shared
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { StarRatingComponent } from './shared/components/star-rating/star-rating.component';
import { ProductCardComponent } from './shared/components/product-card/product-card.component';
import { RecentlyViewedProductsComponent } from './shared/components/recently-viewed-products/recently-viewed-products.component';
import { ProductCarouselComponent } from './shared/components/product-carousel/product-carousel.component';
import { PromoCodeComponent } from './shared/components/promo-code/promo-code.component';
import { WishlistComponent } from './pages/wishlist/wishlist.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { QuickOrderComponent } from './pages/quick-order/quick-order.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProductListComponent,
    ProductDetailComponent,
    CompareProductsComponent,
    CartComponent,
    CheckoutComponent,
    OrderConfirmationComponent,
    OrderHistoryComponent,
    OrderDetailComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    HeaderComponent,
    FooterComponent,
    StarRatingComponent,
    ProductCardComponent,
    RecentlyViewedProductsComponent,
    ProductCarouselComponent,
    PromoCodeComponent,
    WishlistComponent,
    NotificationsComponent,
    QuickOrderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
