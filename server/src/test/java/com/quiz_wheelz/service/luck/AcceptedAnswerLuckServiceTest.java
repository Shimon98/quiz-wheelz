package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.repository.PlayerQuestionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import static org.mockito.Mockito.*;

class AcceptedAnswerLuckServiceTest {
    @Test
    void offDoesNotFlushResolveLuckOrRequestRandomness() {
        @SuppressWarnings("unchecked")
        ObjectProvider<FairLuckService> luck = mock(ObjectProvider.class);
        PlayerQuestionRepository questions = mock(PlayerQuestionRepository.class);
        var integration = new AcceptedAnswerLuckService(false, luck, questions);
        integration.afterAcceptedNormalAnswer(null, null, true, 100);
        verifyNoInteractions(luck, questions);
    }
}
