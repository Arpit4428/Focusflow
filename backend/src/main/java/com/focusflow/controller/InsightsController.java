package com.focusflow.controller;

import com.focusflow.dto.InsightsResponse;
import com.focusflow.model.User;
import com.focusflow.service.InsightsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Insights REST Controller.
 * Exposes statistical analysis and rule-based productivity insights.
 */
@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    private final InsightsService insightsService;

    public InsightsController(InsightsService insightsService) {
        this.insightsService = insightsService;
    }

    @GetMapping
    public ResponseEntity<InsightsResponse> getInsights(@AuthenticationPrincipal User currentUser) {
        InsightsResponse response = insightsService.getInsights(currentUser);
        return ResponseEntity.ok(response);
    }
}
