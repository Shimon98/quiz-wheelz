package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AcceptedAnswerLuckService {
    private final boolean enabled;
    private final ObjectProvider<FairLuckService> luck;
    private final PlayerQuestionRepository questions;

    public AcceptedAnswerLuckService(
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED + ":false}") boolean enabled,
            ObjectProvider<FairLuckService> luck, PlayerQuestionRepository questions) {
        this.enabled = enabled;
        this.luck = luck;
        this.questions = questions;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void afterAcceptedNormalAnswer(RacePlayer player, PlayerQuestion question, boolean correct, long instant) {
        if (!enabled || player.getStatus() != RacePlayerStatus.RACING
                || player.getRace().getStatus() != RaceStatus.IN_PROGRESS) {
            return;
        }
        try {
            questions.flush();
            luck.getObject().afterAcceptedManualNormalAnswer(player, question, correct, true, instant);
        } catch (ApiException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
