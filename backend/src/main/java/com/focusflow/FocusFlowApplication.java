package com.focusflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * FocusFlow Main Application Entry Point
 * Demonstrates Spring Boot MVC Architecture, Spring Data MongoDB,
 * and Declarative Asynchronous processing (@EnableAsync).
 */
@SpringBootApplication
@EnableAsync
public class FocusFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(FocusFlowApplication.class, args);
    }
}
