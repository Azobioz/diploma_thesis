package com.azobioz.board.controller;

import com.azobioz.board.dto.element.*;
import com.azobioz.board.repository.BoardRepository;
import com.azobioz.board.service.BoardElementService;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/internal/boards/{boardId}/elements")
@RequiredArgsConstructor
public class BoardElementController {

    private final BoardElementService boardElementService;
    private final BoardRepository boardRepository;


    // ================== POST ===============================
    @PostMapping("/shape")
    public BoardElementDto createShapeElement(@PathVariable("boardId") Long boardId,
                                              @RequestBody CreateShapeElementRequest request) {
        return boardElementService.createShapeElement(boardId, request);
    }

    @PostMapping("/arrow")
    public BoardElementDto createArrowElement(
            @PathVariable Long boardId,
            @RequestBody CreateArrowElementRequest request) {

        return boardElementService.createArrowElement(boardId, request);
    }

    @PostMapping("/text")
    public BoardElementDto createTextElement(
            @PathVariable Long boardId,
            @RequestBody CreateTextElementRequest request) {

        return boardElementService.createTextElement(boardId, request);
    }

    @PostMapping("/image")
    public BoardElementDto createImageElement(
            @PathVariable Long boardId,
            @RequestParam("file") MultipartFile file,
            @ModelAttribute CreateImageElementRequest request) {

        return boardElementService.createImageElement(boardId, file, request);
    }

    @PostMapping("/table")
    public BoardElementDto createTableElement(
            @PathVariable Long boardId,
            @RequestBody CreateTableElementRequest request) {

        return boardElementService.createTableElement(boardId, request);
    }

    @PostMapping("/drawing")
    public BoardElementDto createDrawingElement(
            @PathVariable("boardId") Long boardId,
            @RequestBody CreateDrawingElementRequest request) {
        return boardElementService.createDrawingElement(boardId, request);
    }

    @PostMapping("/comment")
    public BoardElementDto createCommentElement(
            @PathVariable("boardId") Long boardId,
            @RequestBody CreateCommentElementRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return boardElementService.createCommentElement(boardId, request, userId);
    }

    @PostMapping("/comment/{commentElementId}/reply")
    public CommentReplyDto addCommentReply(
            @PathVariable("boardId") Long boardId,
            @PathVariable("commentElementId") Long commentElementId,
            @RequestBody AddCommentReplyRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return boardElementService.addCommentReply(boardId, commentElementId, request, userId);
    }

    // ================== PUT ===============================
    @PutMapping("/table/{tableElementId}/cell")
    public TableCellDto updateTableCell(
            @PathVariable("boardId") Long boardId,
            @PathVariable("tableElementId") Long tableElementId,
            @RequestBody UpdateTableCellRequest request) {
        return boardElementService.updateTableCell(boardId, tableElementId, request);
    }

    @PutMapping("/shape/{elementId}")
    public BoardElementDto updateShapeElement(@PathVariable("boardId") Long boardId,
                                              @PathVariable("elementId") Long elementId,
                                              @RequestBody UpdateShapeElementRequest request) {
        return boardElementService.updateShapeElement(boardId, elementId, request);
    }

    @PutMapping("/arrow/{elementId}")
    public BoardElementDto updateArrowElement(@PathVariable("boardId") Long boardId,
                                              @PathVariable("elementId") Long elementId,
                                              @RequestBody UpdateArrowElementRequest request) {
        return boardElementService.updateArrowElement(boardId, elementId, request);
    }

    @PutMapping("/text/{elementId}")
    public BoardElementDto updateTextElement(@PathVariable("boardId") Long boardId,
                                             @PathVariable("elementId") Long elementId,
                                             @RequestBody UpdateTextElementRequest request) {
        return boardElementService.updateTextElement(boardId, elementId, request);
    }

    @PutMapping("/drawing/{elementId}")
    public BoardElementDto updateDrawingElement(@PathVariable("boardId") Long boardId,
                                                @PathVariable("elementId") Long elementId,
                                                @RequestBody UpdateDrawingElementRequest request) {
        return boardElementService.updateDrawingElement(boardId, elementId, request);
    }

    @PutMapping("/{elementId}")
    public BoardElementDto updateElement(@PathVariable("boardId") Long boardId,
                                         @PathVariable("elementId") Long elementId,
                                         @RequestBody UpdateElementRequest request) {
        return boardElementService.updateElement(boardId, elementId, request);
    }

    // ================== GET ===============================
    @GetMapping
    public List<BoardElementDto> getAllElements(@PathVariable("boardId") Long boardId) {
        return boardElementService.getAllElements(boardId);
    }

    @GetMapping("/table/{tableElementId}")
    public BoardElementDto getTableElement(@PathVariable("boardId") Long boardId, @PathVariable("tableElementId") Long tableElementId) {
        return boardElementService.getTableElement(boardId, tableElementId);
    }

    // ================== DELETE ===============================
    @DeleteMapping("/{elementId}")
    public String deleteElement(@PathVariable("boardId") Long boardId, @PathVariable("elementId") Long elementId) {
        return boardElementService.deleteElement(boardId, elementId);
    }

}