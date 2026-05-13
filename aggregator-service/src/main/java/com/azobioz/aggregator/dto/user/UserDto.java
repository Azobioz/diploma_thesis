package com.azobioz.aggregator.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserDto {
    private Long userId;
    private String nickname;
    private byte[] avatar;
}
