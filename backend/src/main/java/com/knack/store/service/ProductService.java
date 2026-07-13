package com.knack.store.service;

import com.knack.store.dto.ProductDTO;
import com.knack.store.model.Category;
import com.knack.store.model.Product;
import com.knack.store.model.ProductVariant;
import com.knack.store.repository.CategoryRepository;
import com.knack.store.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockService stockService;

    public List<ProductDTO> searchProducts(String search, String categoryCode, String brand, Double minPrice, Double maxPrice) {
        return productRepository.searchProducts(search, categoryCode, brand, minPrice, maxPrice)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<ProductDTO> getFeaturedProducts() {
        return productRepository.findByFeaturedTrue().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductDTO getProductByCode(String code) {
        Product product = productRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Product not found: " + code));
        return toDTO(product);
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        return toDTO(product);
    }

    public List<ProductDTO> getProductsByCategory(String categoryCode) {
        return productRepository.findByCategoryCode(categoryCode).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public ProductDTO createProduct(ProductDTO request) {
        // Check for duplicate code
        if (request.getCode() != null && productRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Product with code '" + request.getCode() + "' already exists");
        }

        Product product = new Product();
        product.setCode(request.getCode());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setBasePrice(request.getBasePrice());
        product.setImageUrl(request.getImageUrl());
        product.setFeatured(request.isFeatured());
        product.setStockQuantity(request.getStockQuantity());

        if (request.getCategory() != null && request.getCategory().getCode() != null) {
            Category category = categoryRepository.findByCode(request.getCategory().getCode())
                    .orElseThrow(() -> new RuntimeException("Category not found: " + request.getCategory().getCode()));
            product.setCategory(category);
        }

        product.setVariants(new ArrayList<>());
        if (request.getVariants() != null) {
            for (ProductDTO.VariantDTO vr : request.getVariants()) {
                ProductVariant variant = new ProductVariant();
                variant.setSku(vr.getSku());
                variant.setColor(vr.getColor());
                variant.setStorage(vr.getStorage());
                variant.setPrice(vr.getPrice());
                variant.setStock(vr.getStock());
                variant.setProduct(product);
                product.getVariants().add(variant);
            }
        }

        Product saved = productRepository.save(product);
        return toDTO(saved);
    }

    public List<String> getAllBrands() {
        return productRepository.findAll().stream()
                .map(Product::getBrand)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public ProductDTO toDTO(Product p) {
        return ProductDTO.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .description(p.getDescription())
                .brand(p.getBrand())
                .basePrice(p.getBasePrice())
                .imageUrl(p.getImageUrl())
                .featured(p.isFeatured())
                .averageRating(p.getAverageRating())
                .reviewCount(p.getReviewCount())
                .stockQuantity(p.getStockQuantity())
                .availableQuantity(stockService.availableQuantity(p.getId(), null, p.getStockQuantity()))
                .lowStockThreshold(p.getLowStockThreshold())
                .category(p.getCategory() != null ? ProductDTO.CategoryDTO.builder()
                        .id(p.getCategory().getId())
                        .code(p.getCategory().getCode())
                        .name(p.getCategory().getName())
                        .imageUrl(p.getCategory().getImageUrl())
                        .build() : null)
                .variants(p.getVariants().stream().map(v -> ProductDTO.VariantDTO.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .color(v.getColor())
                        .storage(v.getStorage())
                        .price(v.getPrice())
                        .stock(v.getStock())
                        .availableStock(stockService.availableQuantity(p.getId(), v.getId(), v.getStock()))
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
