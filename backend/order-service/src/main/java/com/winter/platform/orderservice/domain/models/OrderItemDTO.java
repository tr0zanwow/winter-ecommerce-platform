package com.winter.platform.orderservice.domain.models;

public record OrderItemDTO(
    String productId,
    String sku,
    Integer quantity,
    Double price
) {}
