package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class LuckTransactionGuard {
    private final EntityManager em;

    public void requireLocked(RacePlayer player) {
        if (!em.contains(player) || !em.contains(player.getRace())
                || em.getLockMode(player) != LockModeType.PESSIMISTIC_WRITE
                || em.getLockMode(player.getRace()) != LockModeType.PESSIMISTIC_WRITE) {
            throw new IllegalStateException();
        }
    }

    public void requireOwnedAnsweredNormal(RacePlayer player, PlayerQuestion question) {
        if (!em.contains(question) || question.getId() == null
                || !Objects.equals(question.getRacePlayer().getId(), player.getId())
                || !Objects.equals(question.getRacePlayer().getRace().getId(), player.getRace().getId())
                || question.getStatus() != PlayerQuestionStatus.ANSWERED
                || question.getGameplayContext() != QuestionGameplayContext.NORMAL) {
            throw new IllegalArgumentException();
        }
    }
}