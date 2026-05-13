package com.azobioz.board.dto.invite;


import java.util.List;

public record CreateBoardInvitationRequest(
        List<Long> boardIds,
        Long expiresInDays
) {}