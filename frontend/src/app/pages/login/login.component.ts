import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({ selector: 'app-login', templateUrl: './login.component.html' })
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  }
  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.authService.login(this.form.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.cartService.loadCart().subscribe();
        this.router.navigateByUrl(returnUrl);
        this.cartService.loadCart().subscribe();
        this.wishlistService.loadWishlist().subscribe();
        this.router.navigate(['/']);
      },
      error: () => { this.error = 'Invalid email or password.'; this.loading = false; }
    });
  }
}
