package com.azobioz.board.service;

import com.azobioz.board.dto.*;
import com.azobioz.board.model.*;
import com.azobioz.board.repository.RoleRepository;
import com.azobioz.board.repository.SpaceRepository;
import com.azobioz.board.repository.UserInBoardRepository;
import com.azobioz.board.repository.UserInSpaceWithRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static java.util.stream.Collectors.toList;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final RoleRepository roleRepository;
    private final UserInSpaceWithRoleRepository userInSpaceWithRoleRepository;
    private final UserInBoardRepository userInBoardRepository;

    public GetShortSpaceResponse createSpace(CreateSpaceRequest request, Long userId) {
        Space space = new Space();
        space.setName(request.spaceName());
        space.setDescription(request.spaceDescription());
        space.setCreatedAt(LocalDate.now());

        space = spaceRepository.save(space);

        UserInSpaceWithRole userInSpaceWithRole = new UserInSpaceWithRole();
        userInSpaceWithRole.setUserId(userId);
        userInSpaceWithRole.setRole(roleRepository.findByRoleType(RoleType.CREATOR_OF_SPACE).get());
        userInSpaceWithRole.setSpace(space);

        userInSpaceWithRoleRepository.save(userInSpaceWithRole);

        return new GetShortSpaceResponse(
                space.getId(),
                space.getName(),
                space.getDescription(),
                space.getCreatedAt()
        );
    }

    public List<Long> getUsersIdsInSpace(Long spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        List<Long> usersIdsInSpace = userInSpaceWithRoleRepository
                .getUserInSpaceWithRolesBySpace(space)
                .stream()
                .map(userInSpace -> userInSpace.getUserId())
                .toList();

        return usersIdsInSpace;
    }

    public GetFullSpaceResponse getSpace(Long spaceId) {
        Space space = spaceRepository.getSpaceById(spaceId);

        // Получаем всех пользователей space
        List<UserInSpaceWithRole> allMembers = userInSpaceWithRoleRepository.findBySpaceId(spaceId);

        // Находим создателя space
        UserInSpaceWithRole spaceCreator = allMembers.stream()
                .filter(member -> member.getRole().getRoleType() == RoleType.CREATOR_OF_SPACE)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Space creator not found for space: " + spaceId));

        List<BoardDto> boards = space.getBoards().stream()
                .map(board -> new BoardDto(
                        board.getId(),
                        board.getName(),
                        board.getCreatedAt(),
                        userInBoardRepository.getUserInBoardByBoard_AndRole(board, roleRepository.findByRoleType(RoleType.CREATOR_OF_BOARD).get()).getUserId(), //создатель доски,
                        board.getSpace().getId()
                )).toList();

        return new GetFullSpaceResponse(
                space.getId(),
                space.getName(),
                space.getDescription(),
                spaceCreator.getUserId(),
                space.getCreatedAt(),
                boards
        );
    }

    public List<SpaceDto> getSpacesUserParticipate(Long userId) {
        //Получаем все space из UserInSpaceWithRole
        List<UserInSpaceWithRole> userInSpaceList = userInSpaceWithRoleRepository.getUserInSpaceWithRolesByUserId(userId);

        return userInSpaceList.stream()
                .map(userInSpace -> {
                    // Находим создателя этого пространства
                    UserInSpaceWithRole creator = userInSpaceWithRoleRepository
                            .findBySpaceId(userInSpace.getSpace().getId())
                            .stream()
                            .filter(member -> member.getRole().getRoleType() == RoleType.CREATOR_OF_SPACE)
                            .findFirst()
                            .orElse(null);

                    return new SpaceDto(
                            userInSpace.getSpace().getId(),
                            userInSpace.getSpace().getName(),
                            userInSpace.getSpace().getDescription(),
                            creator != null ? creator.getUserId() : null
                    );
                })
                .toList();
    }


    @Transactional
    public void updateSpace(Long spaceId, Long userId, String spaceName, String spaceDescription) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found with id: " + spaceId));

        // Проверяем, что пользователь является создателем пространства
        List<UserInSpaceWithRole> members = userInSpaceWithRoleRepository.findBySpaceId(spaceId);
        UserInSpaceWithRole creator = members.stream()
                .filter(m -> m.getRole().getRoleType() == RoleType.CREATOR_OF_SPACE)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Space creator not found"));

        if (!creator.getUserId().equals(userId)) {
            throw new RuntimeException("Только создатель пространства может его редактировать");
        }

        // Обновляем поля (если передано null или пустая строка, оставляем старое значение)
        if (spaceName != null && !spaceName.isBlank()) {
            space.setName(spaceName.trim());
        }
        if (spaceDescription != null) {
            space.setDescription(spaceDescription.trim());
        }

        spaceRepository.save(space);
    }

    @Transactional
    public void deleteSpace(Long spaceId, Long userId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        // Проверяем, что пользователь - создатель
        UserInSpaceWithRole creator = userInSpaceWithRoleRepository
                .findBySpaceIdAndUserId(spaceId, userId);

        if (creator == null || creator.getRole().getRoleType() != RoleType.CREATOR_OF_SPACE) {
            throw new RuntimeException("Only space creator can delete the space");
        }

        spaceRepository.delete(space);
    }
}

