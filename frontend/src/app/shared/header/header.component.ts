import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartCount = 0;
  isLoggedIn = false;
  userName = '';
  searchQuery = '';
  private subs = new Subscription();

  constructor(private authService: AuthService, private cartService: CartService, private router: Router) {}

  ngOnInit() {
    this.subs.add(this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userName = user ? user.firstName : '';
      if (user) this.cartService.loadCart().subscribe();
    }));
    this.subs.add(this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart?.totalItems ?? 0;
    }));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }

  logout() {
    this.authService.logout();
    this.cartService.clearLocal();
    this.router.navigate(['/']);
  }
}
