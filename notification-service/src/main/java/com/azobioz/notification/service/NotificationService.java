package com.azobioz.notification.service;

import com.azobioz.notification.dto.NotificationDto;
import com.azobioz.notification.event.UserAddedToSpaceEvent;
import com.azobioz.notification.model.Notification;
import com.azobioz.notification.model.NotificationType;
import com.azobioz.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void processUserAddedToSpace(UserAddedToSpaceEvent event) {
        log.info("Processing user-added-to-space event: userId={}, spaceId={}",
                event.getAddedUserId(), event.getSpaceId());

        Notification notification = new Notification();
        notification.setRecipientUserId(event.getSpaceCreatorId());
        notification.setSpaceId(event.getSpaceId());
        notification.setActorUserId(event.getAddedUserId());
        // Временное сообщение — агрегатор перезапишет его с реальным nickname
        notification.setMessage("USER_ADDED:" + event.getAddedUserId());
        notification.setType(NotificationType.USER_ADDED_TO_SPACE);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);
        log.info("Notification saved for spaceCreator={}", event.getSpaceCreatorId());
    }

    public List<NotificationDto> getNotificationsForUserInSpace(Long userId, Long spaceId) {
        return notificationRepository
                .findByRecipientUserIdAndSpaceIdOrderByCreatedAtDesc(userId, spaceId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<NotificationDto> getAllNotificationsForUser(Long userId) {
        return notificationRepository
                .findByRecipientUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAllAsRead(Long userId, Long spaceId) {
        List<Notification> unread = notificationRepository
                .findByRecipientUserIdAndSpaceIdOrderByCreatedAtDesc(userId, spaceId)
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getRecipientUserId(),
                n.getSpaceId(),
                n.getActorUserId(),
                n.getMessage(),
                n.getType(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
