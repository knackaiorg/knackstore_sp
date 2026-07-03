package com.knack.store.service;

import com.knack.store.dto.ProductQuestionDTO;
import com.knack.store.exception.AlreadyAnsweredException;
import com.knack.store.exception.DuplicateQuestionException;
import com.knack.store.model.*;
import com.knack.store.repository.AnswerRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private static final String DUPLICATE_QUESTION_MESSAGE = "You've already asked a question about this product.";
    private static final String ALREADY_ANSWERED_MESSAGE = "This question already has an answer.";

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public List<ProductQuestionDTO.QuestionResponse> getQuestionsForProduct(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Product not found: " + productId);
        }

        return questionRepository.findByProduct_IdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductQuestionDTO.QuestionResponse askQuestion(String email, Long productId,
                                                           ProductQuestionDTO.AskQuestionRequest request) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        if (questionRepository.existsByProduct_IdAndCustomer_Id(productId, customer.getId())) {
            throw new DuplicateQuestionException(DUPLICATE_QUESTION_MESSAGE);
        }

        Question question = Question.builder()
                .product(product)
                .customer(customer)
                .questionText(request.getQuestion().trim())
                .answered(false)
                .build();

        try {
            Question saved = questionRepository.save(question);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateQuestionException(DUPLICATE_QUESTION_MESSAGE);
        }
    }

    @Transactional
    public ProductQuestionDTO.QuestionResponse submitAnswer(String email,
                                                            Collection<? extends GrantedAuthority> authorities,
                                                            Long questionId,
                                                            ProductQuestionDTO.SubmitAnswerRequest request) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));

        if (question.isAnswered() || answerRepository.existsByQuestion_Id(questionId)) {
            throw new AlreadyAnsweredException(ALREADY_ANSWERED_MESSAGE);
        }

        Answer answer = Answer.builder()
                .question(question)
                .customer(customer)
                .answerText(request.getAnswer().trim())
                .answererRole(resolveAnswererRole(authorities))
                .build();

        Answer savedAnswer;
        try {
            savedAnswer = answerRepository.save(answer);
        } catch (DataIntegrityViolationException ex) {
            throw new AlreadyAnsweredException(ALREADY_ANSWERED_MESSAGE);
        }

        question.setAnswered(true);
        question.setAnswer(savedAnswer);

        Question updated = questionRepository.save(question);
        return toResponse(updated);
    }

    private ProductQuestionDTO.QuestionResponse toResponse(Question question) {
        ProductQuestionDTO.AnswerResponse answerResponse = null;

        if (question.getAnswer() != null) {
            answerResponse = ProductQuestionDTO.AnswerResponse.builder()
                    .id(question.getAnswer().getId())
                    .answerText(question.getAnswer().getAnswerText())
                    .answererLabel(toAnswererLabel(question.getAnswer().getAnswererRole()))
                    .createdAt(question.getAnswer().getCreatedAt())
                    .build();
        }

        return ProductQuestionDTO.QuestionResponse.builder()
                .id(question.getId())
                .productId(question.getProduct().getId())
                .askedBy(question.getCustomer().getFirstName())
                .questionText(question.getQuestionText())
                .createdAt(question.getCreatedAt())
                .answered(question.isAnswered() && answerResponse != null)
                .answer(answerResponse)
                .build();
    }

    private AnswererRole resolveAnswererRole(Collection<? extends GrantedAuthority> authorities) {
        boolean isTeamMember = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority)
                        || "ROLE_STAFF".equals(authority)
                        || "ADMIN".equals(authority)
                        || "STAFF".equals(authority));

        return isTeamMember ? AnswererRole.TEAM : AnswererRole.CUSTOMER;
    }

    private String toAnswererLabel(AnswererRole answererRole) {
        return answererRole == AnswererRole.TEAM ? "Team" : "Customer";
    }
}


