package com.azobioz.board.dto;

import java.time.LocalDate;

public record BoardDto(Long boardId,
                       String boardName,
                       LocalDate createdAt,
                       Long boardCreatedByUserId,
                       Long spaceId) {
}
