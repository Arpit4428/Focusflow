package com.focusflow.controller;

import com.focusflow.dto.CalendarResponse;
import com.focusflow.model.User;
import com.focusflow.service.CalendarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Calendar Activity REST Controller.
 * Injects authenticated User to guarantee strict tenant isolation for calendar analytics.
 */
@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public ResponseEntity<CalendarResponse> getCalendarActivity(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        CalendarResponse response = calendarService.getCalendarActivity(currentUser, year, month);
        return ResponseEntity.ok(response);
    }
}
