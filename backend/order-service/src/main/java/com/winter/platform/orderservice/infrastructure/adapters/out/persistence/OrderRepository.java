package com.winter.platform.orderservice.infrastructure.adapters.out.persistence;

import com.winter.platform.orderservice.domain.models.Order;
import com.winter.platform.orderservice.domain.models.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    List<Order> findByStatus(OrderStatus status);

    @Modifying
    @Query("UPDATE Order o SET o.status = :newStatus WHERE o.status = :oldStatus")
    int updateStatus(@Param("oldStatus") OrderStatus oldStatus, @Param("newStatus") OrderStatus newStatus);
}

