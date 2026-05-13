package com.azobioz.aggregator.dto.board.element;

import java.util.List;

public record TableElementDto(Long tableId,
                              int rows,
                              int columns,
                              List<TableCellDto> cells) {
}
