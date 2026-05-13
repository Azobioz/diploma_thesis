package com.azobioz.task.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "task_files")
@Data
public class TaskFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fileId;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Lob
    @Column(name = "file_data", nullable = false)
    private byte[] fileData;

    @Column(name = "file_type")
    private String fileType;
}