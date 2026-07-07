import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { SearchSuggestionService, SuggestionGroup } from '../../core/services/search-suggestion.service';

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
  suggestions: SuggestionGroup[] = [];
  showSuggestions = false;
  noSuggestions = false;
  private searchInput$ = new Subject<string>();
  // flattened suggestion list for keyboard navigation
  private flat: Array<{ item: any; group: string }> = [];
  activeIndex = -1;
  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private searchService: SearchSuggestionService,
    private el: ElementRef
  ) {}

  ngOnInit() {
    this.subs.add(this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userName = user ? user.firstName : '';
      if (user) this.cartService.loadCart().subscribe();
    }));
    this.subs.add(this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart?.totalItems ?? 0;
    }));

    // listen to search input and fetch suggestions (debounced 300ms)
    this.subs.add(
      this.searchInput$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(q => this.searchService.getSuggestions(q))
      ).subscribe(groups => {
        this.suggestions = groups;
        // build flattened array for keyboard navigation and assign flatIndex
        this.flat = [];
        let idx = 0;
        for (const g of groups) {
          for (const it of g.items) {
            (it as any).__flatIndex = idx;
            this.flat.push({ item: it, group: g.type });
            idx++;
          }
        }
        this.activeIndex = -1;
        this.showSuggestions = this.flat.length > 0;
        this.noSuggestions = !this.showSuggestions && (this.searchQuery?.trim().length ?? 0) >= 2;
      })
    );
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  onSearch() {
    // if (this.searchQuery.trim()) {
      this.showSuggestions = false;
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
    // }
  }

  onSearchInput() {
    const q = this.searchQuery?.trim() ?? '';
    if (!q) {
      // clear suggestions immediately when the input is cleared
      this.suggestions = [];
      this.showSuggestions = false;
      this.flat = [];
      this.activeIndex = -1;
      this.noSuggestions = false;
      this.searchInput$.next('');
      return;
    }

    if (q.length < 2) {
      // wait for 2 characters before showing suggestions
      this.suggestions = [];
      this.showSuggestions = false;
      this.flat = [];
      this.activeIndex = -1;
      this.noSuggestions = false;
      this.searchInput$.next(q);
      return;
    }

    this.noSuggestions = false;
    this.searchInput$.next(q);
  }

  onKeydown(ev: KeyboardEvent) {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      if (!this.showSuggestions || !this.flat.length) return;
      ev.preventDefault();
      this.activeIndex = ev.key === 'ArrowDown'
        ? Math.min(this.flat.length - 1, this.activeIndex + 1)
        : Math.max(0, this.activeIndex - 1);
      this.updatePreviewText();
      this.scrollActiveIntoView();
      return;
    }

    if (ev.key === 'Enter') {
      ev.preventDefault();
      if (this.activeIndex >= 0 && this.activeIndex < this.flat.length) {
        const sel = this.flat[this.activeIndex];
        this.selectSuggestion(sel.item, sel.group);
      } else {
        this.navigateToBestMatchOrSearch();
      }
      return;
    }

    if (ev.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  private navigateToBestMatchOrSearch() {
    const normalizedQuery = this.searchQuery?.trim();
    if (!normalizedQuery) {
      return;
    }

    const matchingProduct = this.flat.find(entry =>
      entry.group === 'products' &&
      entry.item.name?.toLowerCase() === normalizedQuery.toLowerCase()
    );

    if (matchingProduct) {
      this.selectSuggestion(matchingProduct.item, 'products');
      return;
    }

    this.onSearch();
  }

  private updatePreviewText() {
    if (this.activeIndex >= 0 && this.activeIndex < this.flat.length) {
      const selected = this.flat[this.activeIndex];
      this.searchQuery = selected.item.name || selected.item.code || this.searchQuery;
    }
  }

  private scrollActiveIntoView() {
    setTimeout(() => {
      const container = this.el.nativeElement.querySelector('.suggestion-dropdown');
      const active = container?.querySelector('.list-group-item.active') as HTMLElement | null;
      if (container && active) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        if (activeRect.top < containerRect.top || activeRect.bottom > containerRect.bottom) {
          active.scrollIntoView({ block: 'nearest' });
        }
      }
    }, 0);
  }

  getFlatIndex(item: any): number {
    return (item && (item as any).__flatIndex != null) ? (item as any).__flatIndex : -1;
  }

  // close suggestions when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    const target = ev.target as Node;
    const host = this.el?.nativeElement;
    if (!host || !host.contains(target)) {
      this.showSuggestions = false;
    }
  }

  selectSuggestion(item: any, groupType: string) {
    this.showSuggestions = false;
    if (groupType === 'products') {
      // navigate to product detail page by id if available
      const id = item.id || item.code || null;
      if (id) {
        this.router.navigate(['/products', id]);
      } else {
        this.router.navigate(['/products'], { queryParams: { search: item.name } });
      }
    } else if (groupType === 'categories') {
      this.router.navigate(['/products'], { queryParams: { category: item.code || item.name } });
    } else if (groupType === 'brands') {
      this.router.navigate(['/products'], { queryParams: { brand: item.name || item } });
    }
    this.searchQuery = '';
  }

  clearSearch() {
    this.searchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.flat = [];
    this.activeIndex = -1;
    this.noSuggestions = false;
    // remove search query param from URL
    try {
      this.router.navigate([], { queryParams: { search: null }, queryParamsHandling: 'merge' });
    } catch (e) {}
    // focus back into the input if possible
    try { const input: HTMLInputElement | null = this.el.nativeElement.querySelector('input'); if (input) input.focus(); } catch (e) {}
  }

  logout() {
    this.authService.logout();
    this.cartService.clearLocal();
    this.router.navigate(['/']);
  }
}
