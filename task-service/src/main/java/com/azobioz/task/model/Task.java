package com.azobioz.task.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "task")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name")
    private String taskName;

    @Column(name = "description")
    private String taskDescription;

    @Column(name = "completed")
    private Boolean isTaskCompleted;

    @Column(name = "deadline")
    private LocalDateTime taskDeadline;

    @Column(name = "user_id")
    private Long createdByUserId;

    @ManyToOne
    @JoinColumn(name = "task_list_id")
    private TaskList taskList;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TaskAssignee> assignees = new ArrayList<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TaskFile> files = new ArrayList<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TaskComment> comments;

    @Override
    public String toString() {
        return "Task{" +
                "id=" + id +
                ", taskName='" + taskName + '\'' +
                ", taskDescription='" + taskDescription + '\'' +
                ", isTaskCompleted=" + isTaskCompleted +
                ", taskDeadline=" + taskDeadline +
                ", createdByUserId=" + createdByUserId +
                ", taskList=" + taskList +
                '}';
    }
}
