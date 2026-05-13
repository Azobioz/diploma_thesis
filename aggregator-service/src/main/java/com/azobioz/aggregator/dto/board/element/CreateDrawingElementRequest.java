package com.azobioz.aggregator.dto.board.element;

import java.util.List;

public record CreateDrawingElementRequest(
        int x,
        int y,
        int z,
        int width,   // bounding box width
        int height,  // bounding box height
        String color,
        String tool,      // PENCIL, ERASER, LASSO
        int strokeWidth,
        List<PointRequest> points
) { }
