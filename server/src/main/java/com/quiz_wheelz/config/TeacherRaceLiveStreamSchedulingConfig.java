package com.quiz_wheelz.config;

import com.quiz_wheelz.common.TeacherRaceLiveStreamRules;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration(proxyBeanMethods = false)
public class TeacherRaceLiveStreamSchedulingConfig {

    @Bean(
            name = TeacherRaceLiveStreamRules.SCHEDULER_BEAN_NAME,
            defaultCandidate = false
    )
    public ThreadPoolTaskScheduler teacherRaceLiveStreamTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(TeacherRaceLiveStreamRules.SCHEDULER_POOL_SIZE);
        scheduler.setThreadNamePrefix(
                TeacherRaceLiveStreamRules.SCHEDULER_THREAD_NAME_PREFIX
        );
        return scheduler;
    }
}
