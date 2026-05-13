package com.azobioz.account.service;

import org.springframework.stereotype.Service;

import com.azobioz.account.dto.UserInfoDto;
import com.azobioz.account.model.User;
import com.azobioz.account.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserInfoDto> getUsersByIds(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .map(this::mapToUserInfoDto)
                .collect(Collectors.toList());
    }

    public UserInfoDto getUserById(Long userId) {
        // Можно проверить, имеет ли requester доступ к этому пользователю
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return mapToUserInfoDto(user);
    }

    private UserInfoDto mapToUserInfoDto(User user) {
        return new UserInfoDto(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getDescription(),
                user.getAvatar(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public UserInfoDto updateDescription(Long userId, String newDescription) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setDescription(newDescription != null ? newDescription : "");
        userRepository.save(user);
        return mapToUserInfoDto(user);
    }

    @Transactional
    public UserInfoDto uploadAvatar(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Avatar file cannot be empty");
        }
        if (file.getSize() > 5 * 1024 * 1024) { // Лимит 5 МБ
            throw new IllegalArgumentException("Avatar file size exceeds 5MB limit");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        try {
            user.setAvatar(file.getBytes()); // Сохраняем байты в БД
            userRepository.save(user);
            return mapToUserInfoDto(user);
        } catch (IOException e) {
            throw new RuntimeException("Failed to process avatar file", e);
        }
    }
}
