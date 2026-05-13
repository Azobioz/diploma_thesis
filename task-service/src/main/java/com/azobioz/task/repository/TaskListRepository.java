package com.azobioz.task.repository;

import com.azobioz.task.model.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    List<TaskList> getTaskListsByBoardId(Long boardId);
}
