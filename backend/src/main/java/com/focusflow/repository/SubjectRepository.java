package com.focusflow.repository;

import com.focusflow.model.Subject;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends MongoRepository<Subject, String> {

    List<Subject> findByUserIdOrderByNameAsc(String userId);

    Optional<Subject> findByIdAndUserId(String id, String userId);

    Optional<Subject> findByUserIdAndNameIgnoreCase(String userId, String name);

    boolean existsByUserIdAndNameIgnoreCase(String userId, String name);

    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(String userId, String name, String id);
}
