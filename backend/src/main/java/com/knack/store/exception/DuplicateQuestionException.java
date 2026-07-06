package com.knack.store.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateQuestionException extends RuntimeException {

    public DuplicateQuestionException(String message) {
        super(message);
    }
}

