package com.azobioz.task.repository;

import com.azobioz.task.model.Task;
import com.azobioz.task.model.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
    List<TaskComment> getTaskCommentsByTask(Task task);
}
