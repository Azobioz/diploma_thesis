package com.azobioz.aggregator.dto.task;

import java.util.List;

public record ShortTaskListDto(Long taskListId,
                               String taskListName,
                               List<ShortTaskDto> tasks) {
}
