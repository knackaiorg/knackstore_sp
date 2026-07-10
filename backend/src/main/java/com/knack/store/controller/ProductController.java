package com.knack.store.controller;

import com.knack.store.dto.CompareRequestDTO;
import com.knack.store.dto.ProductDTO;
import com.knack.store.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Browse, search, and look up products (public)")
@SecurityRequirements
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Search products", description = "Search and filter products by free text, category, brand, and price range. All filters are optional.")
    public ResponseEntity<List<ProductDTO>> searchProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        return ResponseEntity.ok(productService.searchProducts(search, category, brand, minPrice, maxPrice));
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured products", description = "Returns the list of products flagged as featured.")
    public ResponseEntity<List<ProductDTO>> getFeatured() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    @GetMapping("/brands")
    @Operation(summary = "List brands", description = "Returns all distinct product brands.")
    public ResponseEntity<List<String>> getBrands() {
        return ResponseEntity.ok(productService.getAllBrands());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by id", description = "Fetch a single product by its numeric id.")
    public ResponseEntity<ProductDTO> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get product by code", description = "Fetch a single product by its unique product code.")
    public ResponseEntity<ProductDTO> getProductByCode(@PathVariable String code) {
        return ResponseEntity.ok(productService.getProductByCode(code));
    }

    @GetMapping("/category/{categoryCode}")
    @Operation(summary = "Get products by category", description = "Returns all products belonging to the given category code.")
    public ResponseEntity<List<ProductDTO>> getByCategory(@PathVariable String categoryCode) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryCode));
    }

    @PostMapping("/features/compare")
    @Operation(summary = "Compare products by SKUs", description = "Fetch a list of full product details matching the provided list of unique SKUs.")
    @CrossOrigin(origins = "*") // Crucial to prevent CORS blocks during your hackathon frontend integration
    public ResponseEntity<List<ProductDTO>> compareProducts(@RequestBody CompareRequestDTO request) {
        return ResponseEntity.ok(productService.compareProducts(request.getSkus()));
    }

}
