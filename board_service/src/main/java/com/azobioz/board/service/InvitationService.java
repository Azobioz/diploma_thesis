package com.azobioz.board.service;

import com.azobioz.board.dto.invite.CreateBoardInvitationRequest;
import com.azobioz.board.dto.invite.CreateInvitationRequest;
import com.azobioz.board.dto.invite.InvitationLinkResponse;
import com.azobioz.board.model.*;
import com.azobioz.board.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final SpaceInvitationRepository invitationRepository;
    private final SpaceRepository spaceRepository;
    private final UserInSpaceWithRoleRepository userInSpaceRepository;
    private final RoleRepository roleRepository;
    private final UserInBoardRepository userInBoardRepository;
    private final BoardRepository boardRepository;

    @Value("${frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Transactional
    public InvitationLinkResponse createInvitation(Long spaceId, Long creatorId, CreateInvitationRequest request) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        // Проверяем, что пользователь — создатель пространства
        UserInSpaceWithRole creator = userInSpaceRepository.findBySpaceIdAndUserId(spaceId, creatorId);
        if (creator == null || creator.getRole().getRoleType() != RoleType.CREATOR_OF_SPACE) {
            throw new RuntimeException("Only space creator can generate invitation links");
        }

        String token = UUID.randomUUID().toString();
        long days = request != null && request.expiresInDays() != null ? request.expiresInDays() : 7;
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(days);

        SpaceInvitation invite = new SpaceInvitation();
        invite.setToken(token);
        invite.setSpaceId(spaceId);
        invite.setCreatedByUserId(creatorId);
        invite.setExpiresAt(expiresAt);
        invite.setCreatedAt(LocalDateTime.now());
        invite.setUsed(false);
        invite.setInvitationType(InvitationType.SPACE);

        invitationRepository.save(invite);

        String inviteUrl = frontendBaseUrl + "/boardiox/invite/" + token;

        return new InvitationLinkResponse(token, inviteUrl, expiresAt);
    }

    @Transactional
    public String acceptInvitation(String token, Long userId) {
        SpaceInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("INVITATION_NOT_FOUND"));

        if (invitation.isUsed() || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("INVITATION_EXPIRED_OR_USED");
        }

        Long spaceId = invitation.getSpaceId();
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        // Проверяем, является ли пользователь уже участником пространства
        UserInSpaceWithRole existingSpaceMember = userInSpaceRepository.findBySpaceIdAndUserId(spaceId, userId);
        boolean isAlreadyInSpace = existingSpaceMember != null;

        if (!isAlreadyInSpace) {
            // Добавляем пользователя в пространство как MEMBER
            UserInSpaceWithRole newMember = new UserInSpaceWithRole();
            newMember.setUserId(userId);
            newMember.setSpace(space);
            newMember.setRole(roleRepository.findByRoleType(RoleType.MEMBER)
                    .orElseThrow(() -> new RuntimeException("Role MEMBER not found")));
            userInSpaceRepository.save(newMember);
        }

        // Если приглашение типа BOARD - добавляем пользователя в указанные доски
        if (invitation.getInvitationType() == InvitationType.BOARD) {
            List<Long> boardIds = invitation.getBoardIds();
            if (boardIds != null && !boardIds.isEmpty()) {
                Role boardMemberRole = roleRepository.findByRoleType(RoleType.MEMBER)
                        .orElseThrow(() -> new RuntimeException("Role MEMBER not found"));

                for (Long boardId : boardIds) {
                    Board board = boardRepository.findById(boardId)
                            .orElseThrow(() -> new RuntimeException("Board not found: " + boardId));

                    // Проверяем, что доска принадлежит этому пространству
                    if (!board.getSpace().getId().equals(spaceId)) {
                        throw new RuntimeException("Board " + boardId + " does not belong to space " + spaceId);
                    }

                    // Проверяем, не добавлен ли пользователь уже в эту доску
                    UserInBoard existingBoardMember = userInBoardRepository.findByBoardIdAndUserId(boardId, userId);
                    if (existingBoardMember == null) {
                        UserInBoard userInBoard = new UserInBoard();
                        userInBoard.setUserId(userId);
                        userInBoard.setBoard(board);
                        userInBoard.setRole(boardMemberRole);
                        userInBoardRepository.save(userInBoard);
                    }
                }
            }
        }

        // Помечаем приглашение использованным
        invitation.setUsed(true);
        invitationRepository.save(invitation);

        return isAlreadyInSpace ? "ALREADY_MEMBER" : "SUCCESS";
    }

    @Transactional
    public InvitationLinkResponse createBoardInvitation(Long spaceId, Long userId, CreateBoardInvitationRequest request) {
        // Проверяем, что boardIds не null и не пустой
        if (request.boardIds() == null || request.boardIds().isEmpty()) {
            throw new RuntimeException("boardIds cannot be null or empty");
        }

        // Проверяем, что пользователь является создателем хотя бы одной из указанных досок
        Role creatorRole = roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD)
                .orElseThrow(() -> new RuntimeException("Role CREATOR_OF_BOARD not found"));

        List<UserInBoard> userBoards = userInBoardRepository.findByUserIdAndRole(userId, creatorRole);

        // Проверяем, что доски принадлежат этому пространству и пользователь их создатель
        List<Long> boardIds = request.boardIds();
        for (Long boardId : boardIds) {
            if (boardId == null) {
                throw new RuntimeException("boardId cannot be null");
            }

            UserInBoard userInBoard = userBoards.stream()
                    .filter(uib -> uib.getBoard().getId().equals(boardId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("User is not creator of board " + boardId));

            if (!userInBoard.getBoard().getSpace().getId().equals(spaceId)) {
                throw new RuntimeException("Board " + boardId + " does not belong to space " + spaceId);
            }
        }

        // Генерируем токен
        String token = UUID.randomUUID().toString();
        long days = request.expiresInDays() != null ? request.expiresInDays() : 7;
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(days);

        // Сохраняем приглашение
        SpaceInvitation invite = new SpaceInvitation();
        invite.setToken(token);
        invite.setSpaceId(spaceId);
        invite.setCreatedByUserId(userId);
        invite.setExpiresAt(expiresAt);
        invite.setCreatedAt(LocalDateTime.now());
        invite.setUsed(false);
        invite.setBoardIds(boardIds); // Сохраняем IDs досок
        invite.setInvitationType(InvitationType.BOARD); // Тип приглашения - BOARD

        invitationRepository.save(invite);

        String inviteUrl = frontendBaseUrl + "/boardiox/invite/" + token;
        return new InvitationLinkResponse(token, inviteUrl, expiresAt);
    }
}