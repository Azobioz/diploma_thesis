package com.azobioz.account.dto;

public record AuthResponse(TokenResponse tokenResponse, String refreshToken) {
}
