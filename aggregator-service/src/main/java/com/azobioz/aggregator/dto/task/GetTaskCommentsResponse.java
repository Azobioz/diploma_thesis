package com.azobioz.aggregator.dto.task;

import java.util.List;

public record GetTaskCommentsResponse(Long taskId,
                                      String taskName,
                                      List<TaskCommentDto> comments) {
}
