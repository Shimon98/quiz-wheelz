package com.quiz_wheelz.config;

import com.quiz_wheelz.common.RaceLiveStreamRules;
import com.quiz_wheelz.service.question.PlayerQuestionCleanupService;
import com.quiz_wheelz.service.raceengine.RaceMovementSettlementScheduler;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStreamDispatcher;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class RaceLiveStreamSchedulingConfigTest {

    @Test
    void dispatcherUsesDedicatedTeacherLiveScheduler() throws Exception {
        Method dispatch = TeacherRaceLiveStreamDispatcher.class.getMethod(
                "dispatchActiveConnections"
        );
        Scheduled scheduled = dispatch.getAnnotation(Scheduled.class);

        assertEquals(
                RaceLiveStreamRules.SCHEDULER_BEAN_NAME,
                scheduled.scheduler()
        );
        assertEquals(
                RaceLiveStreamRules.DISPATCH_INTERVAL_MS,
                scheduled.fixedDelay()
        );
    }

    @Test
    void schedulerBeanIsFocusedSingleThreadAndNotADefaultCandidate() throws Exception {
        Method factory = RaceLiveStreamSchedulingConfig.class.getMethod(
                "raceLiveStreamTaskScheduler"
        );
        Bean bean = factory.getAnnotation(Bean.class);
        ThreadPoolTaskScheduler scheduler =
                new RaceLiveStreamSchedulingConfig()
                        .raceLiveStreamTaskScheduler();

        assertArrayEquals(
                new String[]{RaceLiveStreamRules.SCHEDULER_BEAN_NAME},
                bean.name()
        );
        assertFalse(bean.defaultCandidate());
        assertEquals(
                RaceLiveStreamRules.SCHEDULER_THREAD_NAME_PREFIX,
                scheduler.getThreadNamePrefix()
        );
        scheduler.initialize();
        try {
            assertEquals(
                    RaceLiveStreamRules.SCHEDULER_POOL_SIZE,
                    scheduler.getScheduledThreadPoolExecutor().getCorePoolSize()
            );
        } finally {
            scheduler.destroy();
        }
    }

    @Test
    void gameplayAndCleanupScheduledWorkDoNotSelectTheSseScheduler() throws Exception {
        Scheduled movement = RaceMovementSettlementScheduler.class.getMethod(
                "runSettlementSweep"
        ).getAnnotation(Scheduled.class);
        Scheduled cleanup = PlayerQuestionCleanupService.class.getMethod(
                "runScheduledCleanup"
        ).getAnnotation(Scheduled.class);

        assertEquals("", movement.scheduler());
        assertEquals("", cleanup.scheduler());
    }
}
