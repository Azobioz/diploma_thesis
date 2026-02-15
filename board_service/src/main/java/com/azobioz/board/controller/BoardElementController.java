package com.azobioz.board.controller;

import com.azobioz.board.model.Board;
import com.azobioz.board.model.BoardElement;
import com.azobioz.board.repository.BoardRepository;
import com.azobioz.board.service.BoardElementService;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/boards/{boardId}/elements")
@RequiredArgsConstructor
public class BoardElementController {

    private final BoardElementService boardElementService;
    private final BoardRepository boardRepository;

    @GetMapping
    public List<BoardElement> getElements(@PathVariable("boardId") Long boardId) {
        return boardElementService.getElements(boardId);
    }

    @PostMapping
    public BoardElement createElement(@PathVariable("boardId")  Long boardId, @RequestBody BoardElement element) {
        Board board = boardRepository.findBoardById(boardId);

        if (board == null) {
            throw new RuntimeException("Board not found");
        }

        element.setBoard(board);
        return boardElementService.createElement(element);
    }

    @PutMapping("/{elementId}")
    public BoardElement updateElement(@PathVariable("boardId")  Long boardId,
                                      @PathVariable("elementId")  Long elementId,
                                      @RequestBody BoardElement element) {
        Board board = boardRepository.findBoardById(boardId);

        if (board == null) {
            throw new RuntimeException("Board not found");
        }

        element.setId(elementId);
        element.setBoard(board);

        return boardElementService.updateElement(element);
    }
}