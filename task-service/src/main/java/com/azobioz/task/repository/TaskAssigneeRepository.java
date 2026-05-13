package com.azobioz.task.repository;

import com.azobioz.task.model.Task;
import com.azobioz.task.model.TaskAssignee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, Long> {
    List<TaskAssignee> getTaskAssigneesByTask(Task task);

    TaskAssignee getTaskAssigneeByTask(Task task);

    TaskAssignee findByUserId(Long userId);
}
