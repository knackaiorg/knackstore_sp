import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ProductDetailComponent } from './product-detail.component';
import { ProductReviewService } from '../../core/services/product-review.service';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    brand: 'Acme',
    imageUrl: 'img.png',
    variants: [],
    reviewCount: 0,
    averageRating: 0,
    basePrice: 10
  } as any;

  const productServiceSpy = jasmine.createSpyObj('ProductService', ['getProductById']);
  const reviewServiceSpy = jasmine.createSpyObj('ProductReviewService', ['getProductReviews', 'getReviewEligibility', 'submitReview']);
  const authServiceSpy = { isLoggedIn: true } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductDetailComponent],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: ProductReviewService, useValue: reviewServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('loads product and reviews on init', fakeAsync(() => {
    productServiceSpy.getProductById.and.returnValue(of(mockProduct));
    reviewServiceSpy.getProductReviews.and.returnValue(of({ reviews: [], totalCount: 0, averageRating: 0 }));
    reviewServiceSpy.getReviewEligibility.and.returnValue(of({ alreadyReviewed: false }));

    fixture.detectChanges(); // ngOnInit
    tick();

    expect(productServiceSpy.getProductById).toHaveBeenCalledWith(1);
    expect(reviewServiceSpy.getProductReviews).toHaveBeenCalledWith(1);
    expect(component.product?.id).toBe(1);
    expect(component.reviews).toBeDefined();
    expect(component.alreadyReviewed).toBeFalse();
  }));

  it('validates review submission requires rating', () => {
    component.product = mockProduct;
    component.reviewRating = null;

    component.submitReview();

    expect(component.reviewError).toContain('Please select a star rating');
  });

  it('submits a review and updates local state on success', fakeAsync(() => {
    component.product = { ...mockProduct };
    component.reviewRating = 5;
    component.reviewComment = 'Nice';

    const returnedReview = { id: 10, rating: 5, comment: 'Nice', reviewerName: 'Demo', createdAt: new Date().toISOString() } as any;
    reviewServiceSpy.submitReview.and.returnValue(of(returnedReview));

    component.reviews = [];
    component.totalReviewCount = 0;
    component.averageRating = 0;

    component.submitReview();
    tick();

    expect(reviewServiceSpy.submitReview).toHaveBeenCalledWith(1, jasmine.any(Object));
    expect(component.reviews[0]).toEqual(returnedReview);
    expect(component.alreadyReviewed).toBeTrue();
  }));
});
