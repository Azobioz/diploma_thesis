package com.azobioz.notification.repository;

import com.azobioz.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);

    List<Notification> findByRecipientUserIdAndSpaceIdOrderByCreatedAtDesc(Long recipientUserId, Long spaceId);
}
