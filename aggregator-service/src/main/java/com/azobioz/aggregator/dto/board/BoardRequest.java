package com.azobioz.aggregator.dto.board;

import java.util.List;

public record BoardRequest(
        String boardName,
        List<Long> addedUsersInBoardIds
) {
}
