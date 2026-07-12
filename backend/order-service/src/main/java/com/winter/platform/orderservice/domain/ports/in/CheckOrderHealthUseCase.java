package com.winter.platform.orderservice.domain.ports.in;

import com.winter.platform.orderservice.domain.models.OrderHealthStatus;

public interface CheckOrderHealthUseCase {
    OrderHealthStatus executeHealthCheck();
}
