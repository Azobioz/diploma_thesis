package com.azobioz.task.model;


import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "task_list")
public class TaskList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name")
    private String taskListName;

    @Column(name = "board_id")
    private Long boardId;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "taskList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();

    @Override
    public String toString() {
        return "TaskList{" +
                "id=" + id +
                ", taskListName='" + taskListName + '\'' +
                ", boardId=" + boardId +
                '}';
    }
}
