package com.azobioz.board.controller;


import com.azobioz.board.dto.BoardRequest;
import com.azobioz.board.dto.GetBoardResponse;
import com.azobioz.board.dto.GetBoardsResponse;
import com.azobioz.board.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping("/create")
    public GetBoardResponse createBoard(@RequestBody BoardRequest request) {
        return boardService.createUser(request);
    }

    @GetMapping("/{id}")
    public GetBoardResponse getBoard(@PathVariable("id") Long id) {
        return boardService.getBoardById(id);
    }

    @GetMapping
    public List<GetBoardsResponse> getBoards() {
        return boardService.getBoards();
    }

    @PutMapping("/{id}/edit")
    public GetBoardResponse editBoard(@PathVariable("id") Long id, @RequestBody BoardRequest request) {
        return boardService.editBoard(id, request);
    }

    @DeleteMapping("/{id}/delete")
    public String deleteBoard(@PathVariable("id") Long id) {
        return boardService.deleteBoardById(id);
    }

}
