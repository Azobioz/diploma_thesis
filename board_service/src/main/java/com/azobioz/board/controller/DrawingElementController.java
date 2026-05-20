package com.azobioz.board.controller;

import com.azobioz.board.dto.element.CreateDrawingElementRequest;
import com.azobioz.board.dto.element.DrawingElementResponseDto;
import com.azobioz.board.dto.element.UpdateDrawingElementRequest;
import com.azobioz.board.service.DrawingElementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/boards/{boardId}/elements/drawing")
@RequiredArgsConstructor
public class DrawingElementController {

    private final DrawingElementService drawingElementService;

    @PostMapping
    public ResponseEntity<DrawingElementResponseDto> createDrawing(
            @PathVariable Long boardId,
            @RequestBody CreateDrawingElementRequest request) {
        DrawingElementResponseDto response = drawingElementService.createDrawing(boardId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{elementId}")
    public ResponseEntity<DrawingElementResponseDto> updateDrawing(
            @PathVariable Long boardId,
            @PathVariable Long elementId,
            @RequestBody UpdateDrawingElementRequest request) {
        DrawingElementResponseDto response = drawingElementService.updateDrawing(boardId, elementId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{elementId}")
    public ResponseEntity<Void> deleteDrawing(
            @PathVariable Long boardId,
            @PathVariable Long elementId) {
        drawingElementService.deleteDrawing(elementId);
        return ResponseEntity.noContent().build();
    }
}
