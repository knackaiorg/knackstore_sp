package com.knack.store.repository;

import com.knack.store.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    boolean existsByQuestion_Id(Long questionId);
}

