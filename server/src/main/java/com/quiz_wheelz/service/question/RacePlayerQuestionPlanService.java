package com.quiz_wheelz.service.question;

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

import java.util.ArrayList;
import java.util.Collections;
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

    @Transactional(readOnly = true, noRollbackFor = ApiException.class)
    public List<QuestionTemplate> templatesInTurn(RacePlayer racePlayer) {
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

        return orderTemplatesByPlayerProgress(
                racePlayer,
                templates
        );
    }

    private List<QuestionTemplate> orderTemplatesByPlayerProgress(
            RacePlayer racePlayer,
            List<QuestionTemplate> templates
    ) {
        long generatedQuestionsCount = playerQuestionRepository.countByRacePlayer(racePlayer);
        int templateIndex = (int) (generatedQuestionsCount % templates.size());

        List<QuestionTemplate> templatesInTurn = new ArrayList<>(templates);
        Collections.rotate(templatesInTurn, -templateIndex);

        return templatesInTurn;
    }

    private void validateRacePlayerForQuestionPlan(RacePlayer racePlayer) {
        if (racePlayer == null
                || racePlayer.getRace() == null
                || racePlayer.getRace().getSubject() == null
                || racePlayer.getCurrentDifficulty() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
