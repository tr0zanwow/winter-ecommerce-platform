package com.winter.platform.orderservice.infrastructure.adapters.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.winter.platform.orderservice.domain.models.Order;
import com.winter.platform.orderservice.domain.models.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderDatabaseSeeder implements CommandLineRunner {

    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    private static class CatalogItem {
        String sku;
        String name;
        double price;

        CatalogItem(String sku, String name, double price) {
            this.sku = sku;
            this.name = name;
            this.price = price;
        }
    }

    private static final List<CatalogItem> CATALOG = List.of(
            new CatalogItem("WNT-CSH-CRM01", "Classic Cashmere Crewneck", 189.0),
            new CatalogItem("WNT-ALP-FLC02", "Alpine Hybrid Fleece Jacket", 145.0),
            new CatalogItem("WNT-MRN-BL003", "Merino Wool Thermal Base Layer", 89.0),
            new CatalogItem("WNT-SKI-BIB04", "Alpine Technical Ski Bib", 249.0),
            new CatalogItem("WNT-ARC-PRK05", "Arctic Explorer Parka", 389.0),
            new CatalogItem("WNT-MRN-BLV06", "Summit Merino Balaclava", 45.0),
            new CatalogItem("WNT-PRK-COT07", "Winter Parka Coat", 320.0),
            new CatalogItem("WNT-GLC-GLV08", "Glacier Expedition Gloves", 79.0),
            new CatalogItem("WNT-CBL-BNI09", "Cascade Cable Knit Beanie", 35.0),
            new CatalogItem("WNT-TRM-SCK10", "Thermal Merino Wool Socks", 28.0)
    );

    private static final List<String> NAMES = List.of(
            "Alice Vance", "Bob Miller", "Charlie Smith", "Diana Prince", "Ethan Hunt",
            "Fiona Gallagher", "George Costanza", "Hannah Abbott", "Ian Malcolm", "Julia Roberts",
            "Kevin Bacon", "Laura Croft", "Michael Scott", "Nina Simone", "Oscar Martinez"
    );

    private static final List<String> CITIES = List.of(
            "Aspen", "Vail", "Park City", "Lake Tahoe", "Glacier Peak", "Jackson Hole",
            "St. Moritz", "Zermatt", "Chamonix", "Whistler", "Niseko", "Cortina"
    );

    @Override
    public void run(String... args) throws Exception {
        if (orderRepository.count() > 0) {
            log.info("Database already contains orders. Skipping programmatic seeding.");
            return;
        }

        log.info("Seeding database with 55 historically staggered orders...");
        Random random = new Random(42); // deterministic seed for reproducible orders
        List<Order> orders = new ArrayList<>();

        for (int i = 1; i <= 55; i++) {
            // Distribute status: 15 PENDING (1-15), 15 PROCESSING (16-30), 15 SHIPPED (31-45), 10 DELIVERED (46-55)
            OrderStatus status;
            if (i <= 15) {
                status = OrderStatus.PENDING;
            } else if (i <= 30) {
                status = OrderStatus.PROCESSING;
            } else if (i <= 45) {
                status = OrderStatus.SHIPPED;
            } else {
                status = OrderStatus.DELIVERED;
            }

            // Stagger creation dates historically
            LocalDateTime createdAt = LocalDateTime.now()
                    .minusDays(55 - i)
                    .minusHours(random.nextInt(12))
                    .minusMinutes(random.nextInt(60));

            // Select 1 to 3 distinct items
            int itemCount = 1 + random.nextInt(3);
            List<Map<String, Object>> items = new ArrayList<>();
            double subtotal = 0.0;
            int totalQty = 0;

            List<CatalogItem> pool = new ArrayList<>(CATALOG);
            for (int k = 0; k < itemCount; k++) {
                CatalogItem catalogItem = pool.remove(random.nextInt(pool.size()));
                int qty = 1 + random.nextInt(2);
                totalQty += qty;

                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("sku", catalogItem.sku);
                itemMap.put("name", catalogItem.name);
                itemMap.put("quantity", qty);
                itemMap.put("price", catalogItem.price);
                items.add(itemMap);

                subtotal += catalogItem.price * qty;
            }

            double tax = Math.round(subtotal * 0.1 * 100.0) / 100.0;
            double shippingFee = 15.0;
            double grandTotal = Math.round((subtotal + tax + shippingFee) * 100.0) / 100.0;

            String customerId = "CST-" + (1000 + random.nextInt(9000));
            String customerName = NAMES.get(random.nextInt(NAMES.size()));
            String street = (100 + random.nextInt(900)) + " Alpine Parkway";
            String city = CITIES.get(random.nextInt(CITIES.size()));
            String zip = String.format("%05d", 80000 + random.nextInt(19999));

            Map<String, String> addressMap = new HashMap<>();
            addressMap.put("fullName", customerName);
            addressMap.put("address", street);
            addressMap.put("city", city);
            addressMap.put("zipCode", zip);

            String itemsJson = objectMapper.writeValueAsString(items);
            String addressJson = objectMapper.writeValueAsString(addressMap);

            Order order = Order.builder()
                    .id("ORD-" + String.format("%06d", i))
                    .customerId(customerId)
                    .status(status)
                    .subtotal(subtotal)
                    .tax(tax)
                    .shippingFee(shippingFee)
                    .grandTotal(grandTotal)
                    .itemsCount(totalQty)
                    .shippingAddress(addressJson)
                    .itemsJson(itemsJson)
                    .createdAt(createdAt)
                    .build();

            orders.add(order);
        }

        orderRepository.saveAll(orders);
        log.info("Successfully seeded {} orders inside the managed RDS instance.", orderRepository.count());
    }
}
