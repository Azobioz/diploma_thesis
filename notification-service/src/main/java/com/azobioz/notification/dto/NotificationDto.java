package com.azobioz.notification.dto;

import com.azobioz.notification.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private Long recipientUserId;
    private Long spaceId;
    private Long actorUserId;
    private String message;
    private NotificationType type;
    private boolean read;
    private LocalDateTime createdAt;
}
