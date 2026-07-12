package com.winter.platform.orderservice.infrastructure.adapters.in.web;

import com.winter.platform.orderservice.domain.models.OrderHealthStatus;
import com.winter.platform.orderservice.domain.ports.in.CheckOrderHealthUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderHealthAdapter implements CheckOrderHealthUseCase {

    @Override
    public OrderHealthStatus executeHealthCheck() {
        return new OrderHealthStatus("ONLINE", "Java 21 LTS", "TRUE");
    }

    @GetMapping("/health")
    public ResponseEntity<OrderHealthStatus> getHealth() {
        return ResponseEntity.ok(executeHealthCheck());
    }
}
