package com.azobioz.board.dto.element;

public record PointRequest(
        int x,
        int y,
        Integer orderIndex // Порядок точек важен для отрисовки линии (optional)
) { }
