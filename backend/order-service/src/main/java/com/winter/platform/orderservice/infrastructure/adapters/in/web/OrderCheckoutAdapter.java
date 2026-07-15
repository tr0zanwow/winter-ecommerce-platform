package com.winter.platform.orderservice.infrastructure.adapters.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.winter.platform.orderservice.domain.models.Order;
import com.winter.platform.orderservice.domain.models.OrderCreatedEvent;
import com.winter.platform.orderservice.domain.models.OrderItemDTO;
import com.winter.platform.orderservice.domain.models.OrderStatus;
import com.winter.platform.orderservice.infrastructure.adapters.out.messaging.OrderEventPublisherAdapter;
import com.winter.platform.orderservice.infrastructure.adapters.out.persistence.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderCheckoutAdapter {

    private final OrderEventPublisherAdapter orderEventPublisherAdapter;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    public OrderCheckoutAdapter(OrderEventPublisherAdapter orderEventPublisherAdapter,
                                OrderRepository orderRepository,
                                ObjectMapper objectMapper) {
        this.orderEventPublisherAdapter = orderEventPublisherAdapter;
        this.orderRepository = orderRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(@RequestBody CheckoutRequest request) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        double totalAmount = request.items().stream()
                .mapToDouble(item -> item.price() * item.quantity())
                .sum();

        List<OrderItemDTO> orderItems = request.items().stream()
                .map(item -> new OrderItemDTO(
                        (item.productId() != null && !item.productId().isBlank()) ? item.productId() : UUID.randomUUID().toString(),
                        item.sku(),
                        item.quantity(),
                        item.price()
                ))
                .collect(Collectors.toList());

        // Serialize items and address to JSON for persistence
        String itemsJson = "";
        String addressJson = "";
        try {
            itemsJson = objectMapper.writeValueAsString(request.items());
            if (request.shippingAddress() != null) {
                addressJson = objectMapper.writeValueAsString(request.shippingAddress());
            } else {
                addressJson = "{\"fullName\":\"Guest Customer\",\"address\":\"123 Winter St\",\"city\":\"Glacier City\",\"zipCode\":\"98101\"}";
            }
        } catch (Exception e) {
            // fallback
            itemsJson = "[]";
            addressJson = "{}";
        }

        // Save order to RDS Postgres database
        double tax = Math.round(totalAmount * 0.1 * 100.0) / 100.0;
        double shippingFee = 15.0;
        double grandTotal = Math.round((totalAmount + tax + shippingFee) * 100.0) / 100.0;
        int totalQty = request.items().stream().mapToInt(CheckoutItem::quantity).sum();

        Order order = Order.builder()
                .id(orderId)
                .customerId(request.customerId())
                .status(OrderStatus.PENDING)
                .subtotal(totalAmount)
                .tax(tax)
                .shippingFee(shippingFee)
                .grandTotal(grandTotal)
                .itemsCount(totalQty)
                .shippingAddress(addressJson)
                .itemsJson(itemsJson)
                .createdAt(LocalDateTime.now())
                .build();

        orderRepository.save(order);

        OrderCreatedEvent event = new OrderCreatedEvent(
                orderId,
                request.customerId(),
                totalAmount,
                LocalDateTime.now(),
                orderItems
        );

        // Publish event to live AWS SNS topic
        orderEventPublisherAdapter.publishOrderCreatedEvent(event);

        CheckoutResponse response = new CheckoutResponse(
                "PENDING_PROCESSING",
                orderId,
                "Order transaction recorded. Asynchronous event dispatched to messaging hub."
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page,
                size,
                org.springframework.data.domain.Sort.by("createdAt").descending()
        );

        org.springframework.data.domain.Page<Order> orderPage;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orderPage = orderRepository.findByStatus(orderStatus, pageable);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid order status: " + status));
            }
        } else {
            orderPage = orderRepository.findAll(pageable);
        }

        return ResponseEntity.ok(orderPage.getContent());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable String orderId) {
        return orderRepository.findById(orderId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body(null));
    }

    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable String orderId) {
        java.util.Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Order not found"));
        }

        Order order = orderOpt.get();
        if (order.getStatus() != OrderStatus.PENDING) {
            return ResponseEntity.status(400).body(Map.of(
                    "message", "Cannot cancel order in " + order.getStatus() + " status. Only PENDING orders can be cancelled."
            ));
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        return ResponseEntity.ok(order);
    }

    // Request & Response structure helpers mapped to incoming JSON payload patterns
    public record CheckoutRequest(
            String customerId,
            List<CheckoutItem> items,
            Map<String, String> shippingAddress
    ) {}

    public record CheckoutItem(
            String productId,
            String sku,
            Integer quantity,
            Double price
    ) {}

    public record CheckoutResponse(
            String status,
            String orderId,
            String message
    ) {}
}
