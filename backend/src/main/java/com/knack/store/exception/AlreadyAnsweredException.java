package com.knack.store.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class AlreadyAnsweredException extends RuntimeException {

    public AlreadyAnsweredException(String message) {
        super(message);
    }
}

