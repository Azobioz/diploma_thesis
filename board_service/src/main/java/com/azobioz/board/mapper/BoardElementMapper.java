package com.azobioz.board.mapper;

import com.azobioz.board.dto.element.BoardElementDto;
import com.azobioz.board.dto.element.TableCellDto;
import com.azobioz.board.model.*;

import java.util.List;
import java.util.Map;

import static com.azobioz.board.model.Element.*;

public class BoardElementMapper {

    public static BoardElementDto mapToBoardElementDto(BoardElement boardElement) {
        Map<String, Object> elementData = switch (boardElement.getType()) {
            case SHAPE -> {
                ShapeElement shape = boardElement.getShapeElement();
                yield Map.of(
                        "shapeType", shape.getShapeType().name(),
                        "borderColor", shape.getBorderColor() != null ? shape.getBorderColor() : "#000000",
                        "fillColor", shape.getFillColor() != null ? shape.getFillColor() : "#ffffff",
                        "text", shape.getText() != null ? shape.getText() : ""
                );
            }
            case ARROW -> {
                ArrowElement arrow = boardElement.getArrowElement();
                yield Map.of(
                        "startX", arrow.getStartX(),
                        "startY", arrow.getStartY(),
                        "endX", arrow.getEndX(),
                        "endY", arrow.getEndY()
                );
            }
            case TEXT -> {
                TextElement text = boardElement.getTextElement();
                yield Map.of(
                        "content", text.getContent(),
                        "fontSize", text.getFontSize(),
                        "fontFamily", text.getFontFamily() != null ? text.getFontFamily() : "Arial"
                );
            }
            case TABLE -> {
                TableElement table = boardElement.getTableElement();
                List<TableCellDto> cells = table.getTableCells().stream()
                        .map(cell -> new TableCellDto(
                                cell.getId(),
                                cell.getRow(),
                                cell.getCol(),
                                cell.getContent() != null ? cell.getContent() : ""
                        ))
                        .toList();
                yield Map.of(
                        "tableId", table.getId(),
                        "rows", table.getRows(),
                        "columns", table.getColumns(),
                        "cells", cells
                );
            }
            case IMAGE -> {
                ImageElement image = boardElement.getImageElement();
                yield Map.of(
                        "hasImage", image.getImage() != null && image.getImage().length > 0,
                        "imageSize", image.getImage() != null ? image.getImage().length : 0
                );
            }
            default -> Map.of();
        };

        return new BoardElementDto(
                boardElement.getId(),
                boardElement.getType().name(),
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                boardElement.getColor(),
                elementData
        );
    }
}
