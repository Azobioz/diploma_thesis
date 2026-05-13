package com.azobioz.board.dto.element;

import com.azobioz.board.model.ToolType;

import java.util.List;

public record CreateDrawingElementRequest(
        int x,
        int y,
        int z,
        int width,   // bounding box width
        int height,  // bounding box height
        String color,
        ToolType tool,      // PENCIL, ERASER, LASSO
        int strokeWidth,
        List<PointRequest> points
) { }
