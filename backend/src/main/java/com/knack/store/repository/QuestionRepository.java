package com.knack.store.repository;

import com.knack.store.model.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @EntityGraph(attributePaths = {"answer"})
    List<Question> findByProduct_IdOrderByCreatedAtDesc(Long productId);

    boolean existsByProduct_IdAndCustomer_Id(Long productId, Long customerId);
}

