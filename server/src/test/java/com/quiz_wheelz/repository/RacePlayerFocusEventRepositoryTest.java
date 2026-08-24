package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.Test;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
class RacePlayerFocusEventRepositoryTest {

    private static final String CLIENT_EVENT_ID =
            UUID.fromString("550e8400-e29b-41d4-a716-446655440000").toString();
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 23, 20, 0);

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RacePlayerFocusEventRepository focusEventRepository;

    @Test
    void sameRacePlayerAndClientEventIdIsRejectedByUniqueConstraint() {
        PersistedContext context = persistContext("A");
        entityManager.persistAndFlush(event(
                context.firstPlayer(),
                context.question(),
                CLIENT_EVENT_ID,
                true
        ));

        assertThrows(
                ConstraintViolationException.class,
                () -> entityManager.persistAndFlush(event(
                        context.firstPlayer(),
                        context.question(),
                        CLIENT_EVENT_ID,
                        false
                ))
        );
    }

    @Test
    void sameClientEventIdIsAllowedForDifferentRacePlayers() {
        PersistedContext context = persistContext("B");
        RacePlayerFocusEvent first = entityManager.persist(event(
                context.firstPlayer(),
                context.question(),
                CLIENT_EVENT_ID,
                true
        ));
        RacePlayerFocusEvent second = entityManager.persist(event(
                context.secondPlayer(),
                null,
                CLIENT_EVENT_ID,
                false
        ));
        entityManager.flush();

        assertTrue(first.getId() > 0);
        assertTrue(second.getId() > 0);
        assertTrue(focusEventRepository.findByRacePlayerAndClientEventId(
                context.firstPlayer(),
                CLIENT_EVENT_ID
        ).isPresent());
        assertTrue(focusEventRepository.findByRacePlayerAndClientEventId(
                context.secondPlayer(),
                CLIENT_EVENT_ID
        ).isPresent());
    }

    @Test
    void repositoryFindAndQuestionCountUseDurableAssociation() {
        PersistedContext context = persistContext("C");
        entityManager.persist(event(
                context.firstPlayer(),
                context.question(),
                CLIENT_EVENT_ID,
                true
        ));
        entityManager.persist(event(
                context.firstPlayer(),
                context.question(),
                UUID.randomUUID().toString(),
                true
        ));
        entityManager.persist(event(
                context.firstPlayer(),
                context.question(),
                UUID.randomUUID().toString(),
                false
        ));
        entityManager.flush();

        assertEquals(
                2,
                focusEventRepository
                        .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                                context.firstPlayer(),
                                context.question()
                        )
        );
        RacePlayerFocusEvent found = focusEventRepository
                .findByRacePlayerAndClientEventId(
                        context.firstPlayer(),
                        CLIENT_EVENT_ID
                )
                .orElseThrow();
        assertEquals(RacePlayerFocusEventOutcome.WARNING, found.getOutcome());
        assertEquals(context.question().getId(), found.getPlayerQuestion().getId());
    }

    private PersistedContext persistContext(String suffix) {
        User teacher = new User();
        teacher.setUsername("focus-teacher-" + suffix);
        teacher.setDisplayName("Focus teacher");
        entityManager.persist(teacher);

        Subject subject = new Subject();
        subject.setName("Focus Math " + suffix);
        subject.setCode("FOCUS_MATH_" + suffix);
        entityManager.persist(subject);

        Race race = new Race();
        race.setRoomCode("FOC00" + suffix);
        race.setTitle("Focus integrity race");
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setMaxPlayers(2);
        race.setTotalDistance(1000);
        race.setTeacher(teacher);
        race.setSubject(subject);
        entityManager.persist(race);

        RacePlayer firstPlayer = racePlayer(race, "Noa", 1);
        RacePlayer secondPlayer = racePlayer(race, "Ari", 2);
        entityManager.persist(firstPlayer);
        entityManager.persist(secondPlayer);

        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(subject);
        template.setType(QuestionType.ADDITION);
        template.setDifficulty(Difficulty.EASY);
        template.setGenerationPattern(QuestionGenerationPattern.BINARY_OPERATION);
        template.setMinValue(1);
        template.setMaxValue(10);
        template.setTimeLimitSeconds(30);
        template.setChoicesCount(4);
        entityManager.persist(template);

        PlayerQuestion question = new PlayerQuestion();
        question.setRacePlayer(firstPlayer);
        question.setQuestionTemplate(template);
        question.setQuestionText("4 + 4 = ?");
        question.setCorrectAnswerValue(8);
        question.setTimeLimitSeconds(30);
        question.setStatus(PlayerQuestionStatus.ACTIVE);
        question.setExpiresAt(NOW.plusSeconds(30));
        entityManager.persistAndFlush(question);

        return new PersistedContext(firstPlayer, secondPlayer, question);
    }

    private RacePlayer racePlayer(Race race, String displayName, int laneNumber) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setDisplayName(displayName);
        racePlayer.setLaneNumber(laneNumber);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        return racePlayer;
    }

    private RacePlayerFocusEvent event(
            RacePlayer racePlayer,
            PlayerQuestion question,
            String clientEventId,
            boolean counted
    ) {
        RacePlayerFocusEvent event = new RacePlayerFocusEvent();
        event.setRacePlayer(racePlayer);
        event.setClientEventId(clientEventId);
        event.setType(counted
                ? RacePlayerFocusEventType.TAB_HIDDEN
                : RacePlayerFocusEventType.TAB_VISIBLE);
        event.setPlayerQuestion(question);
        event.setOutcome(counted
                ? RacePlayerFocusEventOutcome.WARNING
                : RacePlayerFocusEventOutcome.VISIBLE);
        event.setCountedFocusLoss(counted);
        event.setFocusLossCountAfter(counted ? 1 : 0);
        event.setQuestionFocusLossCountAfter(counted ? 1 : 0);
        event.setRecordedAt(NOW);
        return event;
    }

    private record PersistedContext(
            RacePlayer firstPlayer,
            RacePlayer secondPlayer,
            PlayerQuestion question
    ) {
    }
}
