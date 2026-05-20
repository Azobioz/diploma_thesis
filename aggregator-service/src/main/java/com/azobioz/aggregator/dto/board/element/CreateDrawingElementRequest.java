package com.azobioz.aggregator.dto.board.element;

import java.util.List;

public record CreateDrawingElementRequest(
        Integer x,
        Integer y,
        Integer z,
        Integer width,
        Integer height,
        String color,
        String tool,
        Integer strokeWidth,
        List<PointRequest> points
) { }
