package com.azobioz.account.controller;

import com.azobioz.account.dto.UserInfoDto;
import com.azobioz.account.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    @GetMapping("/{userId}")
    public UserInfoDto getUserById(@PathVariable Long userId) {
        return userService.getUserById(userId);
    }

    //Post, потому что в Spring Get с @RequestBody не работает
    @PostMapping("/by-ids")
    public List<UserInfoDto> getUsersByIds(@RequestBody List<Long> userIds) {
        return userService.getUsersByIds(userIds);
    }

    @PutMapping("/{userId}/avatar")
    public UserInfoDto uploadAvatar(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        return userService.uploadAvatar(userId, file);
    }

    @PutMapping("/{userId}/description")
    public UserInfoDto updateDescription(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        return userService.updateDescription(userId, request.get("description"));
    }

}
