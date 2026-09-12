package com.focusflow.controller;

import com.focusflow.dto.FocusSessionRequest;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.model.User;
import com.focusflow.service.FocusSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Focus Session REST Controller.
 * Exposes endpoints for saving and viewing focused study sessions.
 */
@RestController
@RequestMapping("/api/focus-sessions")
public class FocusSessionController {

    private final FocusSessionService focusSessionService;

    public FocusSessionController(FocusSessionService focusSessionService) {
        this.focusSessionService = focusSessionService;
    }

    @PostMapping
    public ResponseEntity<FocusSessionResponse> createSession(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody FocusSessionRequest request) {
        FocusSessionResponse response = focusSessionService.createSession(request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FocusSessionResponse>> getSessions(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String subject) {
        List<FocusSessionResponse> sessions = focusSessionService.getSessions(currentUser, subject);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FocusSessionResponse> getSessionById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String id) {
        FocusSessionResponse session = focusSessionService.getSessionById(id, currentUser);
        return ResponseEntity.ok(session);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String id) {
        focusSessionService.deleteSession(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
