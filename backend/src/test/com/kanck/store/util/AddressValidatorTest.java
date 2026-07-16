package com.knack.store.util;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AddressValidatorTest {

    @Test
    void validPostcode_india_sixDigits_passes() {
        assertThatCode(() -> AddressValidator.validatePostcode("India", "500081")).doesNotThrowAnyException();
    }

    @Test
    void invalidPostcode_india_fiveDigits_rejected() {
        assertThatThrownBy(() -> AddressValidator.validatePostcode("India", "50008"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void validPostcode_unitedStates_fiveDigits_passes() {
        assertThatCode(() -> AddressValidator.validatePostcode("United States", "94105")).doesNotThrowAnyException();
    }

    @Test
    void validPostcode_unitedStates_zipPlusFour_passes() {
        assertThatCode(() -> AddressValidator.validatePostcode("United States", "94105-1234")).doesNotThrowAnyException();
    }

    @Test
    void validPostcode_unknownCountry_fallsBackToGenericCheck() {
        assertThatCode(() -> AddressValidator.validatePostcode("Wonderland", "AB1 2CD")).doesNotThrowAnyException();
    }

    @Test
    void invalidPostcode_unknownCountry_tooShort_rejected() {
        assertThatThrownBy(() -> AddressValidator.validatePostcode("Wonderland", "A"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void blankPostcode_rejected() {
        assertThatThrownBy(() -> AddressValidator.validatePostcode("India", "  "))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void validPhone_withCountryCodeAndSpaces_passes() {
        assertThatCode(() -> AddressValidator.validatePhone("+91 9000000000")).doesNotThrowAnyException();
    }

    @Test
    void invalidPhone_letters_rejected() {
        assertThatThrownBy(() -> AddressValidator.validatePhone("call-me-maybe"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void invalidPhone_tooFewDigits_rejected() {
        assertThatThrownBy(() -> AddressValidator.validatePhone("123"))
                .isInstanceOf(ResponseStatusException.class);
    }
}
