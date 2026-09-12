package com.focusflow.repository;

import com.focusflow.model.FocusSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data MongoDB Repository for FocusSession operations.
 * Enforces user tenancy constraints across all queries.
 */
@Repository
public interface FocusSessionRepository extends MongoRepository<FocusSession, String> {

    List<FocusSession> findByUserIdOrderByStartedAtDesc(String userId);

    List<FocusSession> findByUserIdAndSubjectOrderByStartedAtDesc(String userId, String subject);

    List<FocusSession> findByUserIdAndSubjectIdOrderByStartedAtDesc(String userId, String subjectId);

    List<FocusSession> findByUserIdAndStartedAtBetweenOrderByStartedAtDesc(String userId, Instant start, Instant end);

    Optional<FocusSession> findByIdAndUserId(String id, String userId);

    boolean existsBySubjectIdAndUserId(String subjectId, String userId);

    void deleteByIdAndUserId(String id, String userId);
}
