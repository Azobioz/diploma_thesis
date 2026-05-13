package com.azobioz.aggregator.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class UserInfoDto {
    private Long userId;
    private String nickname;
    private String email;
    private String description;
    private byte[] avatar;
    private LocalDate createdAt;
}

