package com.knack.store.dto;

import lombok.Data;

import java.util.List;

@Data
public class CompareRequestDTO {
    private List<String> skus;
}
