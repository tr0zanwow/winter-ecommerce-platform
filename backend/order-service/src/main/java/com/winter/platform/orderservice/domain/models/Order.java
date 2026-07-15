package com.winter.platform.orderservice.domain.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    private String id;

    private String customerId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private double subtotal;
    private double tax;
    private double shippingFee;
    private double grandTotal;
    private int itemsCount;

    @Column(columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(columnDefinition = "TEXT")
    private String itemsJson;

    private LocalDateTime createdAt;
}
