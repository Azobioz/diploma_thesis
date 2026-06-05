package com.azobioz.aggregator.dto.notification;

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
    private String spaceName;
    private Long actorUserId;
    private String actorUserNickname;
    private String message;
    private String type;
    private boolean read;
    private LocalDateTime createdAt;
}
