package com.azobioz.account.service;

import com.azobioz.account.model.Language;
import com.azobioz.account.model.Theme;
import com.azobioz.account.model.UserSetting;
import com.azobioz.account.repository.UserSettingRepository;
import org.springframework.stereotype.Service;

import com.azobioz.account.dto.LoginRequest;
import com.azobioz.account.dto.RegisterRequest;
import com.azobioz.account.model.User;
import com.azobioz.account.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSettingRepository userSettingRepository;

    public User register(RegisterRequest req) {
        if (userRepository.findByNickname(req.nickname()).isPresent()) {
            throw new RuntimeException("Nickname already exists");
        }
        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Создаём настройки по умолчанию
        UserSetting defaultSettings = new UserSetting();
        defaultSettings.setAnimation(true);
        defaultSettings.setTheme(Theme.REGULAR);
        defaultSettings.setLanguage(Language.RUSSIAN);

        User user = new User();
        user.setNickname(req.nickname());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setDescription("");
        user.setCreatedAt(LocalDate.now());

        user.setUserSetting(defaultSettings);

        return userRepository.save(user); // JPA сам сохранит UserSetting
    }

    public User login(LoginRequest req) {
        User user = userRepository.findByNickname(req.nickname())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new RuntimeException("Wrong password");
        }
        return user;
    }
}
