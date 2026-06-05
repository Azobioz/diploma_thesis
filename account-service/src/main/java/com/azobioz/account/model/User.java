package com.azobioz.account.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@ToString(exclude = {"userSetting", "refreshToken"})
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "email")
    private String email;

    @Column(name = "password")
    private String password;

    @Column(name = "description")
    private String description;

    @Column(name = "avatar")
    private byte[] avatar;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @OneToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "user_setting_id")
    private UserSetting userSetting;

    @OneToOne(mappedBy = "user")
    private RefreshToken refreshToken;

}
