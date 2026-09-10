package com.quiz_wheelz.config;

import com.quiz_wheelz.common.RaceLiveStreamRules;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration(proxyBeanMethods = false)
public class RaceLiveStreamSchedulingConfig {

    @Bean(
            name = RaceLiveStreamRules.SCHEDULER_BEAN_NAME,
            defaultCandidate = false
    )
    public ThreadPoolTaskScheduler raceLiveStreamTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(RaceLiveStreamRules.SCHEDULER_POOL_SIZE);
        scheduler.setThreadNamePrefix(
                RaceLiveStreamRules.SCHEDULER_THREAD_NAME_PREFIX
        );
        return scheduler;
    }
}
