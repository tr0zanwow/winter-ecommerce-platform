package com.winter.platform.orderservice.domain.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderHealthStatus {
    private String status;
    private String runtimeEngine;
    private String virtualThreadsActive;
}
