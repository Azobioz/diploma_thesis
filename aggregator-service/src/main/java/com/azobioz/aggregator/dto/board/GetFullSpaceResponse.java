package com.azobioz.aggregator.dto.board;

import java.time.LocalDate;
import java.util.List;

public record GetFullSpaceResponse(
        Long spaceId,
        String spaceName,
        String spaceDescription,
        Long spaceCreatedByUserId,
        LocalDate createdAt,
        List<BoardDto> boardList
) {
}
