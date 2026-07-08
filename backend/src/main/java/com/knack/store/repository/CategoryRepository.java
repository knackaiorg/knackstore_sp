package com.knack.store.repository;

import com.knack.store.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCode(String code);

    // Needed by SearchService#getSuggestions
    List<Category> findByNameContainingIgnoreCase(String namePart);
}
