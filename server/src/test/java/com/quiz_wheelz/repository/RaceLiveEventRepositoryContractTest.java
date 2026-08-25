package com.quiz_wheelz.repository;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RaceLiveEventRepositoryContractTest {

    @Test
    void orderedReplayRequiresPageableAndHasNoUnboundedSignature() throws Exception {
        Method boundedMethod = RaceLiveEventRepository.class.getMethod(
                "findAfterVersionOrdered",
                Long.class,
                Long.class,
                Pageable.class
        );

        assertEquals(Slice.class, boundedMethod.getReturnType());
        assertThrows(
                NoSuchMethodException.class,
                () -> RaceLiveEventRepository.class.getMethod(
                        "findAfterVersionOrdered",
                        Long.class,
                        Long.class
                )
        );
    }
}
