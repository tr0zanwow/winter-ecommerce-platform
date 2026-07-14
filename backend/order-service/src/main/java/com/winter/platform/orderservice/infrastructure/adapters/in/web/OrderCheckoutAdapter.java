package com.winter.platform.orderservice.infrastructure.adapters.in.web;

import com.winter.platform.orderservice.domain.models.OrderCreatedEvent;
import com.winter.platform.orderservice.domain.models.OrderItemDTO;
import com.winter.platform.orderservice.infrastructure.adapters.out.messaging.OrderEventPublisherAdapter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderCheckoutAdapter {

    private final OrderEventPublisherAdapter orderEventPublisherAdapter;

    public OrderCheckoutAdapter(OrderEventPublisherAdapter orderEventPublisherAdapter) {
        this.orderEventPublisherAdapter = orderEventPublisherAdapter;
    }

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(@RequestBody CheckoutRequest request) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        double totalAmount = request.items().stream()
                .mapToDouble(item -> item.price() * item.quantity())
                .sum();

        List<OrderItemDTO> orderItems = request.items().stream()
                .map(item -> new OrderItemDTO(
                        UUID.randomUUID().toString(),
                        item.sku(),
                        item.quantity(),
                        item.price()
                ))
                .collect(Collectors.toList());

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

    // Request & Response structure helpers mapped to incoming JSON payload patterns
    public record CheckoutRequest(
            String customerId,
            List<CheckoutItem> items
    ) {}

    public record CheckoutItem(
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
