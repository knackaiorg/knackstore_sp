package com.knack.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class ProductQuestionDTO {

    @Data
    public static class AskQuestionRequest {
        @NotBlank
        @Size(max = 200)
        private String question;
    }

    @Data
    public static class SubmitAnswerRequest {
        @NotBlank
        @Size(max = 500)
        private String answer;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class AnswerResponse {
        private Long id;
        private String answerText;
        private String answererLabel;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class QuestionResponse {
        private Long id;
        private Long productId;
        private String questionText;
        private LocalDateTime createdAt;
        private boolean answered;
        private AnswerResponse answer;
    }
}

