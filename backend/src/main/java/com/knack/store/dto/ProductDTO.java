package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
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
