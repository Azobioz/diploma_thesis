package com.azobioz.board.controller;


import com.azobioz.board.dto.*;
import com.azobioz.board.dto.invite.InvitationLinkResponse;
import com.azobioz.board.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/spaces/{spaceId}/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    //================ POST ========================
    @PostMapping("/create")
    public CreateBoardResponse createBoard(@PathVariable("spaceId") Long spaceId, @RequestHeader("X-User-Id") Long userId, @RequestBody BoardRequest request) {
        return boardService.createBoard(request, spaceId, userId);
    }

    // Для обновления last_view_at при переходе на доску
    @PostMapping("/{boardId}/view")
    public String updateLastViewedAt(
            @PathVariable("spaceId") Long spaceId,
            @PathVariable("boardId") Long boardId,
            @RequestHeader("X-User-Id") Long userId) {
        boardService.updateLastViewedAt(boardId, userId);
        return "Last viewed at updated";
    }

    //================ GET ========================

    // для получения досок с фильтрацией и сортировкой
    @GetMapping("/filtered")
    public GetBoardsResponse getFilteredBoards(
            @PathVariable("spaceId") Long spaceId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false, defaultValue = "all") String filter,
            @RequestParam(required = false, defaultValue = "recent") String sort) {
        return boardService.getFilteredBoards(spaceId, userId, filter, sort);
    }

    @GetMapping("/{boardId}")
    public GetBoardResponse getBoard(@PathVariable("boardId") Long boardId) {
        return boardService.getBoard(boardId);
    }

    @GetMapping
    public GetBoardsResponse getBoards(@PathVariable("spaceId") Long spaceId) {
        return boardService.getBoards(spaceId);
    }

    // Получить доски пользователя
    @GetMapping("/users/{userId}/created-boards")
    public List<BoardDto> getUserCreatedBoards(@PathVariable("userId") Long userId) {
        return boardService.getBoardsCreatedByUser(userId);
    }

    @GetMapping("/users/{userId}/boards")
    public ResponseEntity<List<Long>> getUserBoardIds(@PathVariable Long userId) {
        return ResponseEntity.ok(boardService.getUserBoardIds(userId));
    }

    //================ PUT ========================
    @PutMapping("/{boardId}/edit")
    public String editBoardName(@PathVariable("boardId") Long boardId, @RequestHeader("X-User-Id") Long userId, @RequestBody UpdateBoardNameRequest request, @PathVariable("spaceId") Long spaceId) {
        return boardService.updateBoardName(boardId, userId, request.boardName());
    }

    //================ DELETE ========================
    @DeleteMapping("/{boardId}/delete")
    public String deleteBoard(@PathVariable("boardId") Long boardId, @RequestHeader("X-User-Id") Long userId) {
        return boardService.deleteBoard(boardId, userId);
    }



}
