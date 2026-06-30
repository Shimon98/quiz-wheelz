package com.quiz_wheelz.service.question;

import com.quiz_wheelz.common.PlayerQuestionCleanupRules;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class PlayerQuestionCleanupService {

    private static final List<PlayerQuestionStatus> CLEANUP_STATUSES = List.of(
            PlayerQuestionStatus.ANSWERED,
            PlayerQuestionStatus.EXPIRED
    );

    private final PlayerQuestionRepository playerQuestionRepository;
    private final Clock clock;

    @Autowired
    public PlayerQuestionCleanupService(
            PlayerQuestionRepository playerQuestionRepository
    ) {
        this(playerQuestionRepository, Clock.systemDefaultZone());
    }

    PlayerQuestionCleanupService(
            PlayerQuestionRepository playerQuestionRepository,
            Clock clock
    ) {
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public long cleanupOldInactiveQuestions() {
        LocalDateTime cutoff = LocalDateTime.now(clock)
                .minusDays(PlayerQuestionCleanupRules.RETENTION_DAYS);

        List<PlayerQuestion> oldInactiveQuestions =
                playerQuestionRepository.findByStatusInAndUpdatedAtBefore(
                        CLEANUP_STATUSES,
                        cutoff
                );

        if (oldInactiveQuestions.isEmpty()) {
            return 0;
        }

        playerQuestionRepository.deleteAll(oldInactiveQuestions);

        return oldInactiveQuestions.size();
    }

    @Scheduled(cron = PlayerQuestionCleanupRules.DAILY_CLEANUP_CRON)
    public void runScheduledCleanup() {
        cleanupOldInactiveQuestions();
    }
}
