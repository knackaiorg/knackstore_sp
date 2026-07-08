import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({ selector: 'app-login', templateUrl: './login.component.html' })
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cartService: CartService,
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
      },
      error: () => { this.error = 'Invalid email or password.'; this.loading = false; }
    });
  }
}
