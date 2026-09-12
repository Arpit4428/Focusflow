package com.focusflow.controller;

import com.focusflow.dto.DashboardResponse;
import com.focusflow.model.User;
import com.focusflow.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard REST Controller.
 * Exposes aggregated productivity metrics for the authenticated student user.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal User currentUser) {
        DashboardResponse response = dashboardService.getDashboardData(currentUser);
        return ResponseEntity.ok(response);
    }
}
