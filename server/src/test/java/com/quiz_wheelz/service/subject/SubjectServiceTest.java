package com.quiz_wheelz.service.subject;

import com.quiz_wheelz.dto.subject.SubjectResponse;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubjectServiceTest {

    @Mock
    private SubjectRepository subjectRepository;

    @InjectMocks
    private SubjectService subjectService;

    @Test
    void shouldReturnActiveSubjectsAsResponses() {
        Subject math = new Subject();
        math.setName("Math");
        math.setCode("MATH");
        math.setActive(true);

        when(subjectRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(math));

        List<SubjectResponse> subjects = subjectService.getActiveSubjects();

        assertEquals(1, subjects.size());
        assertEquals("Math", subjects.getFirst().getName());
        assertEquals("MATH", subjects.getFirst().getCode());
    }

    @Test
    void shouldReturnTrueWhenSubjectCodeExistsAndIsActive() {
        Subject math = new Subject();
        math.setCode("MATH");
        math.setActive(true);

        when(subjectRepository.findByCode("MATH")).thenReturn(Optional.of(math));

        assertTrue(subjectService.existsActiveByCode("MATH"));
    }

    @Test
    void shouldReturnFalseWhenSubjectCodeDoesNotExistOrIsInactive() {
        Subject inactiveSubject = new Subject();
        inactiveSubject.setCode("OLD");
        inactiveSubject.setActive(false);

        when(subjectRepository.findByCode("OLD")).thenReturn(Optional.of(inactiveSubject));
        when(subjectRepository.findByCode("MISSING")).thenReturn(Optional.empty());

        assertFalse(subjectService.existsActiveByCode("OLD"));
        assertFalse(subjectService.existsActiveByCode("MISSING"));
    }

    @Test
    void shouldFindActiveSubjectByCode() {
        Subject math = new Subject();
        math.setCode("MATH");
        math.setActive(true);

        when(subjectRepository.findByCode("MATH")).thenReturn(Optional.of(math));

        assertSame(math, subjectService.findActiveByCodeOrThrow("MATH"));
    }

    @Test
    void shouldThrowWhenSubjectByCodeIsInactive() {
        Subject inactiveSubject = new Subject();
        inactiveSubject.setCode("OLD");
        inactiveSubject.setActive(false);

        when(subjectRepository.findByCode("OLD")).thenReturn(Optional.of(inactiveSubject));

        assertThrows(ApiException.class, () -> subjectService.findActiveByCodeOrThrow("OLD"));
    }

    @Test
    void shouldFindActiveSubjectById() {
        Subject math = new Subject();
        math.setCode("MATH");
        math.setName("Math");
        math.setActive(true);

        when(subjectRepository.findById(1L)).thenReturn(Optional.of(math));

        assertSame(math, subjectService.findActiveByIdOrThrow(1L));
    }

    @Test
    void shouldThrowWhenSubjectByIdIsInactive() {
        Subject inactiveSubject = new Subject();
        inactiveSubject.setCode("OLD");
        inactiveSubject.setName("Old Subject");
        inactiveSubject.setActive(false);

        when(subjectRepository.findById(2L)).thenReturn(Optional.of(inactiveSubject));

        assertThrows(ApiException.class, () -> subjectService.findActiveByIdOrThrow(2L));
    }
}
