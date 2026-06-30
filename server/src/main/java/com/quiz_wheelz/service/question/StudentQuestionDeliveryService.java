package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class StudentQuestionDeliveryService {

    private final PlayerQuestionRepository playerQuestionRepository;
    private final PlayerQuestionChoiceRepository playerQuestionChoiceRepository;
    private final QuestionGenerationService questionGenerationService;
    private final PlayerQuestionPersistenceService playerQuestionPersistenceService;
    private final StudentQuestionResponseMapper studentQuestionResponseMapper;
    private final Clock clock;

    @Autowired
    public StudentQuestionDeliveryService(
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            QuestionGenerationService questionGenerationService,
            PlayerQuestionPersistenceService playerQuestionPersistenceService,
            StudentQuestionResponseMapper studentQuestionResponseMapper
    ) {
        this(
                playerQuestionRepository,
                playerQuestionChoiceRepository,
                questionGenerationService,
                playerQuestionPersistenceService,
                studentQuestionResponseMapper,
                Clock.systemDefaultZone()
        );
    }

    StudentQuestionDeliveryService(
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            QuestionGenerationService questionGenerationService,
            PlayerQuestionPersistenceService playerQuestionPersistenceService,
            StudentQuestionResponseMapper studentQuestionResponseMapper,
            Clock clock
    ) {
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.questionGenerationService = Objects.requireNonNull(questionGenerationService);
        this.playerQuestionPersistenceService = Objects.requireNonNull(playerQuestionPersistenceService);
        this.studentQuestionResponseMapper = Objects.requireNonNull(studentQuestionResponseMapper);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public StudentQuestionResponse getOrCreateCurrentQuestion(
            RacePlayer racePlayer,
            QuestionPlan questionPlan
    ) {
        validateInput(racePlayer, questionPlan);

        return playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )
                .map(activeQuestion -> handleExistingActiveQuestion(
                        racePlayer,
                        questionPlan,
                        activeQuestion
                ))
                .orElseGet(() -> generatePersistAndMapQuestion(
                        racePlayer,
                        questionPlan
                ));
    }

    private StudentQuestionResponse handleExistingActiveQuestion(
            RacePlayer racePlayer,
            QuestionPlan questionPlan,
            PlayerQuestion activeQuestion
    ) {
        validateExistingQuestion(activeQuestion);

        if (!isExpired(activeQuestion)) {
            return mapToStudentResponse(activeQuestion);
        }

        expireQuestion(activeQuestion);

        return generatePersistAndMapQuestion(
                racePlayer,
                questionPlan
        );
    }

    private StudentQuestionResponse generatePersistAndMapQuestion(
            RacePlayer racePlayer,
            QuestionPlan questionPlan
    ) {
        InternalGeneratedQuestion generatedQuestion = questionGenerationService.generate(questionPlan);

        PlayerQuestion persistedQuestion = playerQuestionPersistenceService.persistGeneratedQuestion(
                racePlayer,
                generatedQuestion
        );

        return mapToStudentResponse(persistedQuestion);
    }

    private StudentQuestionResponse mapToStudentResponse(
            PlayerQuestion playerQuestion
    ) {
        List<PlayerQuestionChoice> choices = playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(playerQuestion);

        return studentQuestionResponseMapper.toResponse(
                playerQuestion,
                choices
        );
    }

    private void expireQuestion(PlayerQuestion playerQuestion) {
        playerQuestion.setStatus(PlayerQuestionStatus.EXPIRED);
        playerQuestionRepository.save(playerQuestion);
    }

    private boolean isExpired(PlayerQuestion playerQuestion) {
        return !playerQuestion.getExpiresAt().isAfter(LocalDateTime.now(clock));
    }

    private void validateInput(
            RacePlayer racePlayer,
            QuestionPlan questionPlan
    ) {
        if (racePlayer == null || questionPlan == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateExistingQuestion(PlayerQuestion playerQuestion) {
        if (playerQuestion == null || playerQuestion.getExpiresAt() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
