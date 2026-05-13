package com.azobioz.board.dto.invite;

public record CreateInvitationRequest(
        Long expiresInDays // Если null, дефолт 7 дней
) {
}
