package com.azobioz.task.dto;

import java.util.List;

public record GetShortTaskListsAndTasksFromBoardResponse(Long boardId,
                                                         List<TaskListDto> taskLists
) { }
