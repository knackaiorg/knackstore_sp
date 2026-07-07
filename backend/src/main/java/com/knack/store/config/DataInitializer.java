package com.knack.store.config;

import com.knack.store.model.*;
import com.knack.store.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCategories();
        seedProducts();
        seedDemoCustomer();
        log.info("Electronics Store data initialised successfully.");
    }

    private void seedCategories() {
        List<Category> categories = List.of(
            Category.builder().code("phones").name("Smartphones").description("Latest smartphones from top brands").imageUrl("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400").build(),
            Category.builder().code("laptops").name("Laptops").description("High-performance laptops for work and play").imageUrl("https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400").build(),
            Category.builder().code("cameras").name("Cameras").description("Professional and consumer cameras").imageUrl("https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400").build(),
            Category.builder().code("headphones").name("Headphones").description("Premium audio headphones and earbuds").imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400").build(),
            Category.builder().code("tablets").name("Tablets").description("Tablets for productivity and entertainment").imageUrl("https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400").build(),
            Category.builder().code("accessories").name("Accessories").description("Cases, chargers, cables and more").imageUrl("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400").build()
        );
        categoryRepository.saveAll(categories);
    }

    private void seedProducts() {
        Category phones = categoryRepository.findByCode("phones").orElseThrow();
        Category laptops = categoryRepository.findByCode("laptops").orElseThrow();
        Category cameras = categoryRepository.findByCode("cameras").orElseThrow();
        Category headphones = categoryRepository.findByCode("headphones").orElseThrow();
        Category tablets = categoryRepository.findByCode("tablets").orElseThrow();
        Category accessories = categoryRepository.findByCode("accessories").orElseThrow();

        // --- Smartphones ---
        Product iphone = Product.builder()
            .code("PHONE-001").name("AlphaPhone Pro 15").brand("AlphaTech")
            .description("The most powerful AlphaPhone yet. Features a 6.1-inch Super Retina XDR display, advanced triple-camera system, and all-day battery life.")
            .basePrice(999.99).imageUrl("https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400")
            .featured(true).stockQuantity(150).averageRating(5).reviewCount(320).category(phones).build();
        productRepository.save(iphone);
        saveVariants(iphone,
            ProductVariant.builder().sku("PHONE-001-BLK-128").color("Midnight Black").storage("128GB").price(999.99).stock(50).product(iphone).build(),
            ProductVariant.builder().sku("PHONE-001-SLV-256").color("Silver").storage("256GB").price(1099.99).stock(40).product(iphone).build(),
            ProductVariant.builder().sku("PHONE-001-GLD-512").color("Gold").storage("512GB").price(1299.99).stock(30).product(iphone).build()
        );

        Product galaxy = Product.builder()
            .code("PHONE-002").name("GalaxyEdge S25").brand("StellarTech")
            .description("Cutting-edge Android flagship with a 6.6-inch Dynamic AMOLED display, 200MP camera, and 5000mAh battery.")
            .basePrice(899.99).imageUrl("https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400")
            .featured(true).stockQuantity(120).averageRating(4).reviewCount(210).category(phones).build();
        productRepository.save(galaxy);
        saveVariants(galaxy,
            ProductVariant.builder().sku("PHONE-002-PHN-256").color("Phantom Black").storage("256GB").price(899.99).stock(60).product(galaxy).build(),
            ProductVariant.builder().sku("PHONE-002-GRN-512").color("Forest Green").storage("512GB").price(999.99).stock(30).product(galaxy).build()
        );

        Product pixel = Product.builder()
            .code("PHONE-003").name("PurePhone 9").brand("NexaTech")
            .description("The smartest pure Android phone with AI-powered photography, seven years of updates, and clean software.")
            .basePrice(699.99).imageUrl("https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400")
            .featured(false).stockQuantity(80).averageRating(4).reviewCount(180).category(phones).build();
        productRepository.save(pixel);
        saveVariants(pixel,
            ProductVariant.builder().sku("PHONE-003-OBS-128").color("Obsidian").storage("128GB").price(699.99).stock(40).product(pixel).build(),
            ProductVariant.builder().sku("PHONE-003-HAZ-256").color("Hazel").storage("256GB").price(799.99).stock(25).product(pixel).build()
        );

        // --- Laptops ---
        Product macbook = Product.builder()
            .code("LAPTOP-001").name("UltraBook Pro 14").brand("AlphaTech")
            .description("Supercharged by the M3 Pro chip. With a stunning Liquid Retina XDR display, 18-hour battery life, and all the ports you need.")
            .basePrice(1999.99).imageUrl("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400")
            .featured(true).stockQuantity(60).averageRating(5).reviewCount(450).category(laptops).build();
        productRepository.save(macbook);
        saveVariants(macbook,
            ProductVariant.builder().sku("LAPTOP-001-SPC-18-512").color("Space Black").storage("18GB RAM / 512GB SSD").price(1999.99).stock(20).product(macbook).build(),
            ProductVariant.builder().sku("LAPTOP-001-SPC-36-1T").color("Space Black").storage("36GB RAM / 1TB SSD").price(2499.99).stock(15).product(macbook).build(),
            ProductVariant.builder().sku("LAPTOP-001-SLV-18-512").color("Silver").storage("18GB RAM / 512GB SSD").price(1999.99).stock(25).product(macbook).build()
        );

        Product dell = Product.builder()
            .code("LAPTOP-002").name("ProBook XPS 15").brand("DellTech")
            .description("The XPS 15 combines stunning OLED display technology with premium performance in an incredibly thin and light design.")
            .basePrice(1499.99).imageUrl("https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400")
            .featured(true).stockQuantity(45).averageRating(4).reviewCount(210).category(laptops).build();
        productRepository.save(dell);
        saveVariants(dell,
            ProductVariant.builder().sku("LAPTOP-002-PLT-16-512").color("Platinum Silver").storage("16GB RAM / 512GB SSD").price(1499.99).stock(20).product(dell).build(),
            ProductVariant.builder().sku("LAPTOP-002-PLT-32-1T").color("Platinum Silver").storage("32GB RAM / 1TB SSD").price(1799.99).stock(15).product(dell).build()
        );

        // --- Cameras ---
        Product sonyCamera = Product.builder()
            .code("CAM-001").name("VisionPro A7 IV").brand("SonyVision")
            .description("Full-frame mirrorless camera with 33MP sensor, real-time tracking, 10fps continuous shooting, and 4K 60p video.")
            .basePrice(2499.99).imageUrl("https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?w=400")
            .featured(true).stockQuantity(30).averageRating(5).reviewCount(290).category(cameras).build();
        productRepository.save(sonyCamera);

        // --- Headphones ---
        Product sonyWH = Product.builder()
            .code("HEAD-001").name("SoundMax WH-1000XM6").brand("SonyAudio")
            .description("Industry-leading noise cancelling with exceptional sound quality, 30-hour battery life, and comfortable all-day wear.")
            .basePrice(349.99).imageUrl("https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400")
            .featured(true).stockQuantity(200).averageRating(5).reviewCount(1200).category(headphones).build();
        productRepository.save(sonyWH);
        saveVariants(sonyWH,
            ProductVariant.builder().sku("HEAD-001-BLK").color("Midnight Black").storage(null).price(349.99).stock(100).product(sonyWH).build(),
            ProductVariant.builder().sku("HEAD-001-SLV").color("Platinum Silver").storage(null).price(349.99).stock(100).product(sonyWH).build()
        );

        Product airpods = Product.builder()
            .code("HEAD-002").name("AirBuds Pro 2").brand("AlphaTech")
            .description("Active noise cancellation, transparency mode, and adaptive audio. Personalised Spatial Audio with dynamic head tracking.")
            .basePrice(249.99).imageUrl("https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400")
            .featured(false).stockQuantity(300).averageRating(4).reviewCount(850).category(headphones).build();
        productRepository.save(airpods);

        // --- Tablets ---
        Product ipad = Product.builder()
            .code("TAB-001").name("SlateBook Pro 12.9").brand("AlphaTech")
            .description("Supercharged by the M2 chip. With the world's most advanced display, incredible performance, and all-day battery life.")
            .basePrice(1099.99).imageUrl("https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400")
            .featured(true).stockQuantity(70).averageRating(5).reviewCount(430).category(tablets).build();
        productRepository.save(ipad);
        saveVariants(ipad,
            ProductVariant.builder().sku("TAB-001-SPC-128").color("Space Grey").storage("128GB").price(1099.99).stock(25).product(ipad).build(),
            ProductVariant.builder().sku("TAB-001-SLV-256").color("Silver").storage("256GB").price(1299.99).stock(20).product(ipad).build(),
            ProductVariant.builder().sku("TAB-001-SPC-512").color("Space Grey").storage("512GB").price(1499.99).stock(15).product(ipad).build()
        );

        // --- Accessories ---
        Product charger = Product.builder()
            .code("ACC-001").name("HyperCharge 100W USB-C").brand("AlphaTech")
            .description("100W USB-C Power Adapter charges your laptop, tablet, or phone at maximum speed. Compact design with foldable plug.")
            .basePrice(49.99).imageUrl("https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400")
            .featured(false).stockQuantity(500).averageRating(4).reviewCount(320).category(accessories).build();
        productRepository.save(charger);

        Product case1 = Product.builder()
            .code("ACC-002").name("ArmorCase Pro").brand("GuardTech")
            .description("Military-grade drop protection with a slim profile. Compatible with wireless charging. Available for all major phone models.")
            .basePrice(39.99).imageUrl("https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400")
            .featured(false).stockQuantity(400).averageRating(4).reviewCount(180).category(accessories).build();
        productRepository.save(case1);
    }

    private void saveVariants(Product product, ProductVariant... variants) {
        for (ProductVariant v : variants) {
            product.getVariants().add(v);
        }
        productRepository.save(product);
    }

    private void seedDemoCustomer() {
        if (customerRepository.existsByEmail("demo@knack.com")) return;

        Customer demo = Customer.builder()
            .email("demo@knack.com")
            .password(passwordEncoder.encode("Demo@1234"))
            .firstName("Demo")
            .lastName("User")
            .phone("+91 9000000000")
            .defaultAddress(Address.builder()
                .firstName("Demo").lastName("User")
                .line1("123 Tech Park").line2("Block A")
                .city("Hyderabad").state("Telangana")
                .postcode("500081").country("India")
                .phone("+91 9000000000")
                .build())
            .build();
        customerRepository.save(demo);

        Cart cart = Cart.builder().customer(demo).build();
        cartRepository.save(cart);

        log.info("Demo customer created: demo@knack.com / Demo@1234");
    }
}
