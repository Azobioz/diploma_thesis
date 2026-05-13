package com.azobioz.board.controller;

import com.azobioz.board.dto.*;
import com.azobioz.board.service.BoardService;
import com.azobioz.board.service.SpaceService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/spaces")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;
    private final BoardService boardService;

    @PostMapping("/create")
    public GetShortSpaceResponse createSpace(@RequestBody CreateSpaceRequest request, @RequestHeader("X-User-Id") Long userId) {
        return spaceService.createSpace(request, userId);
    }

    @PutMapping("/{spaceId}/edit")
    public ResponseEntity<Void> updateSpace(
            @PathVariable Long spaceId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UpdateSpaceRequest request) {

        spaceService.updateSpace(spaceId, userId, request.spaceName(), request.spaceDescription());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/{userId}/created-boards")
    public List<BoardDto> getUserCreatedBoards(@PathVariable("userId") Long userId) {
        return boardService.getBoardsCreatedByUser(userId);
    }

    @GetMapping("/users/{userId}/spacesinfo")
    public List<SpaceDto> getSpacesUserParticipate(@PathVariable Long userId) {
        return spaceService.getSpacesUserParticipate(userId);
    }

    @GetMapping("/{spaceId}")
    public GetFullSpaceResponse getSpace(@PathVariable("spaceId") Long spaceId) {
        return spaceService.getSpace(spaceId);
    }

    @GetMapping("/{spaceId}/usersids")
    public List<Long> getUsersIdsInSpace(@PathVariable("spaceId") Long spaceId) {
        return spaceService.getUsersIdsInSpace(spaceId);
    }

    @DeleteMapping("/{spaceId}/delete")
    public ResponseEntity<Void> deleteSpace(
            @PathVariable Long spaceId,
            @RequestHeader("X-User-Id") Long userId) {

        spaceService.deleteSpace(spaceId, userId);
        return ResponseEntity.ok().build();
    }
}
