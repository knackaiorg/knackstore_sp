package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_carousel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CustomerCarousel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false, unique = true)
    private String customerId;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "product_ids", nullable = false, columnDefinition = "CLOB")
    private List<String> productIds = new ArrayList<>();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public List<String> getProductIds() {
        return productIds;
    }

    public void setProductIds(List<String> productIds) {
        this.productIds = productIds;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static CustomerCarouselBuilder builder() {
        return new CustomerCarouselBuilder();
    }

    public static class CustomerCarouselBuilder {
        private Long id;
        private String customerId;
        private List<String> productIds = new ArrayList<>();
        private LocalDateTime updatedAt;

        CustomerCarouselBuilder() {
        }

        public CustomerCarouselBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public CustomerCarouselBuilder customerId(String customerId) {
            this.customerId = customerId;
            return this;
        }

        public CustomerCarouselBuilder productIds(List<String> productIds) {
            this.productIds = productIds;
            return this;
        }

        public CustomerCarouselBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public CustomerCarousel build() {
            CustomerCarousel carousel = new CustomerCarousel();
            carousel.id = this.id;
            carousel.customerId = this.customerId;
            carousel.productIds = this.productIds != null ? this.productIds : new ArrayList<>();
            carousel.updatedAt = this.updatedAt;
            return carousel;
        }
    }
}
