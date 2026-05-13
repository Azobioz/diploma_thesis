package com.azobioz.board.dto.element;

import java.util.List;

public record TableElementDto(Long tableId,
                              int rows,
                              int columns,
                              List<TableCellDto> cells) {
}
