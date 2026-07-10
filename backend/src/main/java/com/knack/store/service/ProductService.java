package com.knack.store.service;

import com.knack.store.dto.ProductDTO;
import com.knack.store.model.Product;
import com.knack.store.repository.CategoryRepository;
import com.knack.store.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

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
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
