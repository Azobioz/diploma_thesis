package com.azobioz.task.service;

import com.azobioz.task.dto.*;
import com.azobioz.task.model.*;
import com.azobioz.task.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskListRepository taskListRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskFileRepository taskFileRepository;


//    =============== POST ==================
    public CreateTaskListResponse createTaskList(Long boardId, CreateTaskListRequest request) {
        TaskList taskList = new TaskList();
        taskList.setTaskListName(request.taskListName());
        taskList.setBoardId(boardId);
        taskListRepository.save(taskList);

        return new CreateTaskListResponse(
                taskList.getId(),
                taskList.getTaskListName()
        );
    }

    public TaskDto createTask(Long taskListId, String taskName, String taskDescription,
                              String deadlineStr, Long createdByUserId, List<MultipartFile> files) {
        TaskList taskList = taskListRepository.findById(taskListId)
                .orElseThrow(() -> new RuntimeException("TaskList not found"));

        Task task = new Task();
        task.setTaskList(taskList);
        task.setTaskName(taskName);
        task.setTaskDescription(taskDescription != null ? taskDescription : "");
        task.setCreatedByUserId(createdByUserId);
        task.setIsTaskCompleted(false);

        // Парсим дедлайн
        if (deadlineStr != null && !deadlineStr.isEmpty()) {
            try {
                task.setTaskDeadline(LocalDateTime.parse(deadlineStr,
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            } catch (Exception e) {
                // Игнорируем некорректную дату
            }
        }

        taskRepository.save(task);

        // Сохраняем файлы
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    TaskFile taskFile = new TaskFile();
                    taskFile.setTask(task);
                    taskFile.setFileName(file.getOriginalFilename());
                    taskFile.setFileType(file.getContentType());
                    try {
                        taskFile.setFileData(file.getBytes());
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to read file", e);
                    }
                    taskFileRepository.save(taskFile);
                }
            }
        }
        return mapToTaskDto(task);
    }

    @Transactional(readOnly = true)
    public TaskDto mapToTaskDto(Task task) {
        List<TaskFileDto> files = taskFileRepository.findByTaskId(task.getId()).stream()
                .map(f -> new TaskFileDto(
                        f.getFileId(),
                        f.getFileName(),
                        f.getFileType(),
                        Base64.getEncoder().encodeToString(f.getFileData())
                ))
                .collect(Collectors.toList());

        return new TaskDto(
                task.getId(),
                task.getTaskName(),
                task.getTaskDescription(),
                task.getIsTaskCompleted(),
                task.getTaskDeadline(),
                task.getCreatedByUserId(),
                files
        );
    }

    public String takeTaskToExecution(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId).get();
        TaskAssignee taskAssignee = new TaskAssignee();

        taskAssignee.setTask(task);
        taskAssignee.setUserId(userId);
        task.getAssignees().add(taskAssignee);

        taskRepository.save(task); //сохраняет task и taskAssignee через каскад

        return "Task was assignee to user with id " + userId;
    }

    @Transactional
    public TaskDto completeTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Проверяем, что пользователь имеет право отмечать задачу
        // (создатель задачи или создатель пространства)
        if (!task.getCreatedByUserId().equals(userId)) {
            // Здесь можно добавить дополнительную проверку на создателя пространства
            // через запрос к account-service
            throw new SecurityException("Only task creator can mark task as completed");
        }

        task.setIsTaskCompleted(true);
        taskRepository.save(task);

        return mapToTaskDto(task);
    }

    public TaskCommentDto createComment(Long taskId, Long userId, CreateCommentInTaskRequest request) {
        Task task = taskRepository.findById(taskId).get();

        TaskComment taskComment = new TaskComment();
        taskComment.setTask(task);
        taskComment.setUserId(userId);
        taskComment.setMessage(request.message());
        taskComment.setCreatedAt(LocalDateTime.now());
        taskCommentRepository.save(taskComment);

        task.getComments().add(taskComment);
        taskRepository.save(task);

        return new TaskCommentDto(
                taskComment.getId(),
                taskComment.getMessage(),
                taskComment.getCreatedAt(),
                taskComment.getUserId()
        );
    }

//    =============== PUT ==================
    public String editTaskListName(Long taskListId, EditTaskListNameRequest request) {
        TaskList taskList = taskListRepository.findById(taskListId).orElse(null);

        String taskListOldName = taskList.getTaskListName();

        taskList.setTaskListName(request.taskListName());
        taskListRepository.save(taskList);

        return "Task list name was change from " + taskListOldName + " to " + request.taskListName();
    }

    public String editTask(Long taskId, EditTaskRequest request) {
        Task task = taskRepository.findById(taskId).get();

        if (request.newTaskName() != null) {
            task.setTaskName(request.newTaskName());
        }
        if (request.newTaskDescription() != null) {
            task.setTaskDescription(request.newTaskDescription());
        }
        if (request.newDeadline() != null) {
            task.setTaskDeadline(request.newDeadline());
        }
        taskRepository.save(task);

        return "Task with id " +  taskId + " was updated";
    }

    @Transactional
    public void moveTask(Long taskId, Long targetTaskListId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        TaskList targetList = taskListRepository.findById(targetTaskListId)
                .orElseThrow(() -> new RuntimeException("TaskList not found"));

        // Проверяем, что списки принадлежат одной доске
        if (!task.getTaskList().getBoardId().equals(targetList.getBoardId())) {
            throw new IllegalArgumentException("Cannot move task to list in different board");
        }

        // Перемещаем задачу
        task.setTaskList(targetList);
        taskRepository.save(task);
    }

//    =============== DELETE ==================
    public String deleteTaskList(Long taskListId) {
        TaskList taskList = taskListRepository.findById(taskListId).get();
        taskList.getTasks().removeAll(taskList.getTasks());

        String taskListName = taskList.getTaskListName();
        taskListRepository.deleteById(taskListId);

        return "Task list " + taskListName + " with id  " + taskListId + " was deleted";
    }

    public String deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId).get();
        task.getTaskList().getTasks().remove(task);

        String taskName = task.getTaskName();
        taskRepository.delete(task);

        return "Task " + taskName + " with id  " + taskId + " was deleted";
    }

    public String removeUserFromTask(Long taskId, Long userId) {
        TaskAssignee taskAssignee = taskAssigneeRepository.findByUserId(userId);
        Task task = taskRepository.findById(taskId).get();

        String taskName = task.getTaskName();

        taskAssigneeRepository.delete(taskAssignee);
        task.getAssignees().remove(taskAssignee);

        taskRepository.save(task);

        return "User with id " + userId + " was removed from task " + taskName + " with id " + taskId;

    }

//    =============== GET ==================

    @Transactional(readOnly = true)
    public TaskDetailDto getTaskDetail(Long taskId, Long currentUserId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Получаем ID исполнителей
        List<Long> assigneeIds = task.getAssignees().stream()
                .map(TaskAssignee::getUserId)
                .toList();

        // Получаем комментарии
        List<TaskComment> comments = taskCommentRepository.getTaskCommentsByTask(task);
        List<TaskCommentDto> commentDtos = comments.stream()
                .map(comment -> new TaskCommentDto(
                        comment.getId(),
                        comment.getMessage(),
                        comment.getCreatedAt(),
                        comment.getUserId()
                ))
                .toList();

        // Получаем прикрепленные файлы
        List<TaskFileDto> attachedFiles = taskFileRepository.findByTaskId(task.getId()).stream()
                .map(file -> new TaskFileDto(
                        file.getFileId(),
                        file.getFileName(),
                        file.getFileType(),
                        Base64.getEncoder().encodeToString(file.getFileData())
                ))
                .toList();

        return new TaskDetailDto(
                task.getId(),
                task.getTaskName(),
                task.getTaskDescription(),
                task.getTaskDeadline(),
                task.getIsTaskCompleted(),
                assigneeIds,  // ← ВАЖНО: передаем ID исполнителей
                commentDtos,
                task.getCreatedByUserId(),
                attachedFiles
        );
    }

    @Transactional(readOnly = true)
    public TaskDto getTaskById(Long taskId) {
        Task task = taskRepository.findById(taskId).get();

        return mapToTaskDto(task);
    }

    public GetTasksFromTaskListResponse getAllTasksFromTaskList(Long taskId) {
        TaskList taskList = taskListRepository.findById(taskId).get();
        List<Task> tasks = taskList.getTasks();

        return new GetTasksFromTaskListResponse(
                taskList.getId(),
                taskList.getTaskListName(),
                tasks.stream()
                        .map(this::mapToTaskDto)
                        .toList()
        );
    }

    public List<Long> getUsersIdsWhichTaskAssignee(Long taskId) {
        Task task = taskRepository.findById(taskId).get();

        return taskAssigneeRepository.getTaskAssigneesByTask(task).stream()
                .map(TaskAssignee::getUserId)
                .toList();
    }

    public GetTaskCommentsResponse getAllTaskComments(Long taskId) {
        Task task = taskRepository.findById(taskId).get();

        List<TaskComment> comments =  taskCommentRepository.getTaskCommentsByTask(task);

        return new GetTaskCommentsResponse(
                task.getId(),
                task.getTaskName(),
                comments.stream()
                        .map(comment -> new TaskCommentDto(
                                comment.getId(),
                                comment.getMessage(),
                                comment.getCreatedAt(),
                                comment.getUserId()))
                        .toList()
        );
    }

    public GetShortTaskListsAndTasksFromBoardResponse getAllShortTaskListsAndTasks(Long boardId) {
        List<TaskList> taskLists = taskListRepository.getTaskListsByBoardId(boardId);

        return  new GetShortTaskListsAndTasksFromBoardResponse(
                boardId,
                taskLists.stream()
                        .map(taskList -> new TaskListDto(
                                taskList.getId(),
                                taskList.getTaskListName(),
                                taskList.getTasks().stream()
                                        .map(task -> new ShortTaskDto(
                                                task.getId(),
                                                task.getTaskName(),
                                                task.getTaskDeadline(),
                                                task.getIsTaskCompleted(),
                                                task.getCreatedByUserId()
                                                )).toList()
                                )).toList()
                );
    }

}
