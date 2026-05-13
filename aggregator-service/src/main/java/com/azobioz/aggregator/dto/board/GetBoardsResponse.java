package com.azobioz.aggregator.dto.board;

import java.util.List;

public record GetBoardsResponse(Long spaceId, List<GetBoardResponse> boards) {
}
