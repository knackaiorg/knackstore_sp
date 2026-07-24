package com.knack.store.config;

import com.knack.store.model.*;
import com.knack.store.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
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
    private final PromoCodeRepository promoCodeRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCategories();
        seedProducts();
        seedDemoCustomer();
        seedPromoCodes();
        seedOrders();
        log.info("Electronics Store data initialised successfully.");
    }

    private void seedCategories() {
        List<Category> categories = List.of(
            Category.builder().code("phones").name("Smartphones").description("Latest smartphones from top brands").imageUrl("https://picsum.photos/seed/cat-phones/800/600").build(),
            Category.builder().code("laptops").name("Laptops").description("High-performance laptops for work and play").imageUrl("https://picsum.photos/seed/cat-laptops/800/600").build(),
            Category.builder().code("cameras").name("Cameras").description("Professional and consumer cameras").imageUrl("https://picsum.photos/seed/cat-cameras/800/600").build(),
            Category.builder().code("headphones").name("Headphones").description("Premium audio headphones and earbuds").imageUrl("https://picsum.photos/seed/cat-headphones/800/600").build(),
            Category.builder().code("tablets").name("Tablets").description("Tablets for productivity and entertainment").imageUrl("https://picsum.photos/seed/cat-tablets/800/600").build(),
            Category.builder().code("accessories").name("Accessories").description("Cases, chargers, cables and more").imageUrl("https://picsum.photos/seed/cat-accessories/800/600").build()
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
            .basePrice(999.99).imageUrl("https://picsum.photos/seed/phone-001/800/600")
            .featured(true).stockQuantity(150).averageRating(5).reviewCount(320).category(phones).build();
        productRepository.save(iphone);
        saveVariants(iphone,
            ProductVariant.builder().sku("PHONE-001-BLK-128").color("Midnight Black").storage("128GB").price(999.99).stock(11).product(iphone).build(),
            ProductVariant.builder().sku("PHONE-001-SLV-256").color("Silver").storage("256GB").price(1099.99).stock(0).product(iphone).build(),
            ProductVariant.builder().sku("PHONE-001-GLD-512").color("Gold").storage("512GB").price(1299.99).stock(4).product(iphone).build()
        );

        Product galaxy = Product.builder()
            .code("PHONE-002").name("GalaxyEdge S25").brand("StellarTech")
            .description("Cutting-edge Android flagship with a 6.6-inch Dynamic AMOLED display, 200MP camera, and 5000mAh battery.")
            .basePrice(899.99).imageUrl("https://picsum.photos/seed/phone-002/800/600")
            .featured(true).stockQuantity(120).averageRating(4).reviewCount(210).category(phones).build();
        productRepository.save(galaxy);
        saveVariants(galaxy,
            ProductVariant.builder().sku("PHONE-002-PHN-256").color("Phantom Black").storage("256GB").price(899.99).stock(60).product(galaxy).build(),
            ProductVariant.builder().sku("PHONE-002-GRN-512").color("Forest Green").storage("512GB").price(999.99).stock(30).product(galaxy).build()
        );

        Product pixel = Product.builder()
            .code("PHONE-003").name("PurePhone 9").brand("NexaTech")
            .description("The smartest pure Android phone with AI-powered photography, seven years of updates, and clean software.")
            .basePrice(699.99).imageUrl("https://picsum.photos/seed/phone-003/800/600")
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
            .basePrice(1999.99).imageUrl("https://picsum.photos/seed/laptop-001/800/600")
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
            .basePrice(1499.99).imageUrl("https://picsum.photos/seed/laptop-002/800/600")
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
            .basePrice(2499.99).imageUrl("https://picsum.photos/seed/camera-001/800/600")
            .featured(true).stockQuantity(30).lowStockThreshold(35).averageRating(5).reviewCount(290).category(cameras).build();
        productRepository.save(sonyCamera);

        // --- Headphones ---
        Product sonyWH = Product.builder()
            .code("HEAD-001").name("SoundMax WH-1000XM6").brand("SonyAudio")
            .description("Industry-leading noise cancelling with exceptional sound quality, 30-hour battery life, and comfortable all-day wear.")
            .basePrice(349.99).imageUrl("https://picsum.photos/seed/head-001/800/600")
            .featured(true).stockQuantity(200).averageRating(5).reviewCount(1200).category(headphones).build();
        productRepository.save(sonyWH);
        saveVariants(sonyWH,
            ProductVariant.builder().sku("HEAD-001-BLK").color("Midnight Black").storage(null).price(349.99).stock(100).product(sonyWH).build(),
            ProductVariant.builder().sku("HEAD-001-SLV").color("Platinum Silver").storage(null).price(349.99).stock(100).product(sonyWH).build()
        );

        Product airpods = Product.builder()
            .code("HEAD-002").name("AirBuds Pro 2").brand("AlphaTech")
            .description("Active noise cancellation, transparency mode, and adaptive audio. Personalised Spatial Audio with dynamic head tracking.")
            .basePrice(249.99).imageUrl("https://picsum.photos/seed/head-002/800/600")
            .featured(false).stockQuantity(300).averageRating(4).reviewCount(850).category(headphones).build();
        productRepository.save(airpods);

        // --- Tablets ---
        Product ipad = Product.builder()
            .code("TAB-001").name("SlateBook Pro 12.9").brand("AlphaTech")
            .description("Supercharged by the M2 chip. With the world's most advanced display, incredible performance, and all-day battery life.")
            .basePrice(1099.99).imageUrl("https://picsum.photos/seed/tab-001/800/600")
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
            .basePrice(49.99).imageUrl("https://picsum.photos/seed/acc-001/800/600")
            .featured(false).stockQuantity(500).averageRating(4).reviewCount(320).category(accessories).build();
        productRepository.save(charger);

        Product case1 = Product.builder()
            .code("ACC-002").name("ArmorCase Pro").brand("GuardTech")
            .description("Military-grade drop protection with a slim profile. Compatible with wireless charging. Available for all major phone models.")
            .basePrice(39.99).imageUrl("https://picsum.photos/seed/acc-002/800/600")
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

    private void seedPromoCodes() {
        if (promoCodeRepository.count() > 0) return;

        List<PromoCode> promoCodes = List.of(
            PromoCode.builder()
                .code("WELCOME10")
                .discountType(PromoCode.DiscountType.PERCENTAGE)
                .discountValue(10.0)
                .minimumOrderAmount(500.0)
                .active(true)
                .build(),
            PromoCode.builder()
                .code("FLAT500")
                .discountType(PromoCode.DiscountType.FIXED)
                .discountValue(500.0)
                .minimumOrderAmount(2000.0)
                .active(true)
                .build(),
            PromoCode.builder()
                .code("SAVE20")
                .discountType(PromoCode.DiscountType.PERCENTAGE)
                .discountValue(20.0)
                .minimumOrderAmount(1000.0)
                .active(true)
                .build(),
            PromoCode.builder()
                .code("MEGA1000")
                .discountType(PromoCode.DiscountType.FIXED)
                .discountValue(1000.0)
                .minimumOrderAmount(5000.0)
                .active(true)
                .build(),
            PromoCode.builder()
                .code("FIRST15")
                .discountType(PromoCode.DiscountType.PERCENTAGE)
                .discountValue(15.0)
                .minimumOrderAmount(null) // No minimum for this percentage promo
                .active(true)
                .build(),
            // Expired/Inactive promo code
            PromoCode.builder()
                .code("COOL")
                .discountType(PromoCode.DiscountType.PERCENTAGE)
                .discountValue(25.0)
                .minimumOrderAmount(1500.0)
                .active(false) // Inactive/Expired code
                .build(),
            // Alphabetic-only promo code
            PromoCode.builder()
                .code("SUMMER")
                .discountType(PromoCode.DiscountType.PERCENTAGE)
                .discountValue(12.0)
                .minimumOrderAmount(800.0)
                .active(true)
                .build()
        );

        promoCodeRepository.saveAll(promoCodes);
        log.info("Seeded {} promo codes", promoCodes.size());
    }

    private void seedOrders() {
        if (orderRepository.count() > 0) return;

        Customer demo = customerRepository.findByEmail("demo@knack.com").orElse(null);
        if (demo == null) return;

        Address deliveryAddress = Address.builder()
                .firstName("Demo").lastName("User")
                .line1("123 Tech Park").line2("Block A")
                .city("Hyderabad").state("Telangana")
                .postcode("500081").country("India")
                .phone("+91 9000000000")
                .build();

        // Order 1 - PENDING
        Order order1 = Order.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(demo)
                .deliveryAddress(deliveryAddress)
                .status("PENDING")
                .subtotal(1349.98)
                .totalPrice(1349.98)
                .discountAmount(0.0)
                .paymentMethod("Credit Card")
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .placedDate(LocalDateTime.now().minusDays(1))
                .lastModifiedDate(LocalDateTime.now().minusDays(1))
                .deliveryDate(LocalDate.now().plusDays(7))
                .build();
        OrderEntry entry1a = OrderEntry.builder()
                .productCode("PHONE-001").productName("AlphaPhone Pro 15")
                .variantSku("PHONE-001-BLK-128").variantDescription("Midnight Black / 128GB")
                .quantity(1).unitPrice(999.99).totalPrice(999.99).order(order1).build();
        OrderEntry entry1b = OrderEntry.builder()
                .productCode("HEAD-001").productName("SoundMax WH-1000XM6")
                .variantSku("HEAD-001-BLK").variantDescription("Midnight Black")
                .quantity(1).unitPrice(349.99).totalPrice(349.99).order(order1).build();
        order1.setEntries(List.of(entry1a, entry1b));
        orderRepository.save(order1);

        // Order 2 - CONFIRMED
        Order order2 = Order.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(demo)
                .deliveryAddress(deliveryAddress)
                .status("CONFIRMED")
                .subtotal(1999.99)
                .appliedPromoCode("WELCOME10")
                .discountAmount(200.0)
                .totalPrice(1799.99)
                .paymentMethod("Debit Card")
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .placedDate(LocalDateTime.now().minusDays(3))
                .lastModifiedDate(LocalDateTime.now().minusDays(2))
                .deliveryDate(LocalDate.now().plusDays(5))
                .build();
        OrderEntry entry2a = OrderEntry.builder()
                .productCode("LAPTOP-001").productName("UltraBook Pro 14")
                .variantSku("LAPTOP-001-SPC-18-512").variantDescription("Space Black / 18GB RAM / 512GB SSD")
                .quantity(1).unitPrice(1999.99).totalPrice(1999.99).order(order2).build();
        order2.setEntries(List.of(entry2a));
        orderRepository.save(order2);

        // Order 3 - SHIPPED
        Order order3 = Order.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(demo)
                .deliveryAddress(deliveryAddress)
                .status("SHIPPED")
                .subtotal(899.99)
                .totalPrice(899.99)
                .discountAmount(0.0)
                .paymentMethod("UPI")
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .placedDate(LocalDateTime.now().minusDays(5))
                .lastModifiedDate(LocalDateTime.now().minusDays(2))
                .deliveryDate(LocalDate.now().plusDays(2))
                .build();
        OrderEntry entry3a = OrderEntry.builder()
                .productCode("PHONE-002").productName("GalaxyEdge S25")
                .variantSku("PHONE-002-PHN-256").variantDescription("Phantom Black / 256GB")
                .quantity(1).unitPrice(899.99).totalPrice(899.99).order(order3).build();
        order3.setEntries(List.of(entry3a));
        orderRepository.save(order3);

        // Order 4 - OUT_FOR_DELIVERY
        Order order4 = Order.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(demo)
                .deliveryAddress(deliveryAddress)
                .status("Out for Delivery")
                .subtotal(2499.99)
                .totalPrice(2499.99)
                .discountAmount(0.0)
                .paymentMethod("Credit Card")
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .placedDate(LocalDateTime.now().minusDays(7))
                .lastModifiedDate(LocalDateTime.now())
                .deliveryDate(LocalDate.now())
                .build();
        OrderEntry entry4a = OrderEntry.builder()
                .productCode("CAM-001").productName("VisionPro A7 IV")
                .quantity(1).unitPrice(2499.99).totalPrice(2499.99).order(order4).build();
        order4.setEntries(List.of(entry4a));
        orderRepository.save(order4);

        // Order 5 - DELIVERED
        Order order5 = Order.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(demo)
                .deliveryAddress(deliveryAddress)
                .status("DELIVERED")
                .subtotal(1349.98)
                .appliedPromoCode("SAVE20")
                .discountAmount(270.0)
                .totalPrice(1079.98)
                .paymentMethod("Net Banking")
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .placedDate(LocalDateTime.now().minusDays(14))
                .lastModifiedDate(LocalDateTime.now().minusDays(7))
                .deliveryDate(LocalDate.now().minusDays(7))
                .build();
        OrderEntry entry5a = OrderEntry.builder()
                .productCode("TAB-001").productName("SlateBook Pro 12.9")
                .variantSku("TAB-001-SPC-128").variantDescription("Space Grey / 128GB")
                .quantity(1).unitPrice(1099.99).totalPrice(1099.99).order(order5).build();
        OrderEntry entry5b = OrderEntry.builder()
                .productCode("HEAD-002").productName("AirBuds Pro 2")
                .quantity(1).unitPrice(249.99).totalPrice(249.99).order(order5).build();
        order5.setEntries(List.of(entry5a, entry5b));
        orderRepository.save(order5);

        log.info("Seeded 5 demo orders with statuses: PENDING, CONFIRMED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED");
    }
}
