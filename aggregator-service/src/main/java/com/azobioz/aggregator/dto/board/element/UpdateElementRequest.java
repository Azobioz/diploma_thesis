package com.azobioz.aggregator.dto.board.element;

import java.util.List;
import java.util.Map;

public record UpdateElementRequest(Integer x,
                                   Integer y,
                                   Integer z,
                                   Integer width,
                                   Integer height,
                                   String color,
                                   String message,
                                   Long userId,
                                   String createdAt,
                                   List<Map<String, Object>> replies) {
}
