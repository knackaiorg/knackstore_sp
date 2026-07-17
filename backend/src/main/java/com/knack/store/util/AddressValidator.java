package com.knack.store.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * Basic, non-authoritative format checks for saved addresses (Multi-Address
 * Book feature). Per the discovery session: "Doesn't need to be a full
 * address-verification service, just basic format checks" -- this is
 * deliberately a light regex sanity check, not integration with a real
 * postal/carrier verification API. Bad input is rejected with a 400 via
 * ResponseStatusException, which GlobalExceptionHandler already passes
 * through with a clean message.
 */
public final class AddressValidator {

    private AddressValidator() {
    }

    private static final Map<String, Pattern> POSTCODE_PATTERNS = Map.of(
            "india", Pattern.compile("^\\d{6}$"),
            "united states", Pattern.compile("^\\d{5}(-\\d{4})?$"),
            "usa", Pattern.compile("^\\d{5}(-\\d{4})?$"),
            "united kingdom", Pattern.compile("^[A-Za-z]{1,2}\\d[A-Za-z\\d]?\\s?\\d[A-Za-z]{2}$"),
            "uk", Pattern.compile("^[A-Za-z]{1,2}\\d[A-Za-z\\d]?\\s?\\d[A-Za-z]{2}$"),
            "canada", Pattern.compile("^[A-Za-z]\\d[A-Za-z]\\s?\\d[A-Za-z]\\d$")
    );

    // Countries not in POSTCODE_PATTERNS above fall back to this: at least
    // 3 alphanumeric characters (with optional spaces/hyphens), which catches
    // obviously-empty or single-character junk without pretending to know
    // every country's postal format.
    private static final Pattern GENERIC_POSTCODE = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9\\- ]{2,9}$");

    private static final Pattern PHONE = Pattern.compile("^\\+?[0-9()\\-\\s]{7,16}$");

    public static void validate(String country, String postcode, String phone) {
        validatePostcode(country, postcode);
        validatePhone(phone);
    }

    public static void validatePostcode(String country, String postcode) {
        if (postcode == null || postcode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Postal code is required");
        }
        String key = country == null ? "" : country.trim().toLowerCase();
        Pattern pattern = POSTCODE_PATTERNS.getOrDefault(key, GENERIC_POSTCODE);
        if (!pattern.matcher(postcode.trim()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "That doesn't look like a valid postal code for " + (country == null || country.isBlank() ? "the selected country" : country));
        }
    }

    public static void validatePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number is required");
        }
        long digitCount = phone.chars().filter(Character::isDigit).count();
        if (digitCount < 7 || !PHONE.matcher(phone.trim()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That doesn't look like a valid phone number");
        }
    }
}
