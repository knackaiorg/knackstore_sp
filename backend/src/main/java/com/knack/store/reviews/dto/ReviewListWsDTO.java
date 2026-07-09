package com.knack.store.reviews.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewListWsDTO {
    private List<ReviewWsDTO> reviews;
    private long totalCount;
    private double averageRating;
}
