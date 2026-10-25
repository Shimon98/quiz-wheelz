package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeExecutionRules;
import com.quiz_wheelz.config.seed.MathQuestionTemplateSeedCatalog;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
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
import com.quiz_wheelz.service.question.QuestionGenerationService;
import com.quiz_wheelz.service.question.QuestionTemplateFallbackService;
import com.quiz_wheelz.service.question.QuestionTemplateSelectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.dao.QueryTimeoutException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.LongStream;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ChallengeQuestionPlanServiceTest {
    private final QuestionTemplateRepository repository = mock(QuestionTemplateRepository.class);
    private final QuestionGenerationService generation = mock(QuestionGenerationService.class);
    private final ChallengeQuestionPlanService plans = new ChallengeQuestionPlanService(repository,
            new QuestionTemplateFallbackService(new QuestionTemplateSelectionService(repository), generation));
    private final Subject subject = new Subject();
    private final InternalGeneratedQuestion question = new InternalGeneratedQuestion(subject, null,
            QuestionType.ADDITION, Difficulty.EASY, "1 + 1", 2, 30, List.of());

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
            template.setMinValue(seed.getMinValue());
            template.setMaxValue(seed.getMaxValue());
            template.setTimeLimitSeconds(seed.getTimeLimitSeconds());
            template.setChoicesCount(seed.getChoicesCount());
            templates.add(template);
        }
        for (var difficulty : Difficulty.values()) {
            when(repository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, difficulty))
                    .thenReturn(templates.stream().filter(template -> template.getDifficulty() == difficulty).toList());
        }
        when(generation.generateFromTemplate(any(), any(), any())).thenReturn(question);
    }

    @Test
    void turboRotatesOverEveryStructuralHardTemplateAndNothingElse() {
        var selected = LongStream.rangeClosed(1, 10)
                .mapToObj(id -> plans.selectTemplates(offer(id, ChallengeChoice.TURBO_TRIAL, 0)).getFirst())
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
                var template = plans.selectTemplates(offer(id, ChallengeChoice.SAFE_RUN, resolved)).getFirst();
                assertEquals(Difficulty.EASY, template.getDifficulty());
                assertEquals(QuestionGenerationPattern.BINARY_OPERATION, template.getGenerationPattern());
                types.add(template.getType());
            }
            assertEquals(ChallengeExecutionRules.SAFE_QUESTION_TYPES, Set.copyOf(types));
        }
    }

    @Test
    void theSameOfferAndQuestionAlwaysSelectTheSameTemplatesInTheSameOrder() {
        for (var choice : ChallengeChoice.values()) {
            assertEquals(plans.selectTemplates(offer(7, choice, 1)), plans.selectTemplates(offer(7, choice, 1)));
        }
    }

    @Test
    void theSelectedTemplateComesFirstAndEveryOtherValidOneFollowsOnceInCatalogOrder() {
        var turbo = approvedTemplates(ChallengeChoice.TURBO_TRIAL);
        for (long id = 1; id <= 2L * turbo.size(); id++) {
            var inTurn = plans.selectTemplates(offer(id, ChallengeChoice.TURBO_TRIAL, 0));
            assertEquals(turbo.size(), inTurn.size());
            assertEquals(Set.copyOf(turbo), Set.copyOf(inTurn));
            for (int index = 1; index < inTurn.size(); index++) {
                assertSame(turbo.get((turbo.indexOf(inTurn.get(index - 1)) + 1) % turbo.size()), inTurn.get(index));
            }
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
        assertTrue(plans.selectTemplates(offer(1, ChallengeChoice.TURBO_TRIAL, 0)).isEmpty());
    }

    static Stream<Arguments> malformations() {
        return Stream.of(
                malformation("a minimum above the maximum", template -> {
                    template.setMinValue(50);
                    template.setMaxValue(10);
                }),
                malformation("a negative minimum", template -> template.setMinValue(-1)),
                malformation("no minimum", template -> template.setMinValue(null)),
                malformation("no time limit", template -> template.setTimeLimitSeconds(null)),
                malformation("a time limit below the rules", template -> template.setTimeLimitSeconds(4)),
                malformation("too few choices", template -> template.setChoicesCount(1)),
                malformation("too many choices", template -> template.setChoicesCount(7)),
                malformation("a type its pattern cannot ask", template -> template.setType(QuestionType.DIVISION)),
                malformation("no type", template -> template.setType(null)),
                malformation("no generation pattern", template -> template.setGenerationPattern(null)));
    }

    private static Arguments malformation(String name, Consumer<QuestionTemplate> malform) {
        return Arguments.of(name, malform);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("malformations")
    void aMalformedTemplateIsNeverChosenWhileAHealthyOneRemains(String name, Consumer<QuestionTemplate> malform) {
        var broken = approvedTemplates(ChallengeChoice.TURBO_TRIAL).getFirst();
        malform.accept(broken);

        assertTrue(plans.hasTemplates(subject, ChallengeChoice.TURBO_TRIAL));
        LongStream.rangeClosed(1, 20).forEach(id ->
                assertFalse(plans.selectTemplates(offer(id, ChallengeChoice.TURBO_TRIAL, 0)).contains(broken)));
    }

    @Test
    void theSameOfferAndQuestionKeepTheirTemplateAndEveryHealthyOneStillRotatesIn() {
        var turbo = approvedTemplates(ChallengeChoice.TURBO_TRIAL);
        turbo.getFirst().setChoicesCount(1);
        var healthy = turbo.subList(1, turbo.size());

        var selected = LongStream.rangeClosed(1, 2L * turbo.size())
                .mapToObj(id -> plans.selectTemplates(offer(id, ChallengeChoice.TURBO_TRIAL, 0)).getFirst())
                .collect(Collectors.toSet());
        assertEquals(Set.copyOf(healthy), selected);
        for (long id = 1; id <= 8; id++) {
            assertEquals(plans.selectTemplates(offer(id, ChallengeChoice.TURBO_TRIAL, 0)),
                    plans.selectTemplates(offer(id, ChallengeChoice.TURBO_TRIAL, 0)));
        }
    }

    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void aChoiceLeftWithOnlyMalformedTemplatesMakesTheWholeChallengeUnavailable(ChallengeChoice broken) {
        var availability = new ChallengeQuestionAvailabilityService(plans);
        var player = offer(1, broken, 0).getRacePlayer();
        var other = broken == ChallengeChoice.TURBO_TRIAL ? ChallengeChoice.SAFE_RUN : ChallengeChoice.TURBO_TRIAL;
        assertTrue(availability.available(player));

        approvedTemplates(broken).forEach(template -> template.setChoicesCount(1));

        assertFalse(plans.hasTemplates(subject, broken));
        assertTrue(plans.hasTemplates(subject, other));
        assertFalse(availability.available(player));
        assertTrue(plans.selectTemplates(offer(1, broken, 0)).isEmpty());
    }

    @Test
    void aDatabaseFailureIsNeverMistakenForAMissingTemplate() {
        when(repository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, Difficulty.HARD))
                .thenThrow(new QueryTimeoutException("lock wait timeout"));

        assertThrows(QueryTimeoutException.class, () -> plans.hasTemplates(subject, ChallengeChoice.TURBO_TRIAL));
    }

    @Test
    void aSideWhoseTemplatesCannotGenerateAQuestionMakesTheChallengeUnavailable() {
        when(generation.generateFromTemplate(any(), any(), any())).thenAnswer(invocation -> {
            if (invocation.<QuestionTemplate>getArgument(0).getDifficulty() == Difficulty.HARD) {
                throw new ApiException(ErrorCode.QUESTION_GENERATION_FAILED);
            }
            return question;
        });

        assertFalse(plans.hasTemplates(subject, ChallengeChoice.TURBO_TRIAL));
        assertTrue(plans.hasTemplates(subject, ChallengeChoice.SAFE_RUN));
        assertFalse(new ChallengeQuestionAvailabilityService(plans).available(offer(1, ChallengeChoice.SAFE_RUN, 0)
                .getRacePlayer()));
    }

    @Test
    void theQuestionComesFromTheFirstTemplateInTurnThatCanGenerateIt() {
        var offer = offer(3, ChallengeChoice.TURBO_TRIAL, 0);
        var inTurn = plans.selectTemplates(offer);
        var generated = new InternalGeneratedQuestion(subject, inTurn.get(1), QuestionType.ORDER_OF_OPERATIONS,
                Difficulty.HARD, "2 + 3 * 4", 14, 15, List.of());
        when(generation.generateFromTemplate(same(inTurn.getFirst()), any(), any()))
                .thenThrow(new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG));
        when(generation.generateFromTemplate(same(inTurn.get(1)), any(), any())).thenReturn(generated);

        assertSame(generated, plans.generateQuestion(offer).orElseThrow());
    }

    @Test
    void thereIsNoQuestionWhenNoTemplateInTurnCanGenerateOne() {
        when(generation.generateFromTemplate(any(), any(), any()))
                .thenThrow(new ApiException(ErrorCode.QUESTION_GENERATION_FAILED));

        assertTrue(plans.generateQuestion(offer(3, ChallengeChoice.TURBO_TRIAL, 0)).isEmpty());
    }

    @Test
    void anUnrelatedFailureWhileGeneratingIsNeverReadAsABrokenTemplate() {
        when(generation.generateFromTemplate(any(), any(), any()))
                .thenThrow(new QueryTimeoutException("lock wait timeout"));

        assertThrows(QueryTimeoutException.class, () -> plans.generateQuestion(offer(3, ChallengeChoice.TURBO_TRIAL, 0)));
        assertThrows(QueryTimeoutException.class, () -> plans.hasTemplates(subject, ChallengeChoice.TURBO_TRIAL));

        doThrow(new ApiException(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID))
                .when(generation).generateFromTemplate(any(), any(), any());

        assertEquals(ErrorCode.CHALLENGE_EXECUTION_STATE_INVALID, assertThrows(ApiException.class,
                () -> plans.generateQuestion(offer(3, ChallengeChoice.TURBO_TRIAL, 0))).getErrorCode());
    }

    private List<QuestionTemplate> approvedTemplates(ChallengeChoice choice) {
        if (choice == ChallengeChoice.TURBO_TRIAL) {
            return repository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, Difficulty.HARD).stream()
                    .filter(template -> ChallengeExecutionRules.TURBO_GENERATION_PATTERNS
                            .contains(template.getGenerationPattern()))
                    .toList();
        }
        return repository.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(subject, Difficulty.EASY).stream()
                .filter(template -> template.getGenerationPattern() == QuestionGenerationPattern.BINARY_OPERATION
                        && ChallengeExecutionRules.SAFE_QUESTION_TYPES.contains(template.getType()))
                .toList();
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
