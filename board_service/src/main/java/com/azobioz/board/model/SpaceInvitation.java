package com.azobioz.board.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "space_invitation")
public class SpaceInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token; // UUID-строка для ссылки

    @Column(nullable = false)
    private Long spaceId;

    @Column(nullable = false)
    private Long createdByUserId;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean used = false; // Одноразовое использование

    @ElementCollection
    @CollectionTable(name = "invitation_board_ids", joinColumns = @JoinColumn(name = "invitation_id"))
    @Column(name = "board_id")
    private List<Long> boardIds;

    @Column(name = "invitation_type")
    @Enumerated(EnumType.STRING)
    private InvitationType invitationType; // "SPACE" или "BOARD"
}
