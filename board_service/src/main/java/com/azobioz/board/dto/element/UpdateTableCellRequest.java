package com.azobioz.board.dto.element;

public record UpdateTableCellRequest(int row,
                                     int col,
                                     String content,
                                     Integer fontSize,
                                     String fontFamily,
                                     Boolean isBold,
                                     Boolean isUnderline) {
}
