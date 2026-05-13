package com.azobioz.board.dto;

import java.util.List;

public record GetBoardsResponse (Long spaceId, List<GetBoardResponse> boards) {
}
