package com.azobioz.account.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private Long userId;
    private String tokenType = "Bearer";
    private long expiresIn; // в секундах

}
