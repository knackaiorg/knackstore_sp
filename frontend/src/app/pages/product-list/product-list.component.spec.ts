import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../core/services/product.service';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;

  const productServiceSpy = jasmine.createSpyObj('ProductService', ['getCategories', 'getBrands', 'searchProducts']);
  const routerSpy = { navigate: jasmine.createSpy('navigate') };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: 'Router', useValue: routerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('loads categories, brands and products on init', fakeAsync(() => {
    const cats = [{ id: 1, code: 'phones', name: 'Phones' }];
    const brands = ['Acme'];
    const products = [{ id: 1, name: 'P' }];

    productServiceSpy.getCategories.and.returnValue(of(cats));
    productServiceSpy.getBrands.and.returnValue(of(brands));
    productServiceSpy.searchProducts.and.returnValue(of(products));

    fixture.detectChanges(); // ngOnInit
    tick();

    expect(productServiceSpy.getCategories).toHaveBeenCalled();
    expect(productServiceSpy.getBrands).toHaveBeenCalled();
    expect(productServiceSpy.searchProducts).toHaveBeenCalled();
    expect(component.products).toEqual(products as any);
    expect(component.loading).toBeFalse();
  }));

  it('applyFilters navigates with query params', () => {
    component.filters.search = 'x';
    component.filters.category = 'phones';
    component.filters.brand = 'Acme';
    component.filters.minPrice = 10;
    component.filters.maxPrice = 100;

    // inject router stub directly
    (component as any).router = routerSpy;

    component.applyFilters();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/products'], { queryParams: jasmine.objectContaining({ search: 'x', category: 'phones', brand: 'Acme', minPrice: 10, maxPrice: 100 }) });
  });

  it('clearFilters resets filters and navigates', () => {
    component.filters.search = 'x';
    (component as any).router = routerSpy;

    component.clearFilters();

    expect(component.filters.search).toBe('');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('activeCategory returns matching name or default', () => {
    component.categories = [{ id: 1, code: 'phones', name: 'Phones' } as any];
    component.filters.category = 'phones';
    expect(component.activeCategory).toBe('Phones');

    component.filters.category = 'unknown';
    expect(component.activeCategory).toBe('All Products');
  });
});
