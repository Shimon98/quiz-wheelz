package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.answer.*;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.dto.raceplayer.*;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.challenge.*;
import com.quiz_wheelz.service.question.*;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.function.Consumer;

@Import({ChallengeQuestionDeliveryService.class, StudentChallengeChoiceService.class, StudentRaceStateService.class,
        StudentQuestionDeliveryService.class, PlayerQuestionPersistenceService.class,
        StudentQuestionResponseMapper.class, RacePlayerReconnectService.class, RacePlayerDisconnectService.class})
abstract class S4ChallengeFlowFixture extends RaceChronologyIntegrationFixture {
    @Autowired ChallengeOfferService offers;
    @Autowired RacePlayerGameplayStateService stateService;
    @Autowired RacePlayerChallengeOfferRepository offerRepository;
    @Autowired RacePlayerGameplayStateRepository stateRepository;
    @Autowired RacePlayerSpeedEffectRepository effectRepository;
    @Autowired StudentChallengeChoiceService choiceService;
    @Autowired StudentRaceStateService raceStates;
    @Autowired StudentQuestionDeliveryService questions;
    @Autowired RacePlayerGameplayTimelineService timeline;
    @Autowired RacePlayerReconnectService reconnect;
    @Autowired QuestionTemplateRepository templates;
    Long executionId;

    @BeforeEach
    void prepareChallenge() {
        secondPosition(100.0);
        transactions.executeWithoutResult(status -> {
            var player = locked();
            stateService.obtainForLockedPlayer(player);
            var easy = questionRepository.findById(questionId).orElseThrow().getQuestionTemplate();
            var hard = new QuestionTemplate();
            hard.setSubject(easy.getSubject());
            hard.setType(QuestionType.ORDER_OF_OPERATIONS);
            hard.setDifficulty(Difficulty.HARD);
            hard.setMinValue(easy.getMinValue());
            hard.setMaxValue(easy.getMaxValue());
            hard.setTimeLimitSeconds(45);
            hard.setChoicesCount(easy.getChoicesCount());
            hard.setGenerationPattern(QuestionGenerationPattern.ADD_THEN_MULTIPLY);
            entityManager.persist(hard);
        });
    }

    RacePlayer locked() {
        return playerRepository.findLockedByIdAndRaceId(secondId, raceId).orElseThrow();
    }

    void energy(int amount) {
        transactions.executeWithoutResult(status -> stateRepository.findByRacePlayerId(secondId)
                .orElseThrow().setChallengeEnergy(amount));
    }

    int energy() {
        return transactions.execute(status -> stateRepository.findByRacePlayerId(secondId)
                .orElseThrow().getChallengeEnergy());
    }

    Long openOffer() {
        energy(80);
        var snapshot = answerSecond().getRaceImpact().getSnapshot();
        return snapshot.getGameplay().challenge().offer().offerId();
    }

    RacePlayerChallengeOffer offer(Long id) {
        return transactions.execute(status -> offerRepository.findById(id).orElseThrow());
    }

    StudentRaceRuntimeSnapshotResponse snapshot() {
        return raceStates.getRaceState(secondRequest).getSnapshot();
    }

    void select(ChallengeChoice choice) {
        executionId = openOffer();
        choiceService.choose(secondRequest, new StudentChallengeChoiceRequest(executionId, choice.name()));
    }

    StudentQuestionResponse current() {
        return questions.getOrCreateCurrentQuestion(second());
    }

    SubmitAnswerResponse answer(boolean correct) {
        var question = current();
        Long answerId = transactions.execute(status -> questionRepository.findById(question.getQuestionId())
                .orElseThrow().getChoices().stream().filter(choice -> choice.isCorrect() == correct)
                .findFirst().orElseThrow().getId());
        var request = new SubmitAnswerRequest();
        request.setQuestionId(question.getQuestionId());
        request.setChoiceId(answerId);
        return answerService.submitAnswer(second(), request);
    }

    long activeQuestions() {
        return transactions.<Long>execute(status -> entityManager.createQuery(
                "select count(q) from PlayerQuestion q where q.racePlayer.id = :id and q.status = :status", Long.class)
                .setParameter("id", secondId).setParameter("status", PlayerQuestionStatus.ACTIVE).getSingleResult());
    }

    List<Object> rewards() {
        var player = second();
        return List.of(player.getScore(), player.getPosition(), player.getCorrectAnswers(), player.getWrongAnswers());
    }

    void templatesOf(Difficulty difficulty, Consumer<QuestionTemplate> change) {
        transactions.executeWithoutResult(status -> entityManager.createQuery(
                        "select t from QuestionTemplate t where t.subject = :subject and t.difficulty = :difficulty",
                        QuestionTemplate.class)
                .setParameter("subject", raceSubject()).setParameter("difficulty", difficulty)
                .getResultList().forEach(change));
    }

    void change(QuestionTemplate template, Consumer<QuestionTemplate> change) {
        transactions.executeWithoutResult(status -> change.accept(
                entityManager.find(QuestionTemplate.class, template.getId())));
    }

    QuestionTemplate persisted(QuestionTemplate template) {
        transactions.executeWithoutResult(status -> entityManager.persist(template));
        return template;
    }

    Long templateOf(StudentQuestionResponse question) {
        return transactions.execute(status -> questionRepository.findById(question.getQuestionId()).orElseThrow()
                .getQuestionTemplate().getId());
    }

    List<QuestionTemplate> activeTemplates(Difficulty difficulty) {
        return transactions.execute(status -> templates.findBySubjectAndDifficultyAndActiveTrueOrderByIdAsc(
                raceSubject(), difficulty));
    }

    Subject raceSubject() {
        return transactions.execute(status -> questionRepository.findById(questionId).orElseThrow()
                .getQuestionTemplate().getSubject());
    }

    QuestionTemplate copyOf(QuestionTemplate source, QuestionType type) {
        var copy = new QuestionTemplate();
        copy.setSubject(source.getSubject());
        copy.setType(type);
        copy.setDifficulty(source.getDifficulty());
        copy.setGenerationPattern(source.getGenerationPattern());
        copy.setMinValue(source.getMinValue());
        copy.setMaxValue(source.getMaxValue());
        copy.setTimeLimitSeconds(source.getTimeLimitSeconds());
        copy.setChoicesCount(source.getChoicesCount());
        return copy;
    }
}
