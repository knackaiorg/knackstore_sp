package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
public class ProductDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String brand;
    private Double basePrice;
    private String imageUrl;
    private boolean featured;
    private int averageRating;
    private int reviewCount;
    private int stockQuantity;
    private CategoryDTO category;
    private List<VariantDTO> variants;

    public static ProductDTOBuilder builder() {
        return new ProductDTOBuilder();
    }

    public static class ProductDTOBuilder {
        private Long id;
        private String code;
        private String name;
        private String description;
        private String brand;
        private Double basePrice;
        private String imageUrl;
        private boolean featured;
        private int averageRating;
        private int reviewCount;
        private int stockQuantity;
        private CategoryDTO category;
        private List<VariantDTO> variants;

        ProductDTOBuilder() {
        }

        public ProductDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ProductDTOBuilder code(String code) {
            this.code = code;
            return this;
        }

        public ProductDTOBuilder name(String name) {
            this.name = name;
            return this;
        }

        public ProductDTOBuilder description(String description) {
            this.description = description;
            return this;
        }

        public ProductDTOBuilder brand(String brand) {
            this.brand = brand;
            return this;
        }

        public ProductDTOBuilder basePrice(Double basePrice) {
            this.basePrice = basePrice;
            return this;
        }

        public ProductDTOBuilder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public ProductDTOBuilder featured(boolean featured) {
            this.featured = featured;
            return this;
        }

        public ProductDTOBuilder averageRating(int averageRating) {
            this.averageRating = averageRating;
            return this;
        }

        public ProductDTOBuilder reviewCount(int reviewCount) {
            this.reviewCount = reviewCount;
            return this;
        }

        public ProductDTOBuilder stockQuantity(int stockQuantity) {
            this.stockQuantity = stockQuantity;
            return this;
        }

        public ProductDTOBuilder category(CategoryDTO category) {
            this.category = category;
            return this;
        }

        public ProductDTOBuilder variants(List<VariantDTO> variants) {
            this.variants = variants;
            return this;
        }

        public ProductDTO build() {
            ProductDTO dto = new ProductDTO();
            dto.id = this.id;
            dto.code = this.code;
            dto.name = this.name;
            dto.description = this.description;
            dto.brand = this.brand;
            dto.basePrice = this.basePrice;
            dto.imageUrl = this.imageUrl;
            dto.featured = this.featured;
            dto.averageRating = this.averageRating;
            dto.reviewCount = this.reviewCount;
            dto.stockQuantity = this.stockQuantity;
            dto.category = this.category;
            dto.variants = this.variants;
            return dto;
        }
    }

    @Data
    @Builder
    public static class VariantDTO {
        private Long id;
        private String sku;
        private String color;
        private String storage;
        private Double price;
        private int stock;
    }

    @Data
    @Builder
    public static class CategoryDTO {
        private Long id;
        private String code;
        private String name;
        private String imageUrl;
    }
}
