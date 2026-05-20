package com.azobioz.board.mapper;

import com.azobioz.board.dto.element.DrawingElementResponseDto;
import com.azobioz.board.model.BoardElement;
import com.azobioz.board.model.DrawingElement;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class DrawingElementMapper {

    public DrawingElementResponseDto toResponse(BoardElement boardElement, DrawingElement drawingElement) {
        Map<String, Object> elementData = new HashMap<>();
        elementData.put("pointsData", drawingElement.getPointsData());
        elementData.put("color", drawingElement.getColor());
        elementData.put("strokeWidth", drawingElement.getStrokeWidth());

        return new DrawingElementResponseDto(
                boardElement.getId(),
                "DRAWING",
                boardElement.getX(),
                boardElement.getY(),
                boardElement.getZ(),
                boardElement.getWidth(),
                boardElement.getHeight(),
                elementData
        );
    }
}
