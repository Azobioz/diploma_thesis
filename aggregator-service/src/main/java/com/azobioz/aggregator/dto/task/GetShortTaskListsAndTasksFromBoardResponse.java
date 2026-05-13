package com.azobioz.aggregator.dto.task;

import java.util.List;

public record GetShortTaskListsAndTasksFromBoardResponse(Long boardId,
                                                         List<ShortTaskListDto> taskLists) {
}
