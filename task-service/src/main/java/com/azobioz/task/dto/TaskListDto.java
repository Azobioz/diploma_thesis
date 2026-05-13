package com.azobioz.task.dto;

import java.util.List;

public record TaskListDto (Long taskListId,
                           String taskListName,
                           List<ShortTaskDto> tasks
) { }
