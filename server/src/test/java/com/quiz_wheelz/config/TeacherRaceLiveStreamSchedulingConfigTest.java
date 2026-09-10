package com.quiz_wheelz.config;

import com.quiz_wheelz.common.TeacherRaceLiveStreamRules;
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

class TeacherRaceLiveStreamSchedulingConfigTest {

    @Test
    void dispatcherUsesDedicatedTeacherLiveScheduler() throws Exception {
        Method dispatch = TeacherRaceLiveStreamDispatcher.class.getMethod(
                "dispatchActiveConnections"
        );
        Scheduled scheduled = dispatch.getAnnotation(Scheduled.class);

        assertEquals(
                TeacherRaceLiveStreamRules.SCHEDULER_BEAN_NAME,
                scheduled.scheduler()
        );
        assertEquals(
                TeacherRaceLiveStreamRules.DISPATCH_INTERVAL_MS,
                scheduled.fixedDelay()
        );
    }

    @Test
    void schedulerBeanIsFocusedSingleThreadAndNotADefaultCandidate() throws Exception {
        Method factory = TeacherRaceLiveStreamSchedulingConfig.class.getMethod(
                "teacherRaceLiveStreamTaskScheduler"
        );
        Bean bean = factory.getAnnotation(Bean.class);
        ThreadPoolTaskScheduler scheduler =
                new TeacherRaceLiveStreamSchedulingConfig()
                        .teacherRaceLiveStreamTaskScheduler();

        assertArrayEquals(
                new String[]{TeacherRaceLiveStreamRules.SCHEDULER_BEAN_NAME},
                bean.name()
        );
        assertFalse(bean.defaultCandidate());
        assertEquals(
                TeacherRaceLiveStreamRules.SCHEDULER_THREAD_NAME_PREFIX,
                scheduler.getThreadNamePrefix()
        );
        scheduler.initialize();
        try {
            assertEquals(
                    TeacherRaceLiveStreamRules.SCHEDULER_POOL_SIZE,
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
