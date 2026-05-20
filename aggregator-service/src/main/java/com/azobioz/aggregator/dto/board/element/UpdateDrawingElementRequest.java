package com.azobioz.aggregator.dto.board.element;

import java.util.List;

public record UpdateDrawingElementRequest(Integer x,
                                          Integer y,
                                          Integer z,
                                          Integer width,
                                          Integer height,
                                          String color,
                                          Integer strokeWidth,
                                          List<PointRequest> points) {
}
