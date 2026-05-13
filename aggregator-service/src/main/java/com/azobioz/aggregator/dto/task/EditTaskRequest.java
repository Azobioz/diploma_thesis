package com.azobioz.aggregator.dto.task;

import java.time.LocalDateTime;

public record EditTaskRequest(String newTaskName,
                              String newTaskDescription,
                              LocalDateTime newDeadline) {
}
