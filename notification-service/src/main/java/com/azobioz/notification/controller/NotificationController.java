package com.azobioz.notification.controller;

import com.azobioz.notification.dto.NotificationDto;
import com.azobioz.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/spaces/{spaceId}/users/{userId}")
    public ResponseEntity<List<NotificationDto>> getNotificationsForUserInSpace(
            @PathVariable Long spaceId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                notificationService.getNotificationsForUserInSpace(userId, spaceId)
        );
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<NotificationDto>> getAllNotificationsForUser(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                notificationService.getAllNotificationsForUser(userId)
        );
    }

    // Отметить все непрочитанные уведомления пользователя в пространстве как прочитанные
    @PutMapping("/spaces/{spaceId}/users/{userId}/mark-read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long spaceId,
            @PathVariable Long userId) {
        notificationService.markAllAsRead(userId, spaceId);
        return ResponseEntity.ok().build();
    }
}
