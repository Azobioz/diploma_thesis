package com.azobioz.task.dto;

public record TaskFileDto(
        Long fileId,
        String fileName,
        String fileType,
        String fileData // Base64 encoded
) {}
