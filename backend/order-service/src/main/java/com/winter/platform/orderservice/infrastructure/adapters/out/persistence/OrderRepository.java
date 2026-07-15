package com.winter.platform.orderservice.infrastructure.adapters.out.persistence;

import com.winter.platform.orderservice.domain.models.Order;
import com.winter.platform.orderservice.domain.models.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}
