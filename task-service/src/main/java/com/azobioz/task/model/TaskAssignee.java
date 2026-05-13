package com.azobioz.task.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "task_assignee")
public class TaskAssignee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
}
