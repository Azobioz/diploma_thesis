package com.azobioz.aggregator.dto.board.element;

import java.util.Map;

public record BoardElementDto(Long id,
                              String type,           // "SHAPE"
                              int x,
                              int y,
                              int z,
                              int width,
                              int height,
                              String color,
                              Map<String, Object> element // сюда кладём специфические элементы
) { }
