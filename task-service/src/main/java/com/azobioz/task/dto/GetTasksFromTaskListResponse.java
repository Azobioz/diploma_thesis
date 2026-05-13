package com.azobioz.task.dto;

import java.util.List;

public record GetTasksFromTaskListResponse(Long taskListId,
                                           String taskListName,
                                           List<TaskDto> allTasks
) { }
