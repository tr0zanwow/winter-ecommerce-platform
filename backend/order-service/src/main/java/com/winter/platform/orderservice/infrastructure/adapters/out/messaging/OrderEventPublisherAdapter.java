package com.winter.platform.orderservice.infrastructure.adapters.out.messaging;

import com.winter.platform.orderservice.domain.models.OrderCreatedEvent;
import io.awspring.cloud.sns.core.SnsTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderEventPublisherAdapter {

    private final SnsTemplate snsTemplate;
    private static final String TOPIC_ARN = "arn:aws:sns:us-east-1:880252974759:WinterOrderEventsTopic";

    public OrderEventPublisherAdapter(SnsTemplate snsTemplate) {
        this.snsTemplate = snsTemplate;
    }

    public void publishOrderCreatedEvent(OrderCreatedEvent event) {
        try {
            snsTemplate.sendNotification(TOPIC_ARN, event, "Order Created");
        } catch (Exception e) {
            System.err.println("Error publishing OrderCreatedEvent to SNS: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
