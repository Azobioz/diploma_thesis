package com.azobioz.notification.kafka;

import com.azobioz.notification.event.UserAddedToSpaceEvent;
import com.azobioz.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationKafkaConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
            topics = "user-added-to-space",
            groupId = "notification-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleUserAddedToSpace(UserAddedToSpaceEvent event) {
        log.info("Received Kafka event [user-added-to-space]: {}", event);
        try {
            notificationService.processUserAddedToSpace(event);
        } catch (Exception e) {
            log.error("Failed to process user-added-to-space event: {}", e.getMessage(), e);
        }
    }
}
