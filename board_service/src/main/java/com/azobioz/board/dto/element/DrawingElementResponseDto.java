package com.azobioz.board.dto.element;

import java.util.Map;

public record DrawingElementResponseDto(Long id,
                                        String type,
                                        Integer x,
                                        Integer y,
                                        Integer z,
                                        Integer width,
                                        Integer height,
                                        Map<String, Object> element) {
}
