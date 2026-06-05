package com.azobioz.account.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@ToString(exclude = "user")
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "token")
    private String refreshToken;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "revoked")
    private boolean revoked;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;


}
