package com.focusflow.service;

import com.focusflow.dto.UserPreferencesRequest;
import com.focusflow.dto.UserPreferencesResponse;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserPreferencesResponse updatePreferences(User currentUser, UserPreferencesRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + currentUser.getId()));

        user.setDailyFocusGoalMinutes(request.getDailyFocusGoalMinutes());
        userRepository.save(user);

        return new UserPreferencesResponse(user.getDailyFocusGoalMinutes());
    }

    public UserPreferencesResponse getPreferences(User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + currentUser.getId()));

        return new UserPreferencesResponse(user.getDailyFocusGoalMinutes());
    }
}
