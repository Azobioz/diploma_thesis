package com.azobioz.notification.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stub-сущность, которая ссылается на таблицу users из account-service.
 * Используется только для FK-связи в Notification — данные не изменяются этим сервисом.
 */
@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "nickname", insertable = false, updatable = false)
    private String nickname;
}
