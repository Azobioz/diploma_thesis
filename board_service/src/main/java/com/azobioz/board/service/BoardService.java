package com.azobioz.board.service;

import com.azobioz.board.dto.*;
import com.azobioz.board.dto.invite.CreateBoardInvitationRequest;
import com.azobioz.board.dto.invite.InvitationLinkResponse;
import com.azobioz.board.model.*;
import com.azobioz.board.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final SpaceRepository spaceRepository;
    private final RoleRepository roleRepository;
    private final UserInBoardRepository userInBoardRepository;
    private final InvitationRepository invitationRepository;

    public CreateBoardResponse createBoard(BoardRequest request, Long spaceId, Long boardCreatorUserId) {
        Space space = spaceRepository.findById(spaceId).orElseThrow(() -> new RuntimeException("Space not found with spaceId: " + spaceId));

        Board board = new Board();
        board.setName(request.boardName());
        board.setCreatedAt(LocalDate.now());
        board.setSpace(space);

        boardRepository.save(board);

        List<UserInBoard> userInBoardList = new ArrayList<>();

        //Добавляем в доску создателя доски
        UserInBoard creatorOfBoard = new UserInBoard();
        creatorOfBoard.setUserId(boardCreatorUserId);
        creatorOfBoard.setBoard(board);
        creatorOfBoard.setRole(roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD).get());
        userInBoardList.add(creatorOfBoard);

        //Добавляем остальных пользователей
        request.addedUsersInBoardIds().stream()
                .filter(addedUserId -> !addedUserId.equals(boardCreatorUserId))
                .forEach(addedUserId -> {
                    UserInBoard uib = new UserInBoard();
                    uib.setUserId(addedUserId);
                    uib.setBoard(board);
                    uib.setRole(roleRepository.findByRoleType(RoleType.EDITOR_OF_BOARD).get());
                    userInBoardList.add(uib);
                });

        userInBoardRepository.saveAll(userInBoardList);

        List<UserIdInBoardWithRoleDto> userIdsAndRolesInBoardDto = userInBoardList.stream()
                .map(userInBoard -> new UserIdInBoardWithRoleDto(
                        userInBoard.getUserId(),
                        userInBoard.getRole().getRoleType().name()
                )).toList();

        return new CreateBoardResponse(
                board.getId(),
                board.getName(),
                userIdsAndRolesInBoardDto
        );
    }

    public List<Long> getUserBoardIds(Long userId) {
        // Возвращает список ID досок, где пользователь является участником
        return userInBoardRepository.getUserInBoardsByUserId(userId).stream()
                .map(userInBoard -> userInBoard.getBoard().getId())
                .toList();
    }

    public GetBoardResponse getBoard(Long boardId) {
        Board board =  boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with spaceId: " + boardId));

        Role boardCreatorRole = roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD)
                .orElseThrow(() -> new RuntimeException("Role CREATOR_OF_BOARD not found. Check RoleInitializerService"));

        Long creatorOfBoardId = userInBoardRepository.getUserInBoardByBoard_AndRole(board, boardCreatorRole).getUserId();
        List<Long> userIdsInBoard = userInBoardRepository.getUserInBoardsByBoard(board)
                .stream()
                .map(UserInBoard::getUserId)
                .toList();

        return new  GetBoardResponse(
                board.getId(),
                board.getName(),
                board.getCreatedAt(),
                creatorOfBoardId,
                userIdsInBoard
        );
    }

    public GetBoardsResponse getBoards(Long spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found with spaceId: " + spaceId));

        List<Board> boards = boardRepository.findBySpace(space);

        List<GetBoardResponse> boardsDto = boards.stream()
                .map(board -> {
                    Long creatorId = userInBoardRepository
                            .getUserInBoardByBoard_AndRole(board, roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD)
                                            .orElseThrow(() -> new RuntimeException("Role CREATOR_OF_BOARD not found")))
                            .getUserId();
                    return new GetBoardResponse(
                            board.getId(),
                            board.getName(),
                            board.getCreatedAt(),
                            creatorId,
                            userInBoardRepository.getUserInBoardsByBoard(board) //Получение всех spaceId пользователей внутри доски
                                    .stream()
                                    .map(UserInBoard::getUserId)
                                    .toList()
                    );
                })
                .toList();

        return new GetBoardsResponse(space.getId(), boardsDto);
    }

    // Для получения досок с фильтрацией и сортировкой
    public GetBoardsResponse getFilteredBoards(Long spaceId, Long userId, String filter, String sort) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found with spaceId: " + spaceId));

        // Получаем все доски, в которых участвует пользователь
        List<UserInBoard> userBoards = userInBoardRepository.getUserInBoardsByUserIdAndSpaceId(userId, spaceId);

        List<Board> boards = userBoards.stream()
                .map(UserInBoard::getBoard)
                .collect(Collectors.toList());

        // Применяем фильтрацию
        if ("created_by_me".equals(filter)) {
            Role creatorRole = roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD)
                    .orElseThrow(() -> new RuntimeException("Role CREATOR_OF_BOARD not found"));

            boards = boards.stream()
                    .filter(board -> {
                        UserInBoard userInBoard = userInBoardRepository.getUserInBoardByBoardAndUserId(board, userId);
                        return userInBoard != null && userInBoard.getRole().getId().equals(creatorRole.getId());
                    })
                    .collect(Collectors.toList());
        }

        // Применяем сортировку по last_view_at
        if ("recent".equals(sort)) {
            // Сортируем по недавно открытым доскам по убыванию last_view_at
            boards.sort(Comparator.comparing(
                    board -> userBoards.stream()
                            .filter(uib -> uib.getBoard().getId().equals(board.getId()))
                            .findFirst()
                            .map(UserInBoard::getLastViewAt)
                            .orElse(LocalDateTime.MIN),
                    Comparator.reverseOrder()
            ));
        } else if ("old".equals(sort)) {
            // Сортируем: давно открытые (по возрастанию last_view_at)
            boards.sort(Comparator.comparing(
                    board -> userBoards.stream()
                            .filter(uib -> uib.getBoard().getId().equals(board.getId()))
                            .findFirst()
                            .map(UserInBoard::getLastViewAt)
                            .orElse(LocalDateTime.MIN)
            ));
        }

        List<GetBoardResponse> boardsDto = boards.stream()
                .map(board -> {
                    Long creatorId = userInBoardRepository
                            .getUserInBoardByBoard_AndRole(board, roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD)
                                    .orElseThrow(() -> new RuntimeException("Role CREATOR_OF_BOARD not found")))
                            .getUserId();

                    return new GetBoardResponse(
                            board.getId(),
                            board.getName(),
                            board.getCreatedAt(),
                            creatorId,
                            userInBoardRepository.getUserInBoardsByBoard(board)
                                    .stream()
                                    .map(UserInBoard::getUserId)
                                    .toList()
                    );
                })
                .toList();

        return new GetBoardsResponse(space.getId(), boardsDto);
    }

    // Для обновления last_view_at при переходе на доску
    public void updateLastViewedAt(Long boardId, Long userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found with boardId: " + boardId));

        UserInBoard userInBoard = userInBoardRepository.getUserInBoardByBoardAndUserId(board, userId);
        if (userInBoard == null) {
            throw new RuntimeException("User is not a member of this board");
        }

        userInBoard.setLastViewAt(LocalDateTime.now());
        userInBoardRepository.save(userInBoard);
    }

    public String deleteBoard(Long boardId, Long userId) {
        Board board = boardRepository.findBoardById(boardId);

        String boardName = board.getName();

        RoleType userIdRole = userInBoardRepository.getUserInBoardByBoardAndUserId(board, userId).getRole().getRoleType();
        if (userIdRole.equals(RoleType.CREATOR_OF_BOARD) || userIdRole.equals(RoleType.CREATOR_OF_SPACE)) {
            boardRepository.delete(board);
            return "Board '" +  boardName + "' with spaceId " + boardId + " was deleted";
        }
        else {
            throw new RuntimeException("User is not allowed to delete board: " + boardName + " because his role is not CREATOR_OF_BOARD or CREATOR_OF_SPACE");
        }
    }

    public String updateBoardName(Long boardId, Long userId, String newBoardName) {
        Board board = boardRepository.findBoardById(boardId);

        RoleType userIdRole = userInBoardRepository.getUserInBoardByBoardAndUserId(board, userId).getRole().getRoleType();

        if (userIdRole.equals(RoleType.CREATOR_OF_BOARD) || userIdRole.equals(RoleType.CREATOR_OF_SPACE)) {
            String oldBoardName = board.getName();

            board.setName(newBoardName);
            boardRepository.save(board);
            return "Board name: '" + oldBoardName + "' has been updated to board name: '" + newBoardName + "'";
        }
        else {
            throw new RuntimeException("User is not allowed to edit board: " + newBoardName + " because his role is not CREATOR_OF_BOARD or CREATOR_OF_SPACE");
        }
    }

    public List<BoardDto> getBoardsCreatedByUser(Long userId) {
        Role creatorRole = roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD)
                .orElseThrow(() -> new RuntimeException("Role CREATOR_OF_BOARD not found"));

        List<UserInBoard> userBoards = userInBoardRepository.findByUserIdAndRole(userId, creatorRole);

        return userBoards.stream()
                .map(uib -> new BoardDto(
                        uib.getBoard().getId(),
                        uib.getBoard().getName(),
                        uib.getBoard().getCreatedAt(),
                        uib.getUserId(),
                        uib.getBoard().getSpace().getId()
                ))
                .collect(Collectors.toList());
    }

//    public InvitationLinkResponse createBoardInvitation(Long spaceId, Long userId, CreateBoardInvitationRequest request) {
//        // Проверяем, что пользователь является создателем хотя бы одной доски
//        Role creatorRole = roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD)
//                .orElseThrow(() -> new RuntimeException("Role CREATOR_OF_BOARD not found"));
//
//        List<UserInBoard> userBoards = userInBoardRepository.findByUserIdAndRole(userId, creatorRole);
//
//        // Проверяем, что доски принадлежат этому пространству
//        List<Long> boardIds = request.boardIds();
//        for (Long boardId : boardIds) {
//            UserInBoard userInBoard = userBoards.stream()
//                    .filter(uib -> uib.getBoard().getId().equals(boardId))
//                    .findFirst()
//                    .orElseThrow(() -> new RuntimeException("User is not creator of board " + boardId));
//
//            if (!userInBoard.getBoard().getSpace().getId().equals(spaceId)) {
//                throw new RuntimeException("Board " + boardId + " does not belong to space " + spaceId);
//            }
//        }
//
//        // Генерируем токен
//        String token = UUID.randomUUID().toString();
//        LocalDateTime expiresAt = LocalDateTime.now().plusDays(request.expiresInDays());
//
//        // Сохраняем приглашение
//        SpaceInvitation invitation = new SpaceInvitation();
//        invitation.setToken(token);
//        invitation.setSpaceId(spaceId);
//        invitation.setCreatedByUserId(userId);
//        invitation.setExpiresAt(expiresAt);
//        invitation.setUsed(false);
//        invitation.setBoardIds(boardIds); // Сохраняем IDs досок
//        invitation.setInvitationType(InvitationType.BOARD); // Тип приглашения
//
//        invitationRepository.save(invitation);
//
//        String inviteUrl = frontendBaseUrl + "/boardiox/invite/" + token;
//        return new InvitationLinkResponse(token, inviteUrl, expiresAt);
//    }

}
