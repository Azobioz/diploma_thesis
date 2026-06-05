package com.azobioz.notification.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stub-сущность, которая ссылается на таблицу space из board_service.
 * Используется только для FK-связи в Notification — данные не изменяются этим сервисом.
 */
@Entity
@Data
@Table(name = "space")
public class Space {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "name", insertable = false, updatable = false)
    private String name;
}
