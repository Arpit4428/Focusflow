package com.focusflow.repository;

import com.focusflow.model.Priority;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data MongoDB Repository for Task operations.
 * Demonstrates declarative query method derivation with userId tenancy constraints.
 */
@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    List<Task> findByUserIdOrderByDueDateAsc(String userId);

    List<Task> findByUserIdAndStatusOrderByDueDateAsc(String userId, TaskStatus status);

    List<Task> findByUserIdAndPriorityOrderByDueDateAsc(String userId, Priority priority);

    List<Task> findByUserIdAndStatusAndPriorityOrderByDueDateAsc(String userId, TaskStatus status, Priority priority);

    Optional<Task> findByIdAndUserId(String id, String userId);

    boolean existsByIdAndUserId(String id, String userId);

    boolean existsBySubjectIdAndUserId(String subjectId, String userId);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, TaskStatus status);

    void deleteByIdAndUserId(String id, String userId);
}
