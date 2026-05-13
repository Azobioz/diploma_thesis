package com.azobioz.board.dto.element;

import java.util.Map;

public record BoardElementDto(Long id,
                              String type,           // "SHAPE, TEXT, IMAGE и т. д."
                              int x,
                              int y,
                              int z,
                              int width,
                              int height,
                              String color,
                              Map<String, Object> element // сюда кладём специфические элементы
) { }
