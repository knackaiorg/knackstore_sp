package com.knack.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knack.store.dto.ProductDTO;
import com.knack.store.security.JwtAuthFilter;
import com.knack.store.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    private ProductDTO sampleProduct() {
        ProductDTO dto = new ProductDTO();
        dto.setId(1L);
        dto.setCode("LAPTOP-01");
        dto.setName("Test Laptop");
        dto.setBrand("TestBrand");
        dto.setBasePrice(999.99);
        dto.setFeatured(true);
        dto.setStockQuantity(10);
        return dto;
    }

    @Test
    void createProductReturns201WithCreatedProduct() throws Exception {
        ProductDTO input = sampleProduct();
        ProductDTO created = sampleProduct();
        when(productService.createProduct(any(ProductDTO.class))).thenReturn(created);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("LAPTOP-01"))
                .andExpect(jsonPath("$.name").value("Test Laptop"));
    }

    @Test
    void createProductWithMinimalFieldsReturns201() throws Exception {
        ProductDTO input = new ProductDTO();
        input.setCode("MIN-01");
        input.setName("Minimal Product");
        input.setBasePrice(10.0);

        ProductDTO created = new ProductDTO();
        created.setId(2L);
        created.setCode("MIN-01");
        created.setName("Minimal Product");
        created.setBasePrice(10.0);
        when(productService.createProduct(any(ProductDTO.class))).thenReturn(created);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2));
    }

    @Test
    void createProductWithDuplicateCodeThrowsException() throws Exception {
        ProductDTO input = sampleProduct();
        when(productService.createProduct(any(ProductDTO.class)))
                .thenThrow(new RuntimeException("Product with code 'LAPTOP-01' already exists"));

        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
        );
    }

    @Test
    void searchProductsWithNoFiltersReturnsAll() throws Exception {
        when(productService.searchProducts(null, null, null, null, null))
                .thenReturn(List.of(sampleProduct()));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("LAPTOP-01"));
    }

    @Test
    void searchProductsWithFiltersPassesParamsToService() throws Exception {
        when(productService.searchProducts("laptop", "electronics", "TestBrand", 500.0, 1500.0))
                .thenReturn(List.of(sampleProduct()));

        mockMvc.perform(get("/api/products")
                        .param("search", "laptop")
                        .param("category", "electronics")
                        .param("brand", "TestBrand")
                        .param("minPrice", "500.0")
                        .param("maxPrice", "1500.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].brand").value("TestBrand"));
    }

    @Test
    void searchProductsReturnsEmptyListWhenNoMatch() throws Exception {
        when(productService.searchProducts(eq("nonexistent"), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/products").param("search", "nonexistent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getFeaturedReturnsOnlyFeaturedProducts() throws Exception {
        when(productService.getFeaturedProducts()).thenReturn(List.of(sampleProduct()));

        mockMvc.perform(get("/api/products/featured"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].featured").value(true));
    }

    @Test
    void getFeaturedReturnsEmptyWhenNoneFeatured() throws Exception {
        when(productService.getFeaturedProducts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/products/featured"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getBrandsReturnsDistinctBrandList() throws Exception {
        when(productService.getAllBrands()).thenReturn(List.of("Apple", "Samsung", "TestBrand"));

        mockMvc.perform(get("/api/products/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0]").value("Apple"));
    }

    @Test
    void getProductByIdReturnsProduct() throws Exception {
        when(productService.getProductById(1L)).thenReturn(sampleProduct());

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test Laptop"));
    }

    @Test
    void getProductByIdThrowsWhenNotFound() throws Exception {
        when(productService.getProductById(999L))
                .thenThrow(new RuntimeException("Product not found: 999"));

        assertThrows(Exception.class, () ->
                mockMvc.perform(get("/api/products/999"))
        );
    }

    @Test
    void getProductByCodeReturnsProduct() throws Exception {
        when(productService.getProductByCode("LAPTOP-01")).thenReturn(sampleProduct());

        mockMvc.perform(get("/api/products/code/LAPTOP-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("LAPTOP-01"));
    }

    @Test
    void getProductByCodeThrowsWhenNotFound() throws Exception {
        when(productService.getProductByCode("INVALID"))
                .thenThrow(new RuntimeException("Product not found: INVALID"));

        assertThrows(Exception.class, () ->
                mockMvc.perform(get("/api/products/code/INVALID"))
        );
    }

    @Test
    void getProductsByCategoryReturnsMatchingProducts() throws Exception {
        when(productService.getProductsByCategory("laptops")).thenReturn(List.of(sampleProduct()));

        mockMvc.perform(get("/api/products/category/laptops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getProductsByCategoryReturnsEmptyForUnknownCategory() throws Exception {
        when(productService.getProductsByCategory("unknown")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/products/category/unknown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}





