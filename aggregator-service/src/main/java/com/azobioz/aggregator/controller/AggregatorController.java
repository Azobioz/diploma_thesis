package com.azobioz.aggregator.controller;

import com.azobioz.aggregator.dto.board.*;
import com.azobioz.aggregator.dto.board.element.*;
import com.azobioz.aggregator.dto.fullpage.SpaceMainPageDto;
import com.azobioz.aggregator.dto.fullpage.TaskMiniPageDto;
import com.azobioz.aggregator.dto.fullpage.TasksPageDto;
import com.azobioz.aggregator.dto.invite.CreateBoardInvitationRequest;
import com.azobioz.aggregator.dto.invite.CreateInvitationRequest;
import com.azobioz.aggregator.dto.invite.InvitationLinkResponse;
import com.azobioz.aggregator.dto.task.*;
import com.azobioz.aggregator.dto.user.*;
import com.azobioz.aggregator.mapper.UserMapper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.security.oauth2.jwt.Jwt;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/boardiox")
@RequiredArgsConstructor
public class AggregatorController {

    private final RestTemplate restTemplate;

    @Value("${services.account.url}")
    private String accountServiceUrl;

    @Value("${services.board.url}")
    private String boardServiceUrl;

    @Value("${services.task.url}")
    private String taskServiceUrl;

    // ====================== Page ======================
    @GetMapping("/spaces/{spaceId}")
    public ResponseEntity<SpaceMainPageDto> getSpaceMainPage(
            @PathVariable Long spaceId,
            @AuthenticationPrincipal Jwt jwt) { // берём userId из токена

        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        Long currentUserId = Long.valueOf(jwt.getSubject());

        String spaceUrl = boardServiceUrl + "/internal/spaces/" + spaceId;

        ResponseEntity<GetFullSpaceResponse> spaceResponse = restTemplate.exchange(
                spaceUrl,
                HttpMethod.GET,
                null,
                GetFullSpaceResponse.class
        );

        Long spaceCreatorId = spaceResponse.getBody().spaceCreatedByUserId();
        UserInfoDto spaceCreator = getUserById(spaceCreatorId);
        GetFullSpaceResponse fullSpace = spaceResponse.getBody();


        return ResponseEntity.ok().body(new SpaceMainPageDto(
                fullSpace.spaceId(),
                fullSpace.spaceName(),
                fullSpace.spaceDescription(),
                getCurrentUserInfo(currentUserId),
                getUsersInSpace(spaceId, jwt),
                getBoardsInSpace(spaceId),
                getSpacesUserParticipate(currentUserId),
                spaceCreator
        ));
    }

    @GetMapping("/spaces/{spaceId}/boards/{boardId}/tasks")
    public TasksPageDto getTasksPage(
            @PathVariable Long spaceId,
            @PathVariable Long boardId,
            @AuthenticationPrincipal Jwt jwt) { // берём userId из токена

        if (jwt == null) {
            throw new RuntimeException("jwt is null");
        }

        Long currentUserId = Long.valueOf(jwt.getSubject());

        return new TasksPageDto(
                getCurrentSpaceInfo(spaceId).getSpaceId(),
                getCurrentSpaceInfo(spaceId).getSpaceName(),
                getCurrentBoardInfo(spaceId, boardId).getBoardId(),
                getCurrentBoardInfo(spaceId, boardId).getBoardName(),
                getCurrentUserInfo(currentUserId),
                getTaskListsAndTasksFromBoard(boardId)
        );
    }

    @GetMapping("/boards/{boardId}/tasks/{taskId}")
    public TaskMiniPageDto getTaskMiniPage(@PathVariable("taskId") Long taskId) {

        GetTaskAndUsersWhichDoingTaskAndCreatedByResponse task = getTask(taskId);

        List<UserAvatarDto> usersDoingTask = task.usersAssigneeToTask()
                .stream()
                .map(userDto -> new UserAvatarDto(userDto.getUserId(), userDto.getNickname(), userDto.getAvatar()))
                .toList();

        List<TaskCommentDto> comments = getCommentsFromTask(taskId).comments();

        List<Long> commentAuthorsIds = comments
                .stream()
                .map(TaskCommentDto::commentCreatedByUserId)
                .distinct()
                .toList();

        List<UserInfoDto> authorsInfo = getUsersByIds(commentAuthorsIds).getBody();

        // Создаём Map для быстрого поиска пользователя по boardId
        Map<Long, UserDto> userMap = authorsInfo.stream()
                .map(userInfo -> new UserDto(
                        userInfo.getUserId(),
                        userInfo.getNickname(),
                        userInfo.getAvatar()
                ))
                .collect(Collectors.toMap(UserDto::getUserId, Function.identity()));

        List<FullTaskCommentDto> fullComments = comments.stream()
                .map(comment -> {
                    UserDto author = userMap.get(comment.commentCreatedByUserId());
                    return new FullTaskCommentDto(
                            comment.taskCommentId(),
                            comment.message(),
                            comment.createdAt(),
                            author
                    );
                })
                .toList();

        return new TaskMiniPageDto(
                task.taskId(),
                task.taskName(),
                task.taskDescription(),
                task.deadline(),
                task.isTaskCompleted(),
                usersDoingTask,
                fullComments
        );
    }


    // ====================== Board Space Get ======================



    private SpaceDto getCurrentSpaceInfo(Long spaceId) {
        String url = boardServiceUrl + "/internal/spaces/" + spaceId;

        ResponseEntity<SpaceDto> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<SpaceDto>() {
                }
        );

        return response.getBody();
    }

    private BoardDto getCurrentBoardInfo(Long spaceId, Long boardId) {
        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards/" + boardId;

        ResponseEntity<BoardDto> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<BoardDto>() {
                }
        );
        return response.getBody();
    }

    private UserDto getCurrentUserInfo(Long currentUserId) {
        String url = accountServiceUrl + "/internal/users/" + currentUserId;

        ResponseEntity<UserDto> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<UserDto>() {
                }
        );

        return response.getBody() != null ? response.getBody() : null;
    }

    @GetMapping("/spaces/{spaceId}/boards")
    public ResponseEntity<GetBoardsResponse> getAllBoardsInSpace(
            @PathVariable Long spaceId,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards";
        ResponseEntity<GetBoardsResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                GetBoardsResponse.class
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    // Получить доски, где пользователь является создателем
    @GetMapping("/users/{userId}/created-boards")
    public ResponseEntity<List<BoardDto>> getUserCreatedBoards(
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null || !userId.equals(Long.valueOf(jwt.getSubject()))) {
            return ResponseEntity.status(403).build();
        }

        String url = boardServiceUrl + "/internal/spaces/users/" + userId + "/created-boards";

        ResponseEntity<List<BoardDto>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<BoardDto>>() {}
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @GetMapping("/spaces/{spaceId}/users")
    private List<UserDto> getUsersInSpace(@PathVariable("spaceId") Long spaceId,
                                          @AuthenticationPrincipal Jwt jwt
    ) {
        if (jwt == null) {
            throw new RuntimeException("jwt is null");
        }

        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/usersids";

        //Получение списка boardId пользователей в space
        List<Long> usersIds = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        null,
                        new ParameterizedTypeReference<List<Long>>() {
                        }
                )
                .getBody();


        url = accountServiceUrl + "/internal/users/by-ids";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<List<Long>> entity = new HttpEntity<>(usersIds, headers);


        ResponseEntity<List<UserDto>> usersInSpace = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<List<UserDto>>() {
                }
        );

        return usersInSpace.getBody()
                .stream()
                .map(userInfo -> new UserDto(
                        userInfo.getUserId(),
                        userInfo.getNickname(),
                        userInfo.getAvatar()
                ))
                .toList();
    }

    @GetMapping("/spaces/{spaceId}/boards/filtered")
    public ResponseEntity<GetBoardsResponse> getFilteredBoards(
            @PathVariable Long spaceId,
            @RequestParam(required = false, defaultValue = "all") String filter,
            @RequestParam(required = false, defaultValue = "recent") String sort,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        Long userId = Long.valueOf(jwt.getSubject());

        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards/filtered";

        // Добавляем параметры запроса
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                .queryParam("filter", filter)
                .queryParam("sort", sort);

        // Добавляем заголовок с userId
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<GetBoardsResponse> response = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.GET,
                entity,
                GetBoardsResponse.class
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    private List<BoardDto> getBoardsInSpace(Long spaceId) {
        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards";
        ResponseEntity<GetBoardsResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<GetBoardsResponse>() {
                }
        );

        if (response.getBody() == null || response.getBody().boards() == null) {
            return List.of();
        }

        return response.getBody().boards().stream()
                .map(board -> new BoardDto(
                        board.boardId(),
                        board.boardName(),
                        board.boardCreatedByUserId(),
                        response.getBody().spaceId()
                ))
                .toList();
    }

    private List<SpaceDto> getSpacesUserParticipate(Long userId) {
        String url = boardServiceUrl + "/internal/spaces/users/" + userId + "/spacesinfo";

        ResponseEntity<List<SpaceDto>> spaces = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<SpaceDto>>() {
                }
        );

        return spaces.getBody() != null ? spaces.getBody() : null;
    }

    // ================= Board Space Post =================

    @PostMapping("/spaces/create")
    public GetShortSpaceResponse createSpace(
            @RequestBody CreateSpaceRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        Long userId = Long.valueOf(jwt.getSubject());

        String url = boardServiceUrl + "/internal/spaces/create";

        // Создаем заголовки, чтобы передать userId в board-service
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());

        HttpEntity<CreateSpaceRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<GetShortSpaceResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                GetShortSpaceResponse.class
        );

        return response.getBody();
    }

    @PostMapping("/spaces/{spaceId}/boards/create")
    public CreateBoardResponse createBoard(
            @PathVariable Long spaceId,
            @RequestBody CreateBoardRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        Long boardCreatorUserId = Long.valueOf(jwt.getSubject());

        //Получаем создателя пространства
        String spaceUrl = boardServiceUrl + "/internal/spaces/" + spaceId;

        // Используем GetFullSpaceResponse ИЗ BOARD-SERVICE
        ResponseEntity<GetFullSpaceResponse> spaceResponse = restTemplate.exchange(
                spaceUrl,
                HttpMethod.GET,
                null,
                GetFullSpaceResponse.class
        );

        if (spaceResponse.getBody() == null) {
            throw new RuntimeException("Space not found with boardId: " + spaceId);
        }

        Long spaceCreatorId = spaceResponse.getBody().spaceCreatedByUserId();

        // Получаем всех пользователей пространства
        String usersInSpaceUrl = boardServiceUrl + "/internal/spaces/" + spaceId + "/usersids";
        List<Long> usersInSpace = restTemplate.exchange(
                usersInSpaceUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Long>>() {}
        ).getBody();

        if (usersInSpace == null || !usersInSpace.contains(boardCreatorUserId)) {
            throw new RuntimeException("User is not a member of this space");
        }

        // Формируем финальный список участников
        Set<Long> finalParticipants = new HashSet<>();

        // Всегда добавляем создателя пространства
        if (spaceCreatorId != null) {
            finalParticipants.add(spaceCreatorId);
        }

        // Всегда добавляем того, кто создаёт доску (текущий пользователь)
        finalParticipants.add(boardCreatorUserId);

        // Добавляем выбранных пользователей из запроса (если они есть в пространстве)
        if (request.participantIds() != null) {
            for (Long participantId : request.participantIds()) {
                if (usersInSpace.contains(participantId)) {
                    finalParticipants.add(participantId);
                }
            }
        }

        // Если фронтенд передал пустой список — добавляем всех участников пространства
        if (request.participantIds() != null && request.participantIds().isEmpty()) {
            finalParticipants.addAll(usersInSpace);
        }

        // Создаём запрос для board-service
        BoardRequest boardRequest = new BoardRequest(
                request.boardName(),
                new ArrayList<>(finalParticipants)
        );

        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards/create";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", boardCreatorUserId.toString());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<BoardRequest> entity = new HttpEntity<>(boardRequest, headers);

        // Используем CreateBoardResponse ИЗ BOARD-SERVICE
        ResponseEntity<CreateBoardResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                CreateBoardResponse.class
        );

        return response.getBody();
    }

    @PostMapping("/spaces/{spaceId}/boards/{boardId}/view")
    public ResponseEntity<String> updateLastViewedAt(
            @PathVariable Long spaceId,
            @PathVariable Long boardId,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        Long userId = Long.valueOf(jwt.getSubject());

        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards/" + boardId + "/view";

        // Добавляем заголовок с userId
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    private Long createFirstSpaceForNewUser(Long userId) {
        String url = boardServiceUrl + "/internal/spaces/create";

        CreateSpaceRequest createSpaceRequest = new CreateSpaceRequest(
                "Пространство 1",
                "Это ваше первое созданное пространство"
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());

        HttpEntity<CreateSpaceRequest> entity = new HttpEntity<>(createSpaceRequest, headers);

        ResponseEntity<GetShortSpaceResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                GetShortSpaceResponse.class
        );

        if (response.getBody() != null) {
            return response.getBody().id();
        }

        throw new RuntimeException("Failed to create first space for user");
    }

    // Создать приглашение на доски
    @PostMapping("/spaces/{spaceId}/board-invitations/create")
    public InvitationLinkResponse createBoardInvitation(
            @PathVariable Long spaceId,
            @RequestBody CreateBoardInvitationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("User is not authenticated");

        Long userId = Long.valueOf(jwt.getSubject());
        String url = boardServiceUrl + "/internal/invitations/spaces/" + spaceId + "/board-invitations/create";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CreateBoardInvitationRequest> entity = new HttpEntity<>(request, headers);
        return restTemplate.exchange(url, HttpMethod.POST, entity, InvitationLinkResponse.class).getBody();
    }

    //================= Board Space Put =================
    @PutMapping("/spaces/{spaceId}/edit")
    public GetShortSpaceResponse editSpace(
            @PathVariable Long spaceId,
            @RequestBody CreateSpaceRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        Long userId = Long.valueOf(jwt.getSubject());
        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/edit";

        // Создаем заголовки, чтобы передать userId в board-service
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CreateSpaceRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<GetShortSpaceResponse> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                GetShortSpaceResponse.class
        );

        return response.getBody();
    }

    @PutMapping("/spaces/{spaceId}/boards/{boardId}/edit")
    public ResponseEntity<String> editBoard(
            @PathVariable Long spaceId,
            @PathVariable Long boardId,
            @RequestBody UpdateBoardNameRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        Long userId = Long.valueOf(jwt.getSubject());
        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards/" + boardId + "/edit";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<UpdateBoardNameRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                String.class
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

// ====================== Board Space Delete ======================
@DeleteMapping("/spaces/{spaceId}/delete")
public ResponseEntity<Void> deleteSpace(
        @PathVariable Long spaceId,
        @AuthenticationPrincipal Jwt jwt) {

    if (jwt == null) {
        throw new IllegalArgumentException("User is not authenticated");
    }

    Long userId = Long.valueOf(jwt.getSubject());
    String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/delete";

    HttpHeaders headers = new HttpHeaders();
    headers.set("X-User-Id", userId.toString());
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<Void> entity = new HttpEntity<>(headers);

    return restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
}

    @DeleteMapping("/spaces/{spaceId}/boards/{boardId}/delete")
    public ResponseEntity<String> deleteBoard(
            @PathVariable Long spaceId,
            @PathVariable Long boardId,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        Long userId = Long.valueOf(jwt.getSubject());
        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/boards/" + boardId + "/delete";

        // Добавляем заголовок с userId
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    entity,
                    String.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to delete board: " + e.getMessage());
        }
    }


    // ====================== Auth Page ======================

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        String url = accountServiceUrl + "/internal/users/auth/register";

        ResponseEntity<AuthResponse> authResponse = restTemplate.postForEntity(url, request, AuthResponse.class);

        if (authResponse.getBody() != null && authResponse.getBody().tokenResponse() != null) {
            Long userId = authResponse.getBody().tokenResponse().getUserId();

            // Создаём первый space для нового пользователя
            Long newSpaceId = createFirstSpaceForNewUser(userId);

            AuthResponse responseWithSpace = new AuthResponse(
                    authResponse.getBody().tokenResponse(),
                    authResponse.getBody().refreshToken(),
                    newSpaceId
            );
            return ResponseEntity.ok(responseWithSpace);
        }

        return authResponse;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        String url = accountServiceUrl + "/internal/users/auth/login";
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(url, request, AuthResponse.class);

        if (response.getBody() == null || response.getBody().tokenResponse() == null) {
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        }

        AuthResponse authResponse = response.getBody();
        Long userId = authResponse.tokenResponse().getUserId();
        Long firstSpaceId = null;

        try {
            List<SpaceDto> spaces = getSpacesUserParticipate(userId);
            if (spaces != null && !spaces.isEmpty()) {
                firstSpaceId = spaces.get(0).getSpaceId();
            }
        } catch (Exception e) {
            // Логируем, но не ломаем процесс входа
            System.err.println("[Aggregator] Failed to fetch user spaces during login: " + e.getMessage());
        }

        AuthResponse responseWithSpaceId = new AuthResponse(
                authResponse.tokenResponse(),
                authResponse.refreshToken(),
                firstSpaceId
        );
        return ResponseEntity.ok(responseWithSpaceId);
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestHeader("X-Refresh-Token") String refreshToken) {
        String url = accountServiceUrl + "/internal/users/auth/refresh";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Refresh-Token", refreshToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<TokenResponse> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, TokenResponse.class);

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "X-Refresh-Token", required = false) String refreshToken) {
        String url = accountServiceUrl + "/internal/users/auth/logout";

        HttpHeaders headers = new HttpHeaders();
        if (refreshToken != null) {
            headers.set("X-Refresh-Token", refreshToken);
        }

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
        return ResponseEntity.ok().build();
    }

    // ====================== User ======================

    @PutMapping("/users/{userId}/description")
    public UserInfoDto updateDescription(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        Long authUserId = Long.valueOf(jwt.getSubject());
        if (!authUserId.equals(userId)) {
            throw new SecurityException("You can only update your own description");
        }

        String url = accountServiceUrl + "/internal/users/" + userId + "/description";
        return restTemplate.exchange(
                url,
                HttpMethod.PUT,
                new HttpEntity<>(request),
                UserInfoDto.class
        ).getBody();
    }

    @GetMapping("/users/{userId}")
    public UserInfoDto getUserById(@PathVariable Long userId) {
        String url = accountServiceUrl + "/internal/users/" + userId;

        ResponseEntity<UserInfoDto> response = restTemplate.getForEntity(url, UserInfoDto.class);
        return response.getBody();
    }

    @PostMapping("/users/by-ids")
    public ResponseEntity<List<UserInfoDto>> getUsersByIds(@RequestBody List<Long> userIds) {
        String url = accountServiceUrl + "/internal/users/by-ids";

        ResponseEntity<List<UserInfoDto>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(userIds),
                new ParameterizedTypeReference<>() {
                }
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

//    @GetMapping("/spaces/{spaceId}/users")
//    public ResponseEntity<List<UserDto>> getUsersInSpaceEndpoint(
//            @PathVariable Long spaceId,
//            @AuthenticationPrincipal Jwt jwt) {
//
//        if (jwt == null) {
//            return ResponseEntity.status(401).build();
//        }
//
//        Long currentUserId = Long.valueOf(jwt.getSubject());
//
//        // Проверяем, что текущий пользователь состоит в этом пространстве
//        List<Long> usersIdsInSpace = getUsersIdsInSpaceFromBoardService(spaceId);
//        if (!usersIdsInSpace.contains(currentUserId)) {
//            return ResponseEntity.status(403).build(); // Forbidden
//        }
//
//        // 4. Получаем полную информацию о пользователях
//        List<UserDto> users = getUsersInSpace(spaceId);
//
//        return ResponseEntity.ok(users);
//    }

    // Вспомогательный метод для получения только ID пользователей (без деталей)
    private List<Long> getUsersIdsInSpaceFromBoardService(Long spaceId) {
        String url = boardServiceUrl + "/internal/spaces/" + spaceId + "/usersids";
        return restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Long>>() {}
        ).getBody();
    }

    // ====================== Task Post ======================

    @PostMapping("/{boardId}/tasklists/create")
    public TaskListDto createTaskList(@PathVariable("boardId") Long boardId,
                                      @RequestBody CreateTaskListRequest request) {

        String url =  taskServiceUrl + "/internal/" + boardId + "/tasklists/create";

        HttpEntity<CreateTaskListRequest> entity = new HttpEntity<>(request);

        ResponseEntity<TaskListDto> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody();
    }

    @PostMapping("/tasklists/{taskListId}/tasks/create")
    public ResponseEntity<TaskDto> createTask(
            @PathVariable Long taskListId,
            @RequestParam("taskName") String taskName,
            @RequestParam(value = "taskDescription", required = false) String taskDescription,
            @RequestParam(value = "deadline", required = false) String deadline,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal Jwt jwt) throws IOException {

        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        String url = taskServiceUrl + "/internal/tasklists/" + taskListId + "/tasks/create";

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("taskName", taskName);
        body.add("taskDescription", taskDescription);
        body.add("deadline", deadline);
        body.add("userId", userId);

        if (files != null) {
            for (MultipartFile file : files) {
                body.add("files", new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename();
                    }
                });
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        return restTemplate.exchange(url, HttpMethod.POST, requestEntity, TaskDto.class);
    }

    @PostMapping("/tasks/{taskId}/take")
    public GetTaskAndUsersWhichDoingTaskAndCreatedByResponse TakeTaskToExecutionToUser(@PathVariable("taskId") Long taskId,
                                                                                       @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("Jwt is null");
        }

        Long userId =  Long.valueOf(jwt.getSubject());

        GetTaskAndUsersWhichDoingTaskAndCreatedByResponse task = getTask(taskId);

        UserInfoDto taskCreatedByUser = getUserById(userId);

        String url = taskServiceUrl + "/internal/tasks/" + taskId + "/take";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());

        HttpEntity<Void> entity = new HttpEntity<>(headers);   // тело пустое

        //Запрос на добавление пользователя на выполнение задачи
        restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
               String.class
        );

        List<UserDto> users = getUsersWhichAssigneeToTask(taskId);

        return new GetTaskAndUsersWhichDoingTaskAndCreatedByResponse(
                task.taskId(),
                task.taskName(),
                task.taskDescription(),
                task.isTaskCompleted(),
                task.deadline(),
                taskCreatedByUser,
                users
        );
    }

    @PostMapping("/tasks/{taskId}/comments/create")
    public FullTaskCommentDto createCommentInTask(@PathVariable("taskId") Long taskId,
                                    @AuthenticationPrincipal Jwt jwt,
                                    @RequestBody CreateCommentInTaskRequest request) {

        if (jwt == null) {
            throw new IllegalArgumentException("jwt is null");
        }

        Long currentUserId = Long.valueOf(jwt.getSubject());

        String url = taskServiceUrl + "/internal/tasks/" + taskId + "/comments/create";

        // Создаём заголовки и добавляем X-User-Id
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", currentUserId.toString());   // ← передаём userId

        HttpEntity<CreateCommentInTaskRequest> bodyAndHeaderForTaskCommentRequest = new HttpEntity<>(request, headers);

        ResponseEntity<TaskCommentDto> taskCommentResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                bodyAndHeaderForTaskCommentRequest,
                new ParameterizedTypeReference<>() {
                }
        );

        TaskCommentDto taskComment = taskCommentResponse.getBody();

        UserDto commentCreateByUser = UserMapper.mapToUserDto(getUserById(taskComment.commentCreatedByUserId()));

        return new FullTaskCommentDto(
                taskComment.taskCommentId(),
                taskComment.message(),
                taskComment.createdAt(),
                commentCreateByUser
        );

    }

    // ====================== Task Get ======================

    public GetTaskAndUsersWhichDoingTaskAndCreatedByResponse getTask(Long taskId) {
        String url = taskServiceUrl + "/internal/tasks/" + taskId;
        ResponseEntity<FullTaskDto> taskResponse = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                }
        );

        FullTaskDto task = taskResponse.getBody();
        UserInfoDto taskCreatedByUser = getUserById(task.createdByUserId());
        List<UserDto> usersWhichTaskIsAssignee = getUsersWhichAssigneeToTask(taskId);

        return new GetTaskAndUsersWhichDoingTaskAndCreatedByResponse(
                task.taskId(),
                task.taskName(),
                task.taskDescription(),
                task.isTaskCompleted(),
                task.deadline(),
                taskCreatedByUser,
                usersWhichTaskIsAssignee
        );
    }

    public GetTaskCommentsResponse getCommentsFromTask(Long taskId) {
        GetTaskAndUsersWhichDoingTaskAndCreatedByResponse task = getTask(taskId);

        String url = taskServiceUrl + "/internal/tasks/" + taskId + "/comments";
        ResponseEntity<GetTaskCommentsResponse> comments = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                }
        );

        return new GetTaskCommentsResponse(
                task.taskId(),
                task.taskName(),
                comments.getBody().comments()
        );

    }

    public List<UserDto> getUsersWhichAssigneeToTask(Long taskId) {
        String url = taskServiceUrl + "/internal/tasks/" + taskId + "/assignee";
        ResponseEntity<List<Long>> usersIds = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                }
        );

        //Возвращает UserDto
        return getUsersByIds(usersIds.getBody()).getBody()
                .stream()
                .map(UserMapper::mapToUserDto)
                .toList();
    }

    public List<TaskListDto> getTaskListsAndTasksFromBoard(Long boardId) {
        String url = taskServiceUrl + "/internal/" + boardId + "/tasklists";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<GetShortTaskListsAndTasksFromBoardResponse> taskListsAndTasks = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {
                    }
            );

            if (taskListsAndTasks.getBody() != null) {

                //Получаем boardId пользователей
                List<Long> allUsersWhichCreatedTasks = taskListsAndTasks.getBody().taskLists()
                        .stream()
                        .flatMap(taskList -> taskList.tasks().stream())
                        .map(ShortTaskDto::taskCreatedByUserId)
                        .toList();

                //Получаем самих пользователей
                List<UserInfoDto> users = getUsersByIds(allUsersWhichCreatedTasks).getBody();

                Map<Long, UserInfoDto> userMap = users.stream()
                        .collect(Collectors.toMap(UserInfoDto::getUserId, Function.identity()));

                return taskListsAndTasks.getBody().taskLists()
                        .stream()
                        .map(taskList -> new TaskListDto(
                                taskList.taskListId(),
                                taskList.taskListName(),
                                taskList.tasks().stream()
                                        .map(task -> {
                                            UserInfoDto user = userMap.get(task.taskCreatedByUserId());
                                            return new TaskDto(
                                                    task.taskId(),
                                                    task.taskName(),
                                                    task.deadline(),
                                                    new UserAvatarDto(user.getUserId(), user.getNickname(), user.getAvatar())
                                            );
                                        })
                                        .toList()
                        ))
                        .toList();
            }
        } catch (Exception e) {
            System.err.println("Error calling Task Service: " + e.getMessage());
            throw e;
        }
        return null;
    }



    // ====================== Task Put ======================

    @PutMapping("/tasklists/{taskListId}/edit")
    public String editTaskListName(@PathVariable("taskListId") Long taskListId,
                                   @RequestBody EditTaskListNameRequest request) {

        String url =  taskServiceUrl + "/internal/tasklists/" + taskListId + "/edit";

        HttpEntity<EditTaskListNameRequest> bodyForTaskCommentRequest = new HttpEntity<>(request);

        ResponseEntity<String> taskListChangeResponse = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                bodyForTaskCommentRequest,
                new ParameterizedTypeReference<>() {
                }
        );

        if (taskListChangeResponse.getBody() != null) {
            return taskListChangeResponse.getBody();
        }
        return null;
    }

    @PutMapping("/tasks/{taskId}/edit")
    public String editTask(@PathVariable("taskId") Long taskId, @RequestBody EditTaskRequest request) {
        GetTaskAndUsersWhichDoingTaskAndCreatedByResponse task = getTask(taskId);

        String url =  taskServiceUrl + "/internal/tasks/" + taskId + "/edit";

        // Добавляем request в тело
        HttpEntity<EditTaskRequest> bodyForTaskEditRequest = new HttpEntity<>(request);

        ResponseEntity<String> editTaskResponse = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                bodyForTaskEditRequest,
                new ParameterizedTypeReference<>() {
                }
        );

        if (editTaskResponse.getBody() != null) {
            return editTaskResponse.getBody();
        }
        return null;
    }

    // ====================== Task Delete ======================

    @DeleteMapping("/tasklists/{taskListId}/delete")
    public String deleteTaskList(@PathVariable("taskListId") Long taskListId) {
        String url = taskServiceUrl + "/internal/tasklists/" + taskListId + "/delete";

        ResponseEntity<String> editTaskListResponse = restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                null,
                new ParameterizedTypeReference<>() {
                }
        );

        if (editTaskListResponse.getBody() != null) {
            return editTaskListResponse.getBody();
        }
        return null;
    }

    @DeleteMapping("/tasks/{taskId}/delete")
    public String deleteTask(@PathVariable("taskId") Long taskId) {
        String url = taskServiceUrl + "/internal/tasks/" + taskId + "/delete";

        ResponseEntity<String> editTaskResponse = restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                null,
                new ParameterizedTypeReference<>() {
                }
        );

        if (editTaskResponse.getBody() != null) {
            return editTaskResponse.getBody();
        }
        return null;
    }

    @DeleteMapping("tasks/{taskId}/users/{userId}/remove")
    public String removeUserFromTask(@PathVariable("taskId") Long taskId, @PathVariable("userId") Long userId) {
        String url = taskServiceUrl + "/internal/tasks/" + taskId + "/users/" + userId + "/remove";

        ResponseEntity<String> editTaskResponse = restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                null,
                new ParameterizedTypeReference<>() {
                }
        );

        if (editTaskResponse.getBody() != null) {
            return editTaskResponse.getBody();
        }
        return null;
    }

    // ====================== Board Element Post======================

    //Создание фигуры
    @PostMapping("/boards/{boardId}/elements/shape")
    public BoardElementDto createShapeElement(
            @PathVariable Long boardId,
            @RequestBody CreateShapeElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/shape";

        HttpEntity<CreateShapeElementRequest> entity = new HttpEntity<>(request);

        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                BoardElementDto.class
        );

        return response.getBody();
    }

    //Создание стрелки
    @PostMapping("/boards/{boardId}/elements/arrow")
    public BoardElementDto createArrowElement(
            @PathVariable Long boardId,
            @RequestBody CreateArrowElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/arrow";

        HttpEntity<CreateArrowElementRequest> entity = new HttpEntity<>(request);

        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                BoardElementDto.class
        );

        return response.getBody();
    }

    //Создание текста
    @PostMapping("/boards/{boardId}/elements/text")
    public BoardElementDto createTextElement(
            @PathVariable Long boardId,
            @RequestBody CreateTextElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/text";

        HttpEntity<CreateTextElementRequest> entity = new HttpEntity<>(request);

        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                BoardElementDto.class
        );

        return response.getBody();
    }

    //Создание изображения
    @PostMapping("boards/{boardId}/elements/image")
    public BoardElementDto createImageElement(
            @PathVariable Long boardId,
            @RequestParam("file") MultipartFile file,           // файл изображения
            @ModelAttribute CreateImageElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/image";

        // Создаём multipart запрос
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", file.getResource());
        body.add("x", request.x());
        body.add("y", request.y());
        body.add("z", request.z());
        body.add("width", request.width());
        body.add("height", request.height());
        body.add("color", null);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                BoardElementDto.class
        );

        return response.getBody();
    }

    // Создание таблицы
    @PostMapping("/boards/{boardId}/elements/table")
    public BoardElementDto createTableElement(
            @PathVariable Long boardId,
            @RequestBody CreateTableElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("User is not authenticated");

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/table";
        HttpEntity<CreateTableElementRequest> entity = new HttpEntity<>(request);
        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, BoardElementDto.class
        );
        return response.getBody();
    }

    // Созрание рисования
    @PostMapping("/boards/{boardId}/elements/drawing")
    public BoardElementDto createDrawingElement(
            @PathVariable Long boardId,
            @RequestBody CreateDrawingElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("User is not authenticated");

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/drawing";
        HttpEntity<CreateDrawingElementRequest> entity = new HttpEntity<>(request);
        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, BoardElementDto.class
        );
        return response.getBody();
    }

    // Создание комментария на доске
    @PostMapping("/boards/{boardId}/elements/comment")
    public BoardElementDto createCommentElement(
            @PathVariable Long boardId,
            @RequestBody CreateCommentElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("User is not authenticated");

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/comment";
        HttpEntity<CreateCommentElementRequest> entity = new HttpEntity<>(request);
        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, BoardElementDto.class
        );
        return response.getBody();
    }

    // Добавление ответа к комментарию на доске
    @PostMapping("/boards/{boardId}/elements/comment/{commentElementId}/reply")
    public CommentReplyDto addCommentReply(
            @PathVariable Long boardId,
            @PathVariable Long commentElementId,
            @RequestBody AddCommentReplyRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("User is not authenticated");

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/comment/" + commentElementId + "/reply";
        HttpEntity<AddCommentReplyRequest> entity = new HttpEntity<>(request);
        ResponseEntity<CommentReplyDto> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, CommentReplyDto.class
        );
        return response.getBody();
    }

    // ====================== Board Element Put======================

    //Изменение значений ячеек у таблицы
    @PutMapping("/boards/{boardId}/elements/table/{tableElementId}/cell")
    public TableCellDto updateTableCell(
            @PathVariable Long boardId,
            @PathVariable Long tableElementId,
            @RequestBody UpdateTableCellRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/table/" + tableElementId + "/cell";
        HttpEntity<UpdateTableCellRequest> entity = new HttpEntity<>(request);
        ResponseEntity<TableCellDto> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                TableCellDto.class
        );
        return response.getBody();
    }

    //Обновление фигуры
    @PutMapping("/boards/{boardId}/elements/shape/{elementId}")
    public BoardElementDto updateShapeElement(
            @PathVariable Long boardId,
            @PathVariable Long elementId,
            @RequestBody UpdateShapeElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/shape/" + elementId;
        HttpEntity<UpdateShapeElementRequest> entity = new HttpEntity<>(request);
        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                BoardElementDto.class
        );
        return response.getBody();
    }

    //Обновление стрелки
    @PutMapping("/boards/{boardId}/elements/arrow/{elementId}")
    public BoardElementDto updateArrowElement(
            @PathVariable Long boardId,
            @PathVariable Long elementId,
            @RequestBody UpdateArrowElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/arrow/" + elementId;
        HttpEntity<UpdateArrowElementRequest> entity = new HttpEntity<>(request);
        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                BoardElementDto.class
        );
        return response.getBody();
    }

    //Обновление текста
    @PutMapping("/boards/{boardId}/elements/text/{elementId}")
    public BoardElementDto updateTextElement(
            @PathVariable Long boardId,
            @PathVariable Long elementId,
            @RequestBody UpdateTextElementRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/text/" + elementId;
        HttpEntity<UpdateTextElementRequest> entity = new HttpEntity<>(request);
        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                BoardElementDto.class
        );
        return response.getBody();
    }

    @PutMapping("/users/{userId}/avatar")
    public UserInfoDto uploadAvatar(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        // пользователь может менять аватарку только себе
        Long authUserId = Long.valueOf(jwt.getSubject());
        if (!authUserId.equals(userId)) {
            throw new SecurityException("You can only update your own avatar");
        }

        String url = accountServiceUrl + "/internal/users/" + userId + "/avatar";

        // Формируем multipart-запрос для пересылки файла
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", file.getResource());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<UserInfoDto> response = restTemplate.exchange(
                url, HttpMethod.PUT, entity, UserInfoDto.class);

        return response.getBody();
    }

    // ====================== Board Element Get ======================

    // Получение всех элементов доски
    @GetMapping("/boards/{boardId}/elements")
    public List<BoardElementDto> getAllBoardElements(@PathVariable Long boardId) {
        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements";
        ResponseEntity<List<BoardElementDto>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<BoardElementDto>>() {}
        );
        return response.getBody();
    }

    // Получение конкретной таблицы
    @GetMapping("/boards/{boardId}/elements/table/{tableElementId}")
    public BoardElementDto getTableElement(
            @PathVariable Long boardId,
            @PathVariable Long tableElementId) {
        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/table/" + tableElementId;
        ResponseEntity<BoardElementDto> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                BoardElementDto.class
        );
        return response.getBody();
    }

    // ====================== Board Element Delete ======================

    //Универальное удаление элемента
    @DeleteMapping("/boards/{boardId}/elements/{elementId}")
    public String deleteBoardElement(
            @PathVariable Long boardId,
            @PathVariable Long elementId,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String url = boardServiceUrl + "/internal/boards/" + boardId + "/elements/" + elementId;
        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                null,
                String.class
        );
        return response.getBody();
    }

    // ====================== Invitation Post ======================

    // Создание ссылки-приглашения
    @PostMapping("/spaces/{spaceId}/invitations/create")
    public InvitationLinkResponse createInvitation(
            @PathVariable Long spaceId,
            @RequestBody(required = false) CreateInvitationRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) throw new IllegalArgumentException("User is not authenticated");

        // Извлекаем userId из токена
        Long userId = Long.valueOf(jwt.getSubject());

        String url = boardServiceUrl + "/internal/invitations/spaces/" + spaceId + "/create";

        // Добавляем заголовки, включая X-User-Id
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CreateInvitationRequest> entity = new HttpEntity<>(
                request != null ? request : new CreateInvitationRequest(7L),
                headers  //
        );

        return restTemplate.exchange(url, HttpMethod.POST, entity, InvitationLinkResponse.class).getBody();
    }

    @PostMapping("/invitations/{token}/accept")
    public ResponseEntity<String> acceptInvitation(
            @PathVariable String token,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Long userId = Long.valueOf(jwt.getSubject());

        String url = boardServiceUrl + "/internal/invitations/" + token + "/accept";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            String body = response.getBody();
            if ("SUCCESS".equals(body) || "ALREADY_MEMBER".equals(body)) {
                return ResponseEntity.ok(body);
            } else {
                return ResponseEntity.status(response.getStatusCode()).body(body);
            }
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Internal error");
        }
    }

}