package com.azobioz.task.dto;

import java.util.List;

public record GetTaskCommentsResponse(Long taskId,
                                      String taskName,
                                      List<TaskCommentDto> comments
) { }
