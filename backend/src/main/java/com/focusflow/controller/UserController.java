package com.focusflow.controller;

import com.focusflow.dto.UserPreferencesRequest;
import com.focusflow.dto.UserPreferencesResponse;
import com.focusflow.model.User;
import com.focusflow.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/me/preferences")
    public ResponseEntity<UserPreferencesResponse> updatePreferences(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UserPreferencesRequest request) {
        UserPreferencesResponse response = userService.updatePreferences(currentUser, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/preferences")
    public ResponseEntity<UserPreferencesResponse> getPreferences(
            @AuthenticationPrincipal User currentUser) {
        UserPreferencesResponse response = userService.getPreferences(currentUser);
        return ResponseEntity.ok(response);
    }
}
