package com.azobioz.board.dto;

import java.util.List;

public record CreateBoardResponse(Long boardId,
                                  String boardName,
                                  List<UserIdInBoardWithRoleDto> addedUsersInBoardIds) {
}
