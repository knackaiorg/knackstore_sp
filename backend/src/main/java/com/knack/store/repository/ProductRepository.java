package com.knack.store.repository;

import com.knack.store.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByCode(String code);
    List<Product> findByFeaturedTrue();
    List<Product> findByCategoryCode(String categoryCode);

    @Query("SELECT p FROM Product p WHERE " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:categoryCode IS NULL OR p.category.code = :categoryCode) AND " +
           "(:brand IS NULL OR p.brand = :brand) AND " +
           "(:minPrice IS NULL OR p.basePrice >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.basePrice <= :maxPrice)")
    List<Product> searchProducts(@Param("search") String search,
                                  @Param("categoryCode") String categoryCode,
                                  @Param("brand") String brand,
                                  @Param("minPrice") Double minPrice,
                                  @Param("maxPrice") Double maxPrice);
}
