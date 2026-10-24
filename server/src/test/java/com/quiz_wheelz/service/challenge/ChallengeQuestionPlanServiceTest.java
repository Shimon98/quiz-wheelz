package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.config.seed.MathQuestionTemplateSeedCatalog;
import com.quiz_wheelz.entitys.QuestionTemplate;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.ChallengeChoice;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.QuestionTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ChallengeQuestionPlanServiceTest {
    private final QuestionTemplateRepository repository = mock(QuestionTemplateRepository.class);
    private final ChallengeQuestionPlanService plans = new ChallengeQuestionPlanService(repository);
    private final Subject subject = new Subject();

    @BeforeEach
    void seededCatalog() {
        var seeds = MathQuestionTemplateSeedCatalog.defaultMathSeeds();
        var templates = new ArrayList<QuestionTemplate>();
        for (int index = 0; index < seeds.size(); index++) {
            var seed = seeds.get(index);
            var template = new QuestionTemplate();
            template.setId(index + 1L);
            template.setSubject(subject);
            template.setType(seed.getQuestionType());
            template.setDifficulty(seed.getDifficulty());
            template.setGenerationPattern(seed.getGenerationPattern());
            templates.add(template);
        }
        for (var difficulty : Difficulty.values()) {
            when(repository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, difficulty))
                    .thenReturn(templates.stream().filter(template -> template.getDifficulty() == difficulty).toList());
        }
    }

    @Test
    void turboRotatesOverEveryStructuralHardTemplateAndNothingElse() {
        var selected = LongStream.rangeClosed(1, 10)
                .mapToObj(id -> plans.selectTemplate(offer(id, ChallengeChoice.TURBO_TRIAL, 0)))
                .toList();
        assertTrue(selected.stream().allMatch(template -> template.getDifficulty() == Difficulty.HARD));
        assertEquals(ChallengeExecutionRules.TURBO_GENERATION_PATTERNS,
                selected.stream().map(QuestionTemplate::getGenerationPattern).collect(Collectors.toSet()));
    }

    @Test
    void safeAsksOnlyShortAdditionAndSubtractionAndVariesAcrossItsQuestions() {
        for (long id = 1; id <= 6; id++) {
            var types = new ArrayList<QuestionType>();
            for (int resolved = 0; resolved < ChallengeExecutionRules.SAFE_QUESTIONS; resolved++) {
                var template = plans.selectTemplate(offer(id, ChallengeChoice.SAFE_RUN, resolved));
                assertEquals(Difficulty.EASY, template.getDifficulty());
                assertEquals(QuestionGenerationPattern.BINARY_OPERATION, template.getGenerationPattern());
                types.add(template.getType());
            }
            assertEquals(ChallengeExecutionRules.SAFE_QUESTION_TYPES, Set.copyOf(types));
        }
    }

    @Test
    void theSameOfferAndQuestionAlwaysSelectTheSameTemplate() {
        for (var choice : ChallengeChoice.values()) {
            assertSame(plans.selectTemplate(offer(7, choice, 1)), plans.selectTemplate(offer(7, choice, 1)));
        }
    }

    @Test
    void withoutAnApprovedTemplateThereIsNoChallengeQuestion() {
        var binaryOnly = repository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, Difficulty.HARD).stream()
                .filter(template -> template.getGenerationPattern() == QuestionGenerationPattern.BINARY_OPERATION)
                .toList();
        when(repository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, Difficulty.HARD)).thenReturn(binaryOnly);
        assertFalse(plans.hasTemplates(subject, ChallengeChoice.TURBO_TRIAL));
        assertTrue(plans.hasTemplates(subject, ChallengeChoice.SAFE_RUN));
        var error = assertThrows(ApiException.class,
                () -> plans.selectTemplate(offer(1, ChallengeChoice.TURBO_TRIAL, 0)));
        assertEquals(ErrorCode.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER, error.getErrorCode());
    }

    private RacePlayerChallengeOffer offer(long id, ChallengeChoice choice, int resolved) {
        var race = new Race();
        race.setSubject(subject);
        var player = new RacePlayer();
        player.setRace(race);
        var offer = new RacePlayerChallengeOffer();
        offer.setId(id);
        offer.setRacePlayer(player);
        offer.setChoice(choice);
        offer.setQuestionsResolved(resolved);
        return offer;
    }
}
