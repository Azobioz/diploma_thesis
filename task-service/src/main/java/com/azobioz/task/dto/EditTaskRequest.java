package com.azobioz.task.dto;

import java.time.LocalDateTime;

public record EditTaskRequest(String newTaskName,
                              String newTaskDescription,
                              LocalDateTime newDeadline
) { }
