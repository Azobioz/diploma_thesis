package com.azobioz.aggregator.dto.task;

import java.util.List;

public record TaskListDto(Long taskListId,
                          String taskListName,
                          List<TaskDto> tasks) {
}
