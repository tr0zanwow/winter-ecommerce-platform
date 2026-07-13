package com.winter.platform.orderservice.domain.models;

import java.time.LocalDateTime;
import java.util.List;

public record OrderCreatedEvent(
    String orderId,
    String customerId,
    Double totalAmount,
    LocalDateTime createdAt,
    List<OrderItemDTO> items
) {}
