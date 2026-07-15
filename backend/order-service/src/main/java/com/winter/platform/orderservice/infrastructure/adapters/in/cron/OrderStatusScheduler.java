package com.winter.platform.orderservice.infrastructure.adapters.in.cron;

import com.winter.platform.orderservice.domain.models.OrderStatus;
import com.winter.platform.orderservice.infrastructure.adapters.out.persistence.OrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Component
public class OrderStatusScheduler {

    private final OrderRepository orderRepository;

    public OrderStatusScheduler(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // Runs exactly every 5 minutes on the clock (0, 5, 10, 15...)
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void autoAdvancePendingOrders() {
        System.out.println("[CRON JOB START] [" + LocalDateTime.now() + "] Initiating automated 5-minute order state transition loop sweep...");
        
        int count = orderRepository.updateStatus(OrderStatus.PENDING, OrderStatus.PROCESSING);
        
        System.out.println("[CRON JOB SUCCESS] Successfully transitioned " + count + " orders from PENDING to PROCESSING.");
    }
}
