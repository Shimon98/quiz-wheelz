package com.quiz_wheelz.service;

import com.quiz_wheelz.dto.subject.SubjectResponse;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;

    public SubjectService(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @Transactional(readOnly = true)
    public List<SubjectResponse> getActiveSubjects() {
        return subjectRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(SubjectResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean existsActiveByCode(String code) {
        return subjectRepository.findByCode(code)
                .map(Subject::isActive)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public Subject findActiveByCodeOrThrow(String code) {
        return subjectRepository.findByCode(code)
                .filter(Subject::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.SUBJECT_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Subject findActiveByIdOrThrow(Long id) {
        return subjectRepository.findById(id)
                .filter(Subject::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.SUBJECT_NOT_FOUND));
    }
}
