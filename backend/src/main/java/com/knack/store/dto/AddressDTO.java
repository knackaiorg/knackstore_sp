package com.knack.store.dto;

import lombok.Data;

@Data
public class AddressDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String postcode;
    private String country;
    private String phone;
}
