package com.azobioz.account.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "user_setting")
public class UserSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "animation")
    private boolean animation;

    @Column(name = "theme")
    @Enumerated(EnumType.STRING)
    private Theme theme;

    @Column(name = "language")
    @Enumerated(EnumType.STRING)
    private Language language;

    @OneToOne(mappedBy = "userSetting")
    private User user;

}
