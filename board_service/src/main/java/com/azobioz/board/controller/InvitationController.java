package com.azobioz.board.controller;

import com.azobioz.board.dto.invite.CreateBoardInvitationRequest;
import com.azobioz.board.dto.invite.CreateInvitationRequest;
import com.azobioz.board.dto.invite.InvitationLinkResponse;
import com.azobioz.board.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/invitations")
@RequiredArgsConstructor
public class InvitationController {
    private final InvitationService invitationService;

    @PostMapping("/spaces/{spaceId}/create")
    public InvitationLinkResponse createInvitation(
            @PathVariable Long spaceId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody(required = false) CreateInvitationRequest request) {
        return invitationService.createInvitation(spaceId, userId, request != null ? request : new CreateInvitationRequest(7L));
    }

    @PostMapping("/{token}/accept")
    public String acceptInvitation(
            @PathVariable String token,
            @RequestHeader("X-User-Id") Long userId) {
        return invitationService.acceptInvitation(token, userId);
    }

    @PostMapping("/spaces/{spaceId}/board-invitations/create")
    public InvitationLinkResponse createBoardInvitation(
            @PathVariable Long spaceId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CreateBoardInvitationRequest request) {
        return invitationService.createBoardInvitation(spaceId, userId, request);
    }
}
