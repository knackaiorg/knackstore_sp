package com.knack.store.controller;

import com.knack.store.dto.SearchDTO;
import com.knack.store.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "Search Autocomplete", description = "Live search suggestions and search analytics logging")
public class SearchController {

    private final SearchService searchService;

    // GET /api/search/suggestions?q=lap
    @GetMapping("/suggestions")
    @SecurityRequirements // public — no login required to search
    @Operation(summary = "Get search suggestions",
            description = "Returns up to 8 product/category/brand suggestions for the given query. Empty lists if the query is under 2 characters or nothing matches.")
    public ResponseEntity<SearchDTO.SuggestionsResponse> getSuggestions(@RequestParam("q") String query) {
        return ResponseEntity.ok(searchService.getSuggestions(query));
    }

    // POST /api/search/log
    @PostMapping("/log")
    @SecurityRequirements
    @Operation(summary = "Log a search event",
            description = "Records a search submit or suggestion click for analytics (US-12). No PII is captured — just query text and action.")
    public ResponseEntity<Void> logEvent(@Valid @RequestBody SearchDTO.LogSearchEventRequest request) {
        searchService.logEvent(request);
        return ResponseEntity.accepted().build();
    }
}
