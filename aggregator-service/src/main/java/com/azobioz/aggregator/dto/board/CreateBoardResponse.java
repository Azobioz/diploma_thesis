package com.azobioz.aggregator.dto.board;

import java.util.List;

public record CreateBoardResponse(Long boardId,
                                  String boardName,
                                  List<UserIdInBoardWithRoleDto> participants) {
}
