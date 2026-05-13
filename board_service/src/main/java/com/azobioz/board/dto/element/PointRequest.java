package com.azobioz.board.dto.element;

public record PointRequest(
        int x,
        int y,
        int orderIndex // Порядок точек важен для отрисовки линии
) { }
