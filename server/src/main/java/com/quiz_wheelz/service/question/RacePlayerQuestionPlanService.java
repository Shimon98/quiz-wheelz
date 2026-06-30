package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RacePlayerQuestionPlanService {

    private final QuestionTemplateRepository questionTemplateRepository;
    private final PlayerQuestionRepository playerQuestionRepository;

    public RacePlayerQuestionPlanService(
            QuestionTemplateRepository questionTemplateRepository,
            PlayerQuestionRepository playerQuestionRepository
    ) {
        this.questionTemplateRepository = questionTemplateRepository;
        this.playerQuestionRepository = playerQuestionRepository;
    }

    @Transactional(readOnly = true)
    public QuestionPlan buildQuestionPlan(RacePlayer racePlayer) {
        validateRacePlayerForQuestionPlan(racePlayer);

        Race race = racePlayer.getRace();
        Subject subject = race.getSubject();
        Difficulty difficulty = racePlayer.getCurrentDifficulty();

        List<QuestionTemplate> templates =
                questionTemplateRepository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                        subject,
                        difficulty
                );

        if (templates.isEmpty()) {
            throw new ApiException(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER);
        }

        QuestionTemplate selectedTemplate = selectTemplateByPlayerProgress(
                racePlayer,
                templates
        );

        validateSelectedTemplate(selectedTemplate);

        return new QuestionPlan(
                subject,
                selectedTemplate.getType(),
                difficulty,
                selectedTemplate.getMinValue(),
                selectedTemplate.getMaxValue(),
                selectedTemplate.getTimeLimitSeconds(),
                selectedTemplate.getChoicesCount(),
                selectedTemplate.getGenerationPattern(),
                QuestionRules.DEFAULT_ADAPTIVE_MODE,
                QuestionRules.DEFAULT_ASSISTANCE_LEVEL
        );
    }

    private QuestionTemplate selectTemplateByPlayerProgress(
            RacePlayer racePlayer,
            List<QuestionTemplate> templates
    ) {
        long generatedQuestionsCount = playerQuestionRepository.countByRacePlayer(racePlayer);
        int templateIndex = (int) (generatedQuestionsCount % templates.size());

        return templates.get(templateIndex);
    }

    private void validateRacePlayerForQuestionPlan(RacePlayer racePlayer) {
        if (racePlayer == null
                || racePlayer.getRace() == null
                || racePlayer.getRace().getSubject() == null
                || racePlayer.getCurrentDifficulty() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }

    private void validateSelectedTemplate(QuestionTemplate selectedTemplate) {
        if (selectedTemplate == null
                || selectedTemplate.getType() == null
                || selectedTemplate.getMinValue() == null
                || selectedTemplate.getMaxValue() == null
                || selectedTemplate.getTimeLimitSeconds() == null
                || selectedTemplate.getChoicesCount() == null
                || selectedTemplate.getGenerationPattern() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
