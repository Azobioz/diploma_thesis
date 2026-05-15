package com.azobioz.aggregator.dto.task;

public record TaskFileDto(
        Long fileId,
        String fileName,
        String fileType,
        String fileData // Base64 encoded
) {}