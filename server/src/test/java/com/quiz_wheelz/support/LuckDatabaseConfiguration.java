package com.quiz_wheelz.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.test.context.DynamicPropertyRegistrar;

@TestConfiguration(proxyBeanMethods = false)
public class LuckDatabaseConfiguration {
    @Bean
    DynamicPropertyRegistrar isolatedLuckDatabase(Environment environment) {
        String configured = environment.getRequiredProperty("spring.datasource.url");
        String isolated = "jdbc:h2:mem:luck-" + java.util.UUID.randomUUID()
                + ";MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=false";
        return properties -> {
            if (configured.startsWith("jdbc:h2:mem:")) {
                properties.add("spring.datasource.url", () -> isolated);
                properties.add("spring.datasource.username", () -> "sa");
                properties.add("spring.datasource.password", () -> "");
                properties.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
            }
        };
    }
}
