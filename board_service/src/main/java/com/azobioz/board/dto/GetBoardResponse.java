package com.azobioz.board.dto;

import java.time.LocalDate;
import java.util.List;

public record GetBoardResponse(Long boardId,
                               String boardName,
                               LocalDate createdAt,
                               Long boardCreatedByUserId,
                               List<Long> idsOfUsersInBoard) {
}
