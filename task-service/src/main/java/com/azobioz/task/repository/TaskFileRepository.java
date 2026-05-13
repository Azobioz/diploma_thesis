package com.azobioz.task.repository;

import com.azobioz.task.model.TaskFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskFileRepository extends JpaRepository<TaskFile, Long> {
    List<TaskFile> findByTaskId(Long taskId);
}
