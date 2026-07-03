package com.knack.store.controller;

import com.knack.store.dto.ProductQuestionDTO;
import com.knack.store.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Product Questions", description = "Submit and view product questions and answers")
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/products/{productId}/questions")
    @SecurityRequirements
    @Operation(summary = "Get product Q&A", description = "Returns all product questions, newest first, with optional answers.")
    public ResponseEntity<List<ProductQuestionDTO.QuestionResponse>> getQuestions(@PathVariable Long productId) {
        return ResponseEntity.ok(questionService.getQuestionsForProduct(productId));
    }

    @PostMapping("/products/{productId}/questions")
    @Operation(summary = "Ask product question", description = "Submit one question for a product as the authenticated customer.")
    public ResponseEntity<ProductQuestionDTO.QuestionResponse> askQuestion(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long productId,
            @Valid @RequestBody ProductQuestionDTO.AskQuestionRequest request) {
        ProductQuestionDTO.QuestionResponse response = questionService.askQuestion(user.getUsername(), productId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/questions/{questionId}/answer")
    @Operation(summary = "Answer question", description = "Submit one answer for an unanswered product question.")
    public ResponseEntity<ProductQuestionDTO.QuestionResponse> submitAnswer(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long questionId,
            @Valid @RequestBody ProductQuestionDTO.SubmitAnswerRequest request) {
        ProductQuestionDTO.QuestionResponse response = questionService.submitAnswer(
                user.getUsername(),
                user.getAuthorities(),
                questionId,
                request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

