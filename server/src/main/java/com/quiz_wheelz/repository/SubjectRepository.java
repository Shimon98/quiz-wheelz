package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByActiveTrueOrderByNameAsc();

    Optional<Subject> findByCode(String code);

    boolean existsByCode(String code);
}
