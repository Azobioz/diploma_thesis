package com.azobioz.task.contoller;

import com.azobioz.task.dto.*;
import com.azobioz.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

//  =================== POST ===========================
    @PostMapping("/{boardId}/tasklists/create")
    public CreateTaskListResponse createTaskList(@PathVariable("boardId") Long boardId,
                                                 @RequestBody CreateTaskListRequest request) {
       return taskService.createTaskList(boardId, request);
    }

    @PostMapping("/tasklists/{taskListId}/tasks/create")
    public ResponseEntity<TaskDto> createTask(
            @PathVariable Long taskListId,
            @RequestParam("taskName") String taskName,
            @RequestParam(value = "taskDescription", required = false) String taskDescription,
            @RequestParam(value = "deadline", required = false) String deadline,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {

        return ResponseEntity.ok(taskService.createTask(
                taskListId, taskName, taskDescription, deadline, userId, files
        ));
    }

    @PostMapping("/tasks/{taskId}/take")
    public String TakeTaskToExecution(@PathVariable("taskId") Long taskId,
                                      @RequestHeader("X-User-Id") Long userId) {
        return taskService.takeTaskToExecution(taskId, userId);
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<TaskDto> completeTask(
            @PathVariable Long taskId,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(taskService.completeTask(taskId, userId));
    }

    @PostMapping("/tasks/{taskId}/comments/create")
    public TaskCommentDto createComment(@PathVariable("taskId") Long taskId,
                                        @RequestHeader("X-User-Id") Long userId,
                                        @RequestBody CreateCommentInTaskRequest request) {
        return taskService.createComment(taskId, userId, request);
    }

//  =================== PUT ===========================
    @PutMapping("/tasklists/{taskListId}/edit")
    public String editTaskListName(@PathVariable("taskListId") Long taskListId,
                                   @RequestBody EditTaskListNameRequest request) {
        return taskService.editTaskListName(taskListId, request);
    }

    @PutMapping("/tasks/{taskId}/edit")
    public String editTask(@PathVariable("taskId") Long taskId,
                           @RequestBody EditTaskRequest request) {
        return taskService.editTask(taskId, request);
    }

//  =================== DELETE ===========================
    @DeleteMapping("/tasklists/{taskListId}/delete")
    public String deleteTaskList(@PathVariable("taskListId") Long taskListId) {
        return taskService.deleteTaskList(taskListId);
    }

    @DeleteMapping("/tasks/{taskId}/delete")
    public String deleteTask(@PathVariable("taskId") Long taskId) {
        return taskService.deleteTask(taskId);
    }

    @DeleteMapping("tasks/{taskId}/users/{userId}/remove")
    public String removeUserFromTask(@PathVariable("taskId") Long taskId, @PathVariable("userId") Long userId) {
        return taskService.removeUserFromTask(taskId, userId);
    }

//  =================== GET ===========================
    @GetMapping("/tasks/{taskId}")
    public TaskDto getTask(@PathVariable("taskId") Long taskId) {
        return taskService.getTaskById(taskId);
    }

    @GetMapping("/tasklists/{taskListId}/tasks")
    public GetTasksFromTaskListResponse getAllTasksFromTaskList(@PathVariable("taskListId") Long taskListId) {
        return taskService.getAllTasksFromTaskList(taskListId);
    }

    @GetMapping("/tasks/{taskId}/assignee")
    public List<Long> getAllUsersIdsWhichTaskAssignee(@PathVariable("taskId") Long taskId) {
        return taskService.getUsersIdsWhichTaskAssignee(taskId);
    }

    @GetMapping("/tasks/{taskId}/comments")
    public GetTaskCommentsResponse getAllCommentsFromTask(@PathVariable("taskId") Long taskId) {
        return taskService.getAllTaskComments(taskId);
    }

    @GetMapping("/{boardId}/tasklists")
    public GetShortTaskListsAndTasksFromBoardResponse getAllTaskListsAndTasks(@PathVariable("boardId") Long boardId) {
        return taskService.getAllShortTaskListsAndTasks(boardId);
    }

    @GetMapping("/tasks/{taskId}/detail")
    public ResponseEntity<TaskDetailDto> getTaskMiniPage(
            @PathVariable("taskId") Long taskId,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(taskService.getTaskDetail(taskId, userId));
    }

}
