package com.quiz_wheelz.service.raceplayer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.mockito.Mockito.*;

abstract class B2LuckIntegrationFixture extends B1LuckIntegrationFixture {
    void prepare(String scenario) {
        switch (scenario) {
            case "SHIELD" -> transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow().setCorrectAnswers(2));
            case "BLOCKED" -> {
                prepare("SHIELD");
                submit(true);
                nextQuestion(T);
                when(random.nextDouble()).thenReturn(0.0, .99);
            }
            case "TAILWIND" -> when(random.nextDouble()).thenReturn(0.0, 0.0);
            case "ORB" -> when(random.nextDouble()).thenReturn(0.0, .5);
            case "MUD" -> when(random.nextDouble()).thenReturn(0.0, .99);
            case "NO_EFFECT" -> {
                energy(100);
                when(random.nextDouble()).thenReturn(0.0, .5);
            }
            case "NONE" -> when(random.nextDouble()).thenReturn(.6);
            default -> throw new IllegalArgumentException(scenario);
        }
    }

    void writeExample(String scenario, StudentRaceRuntimeSnapshotResponse snapshot) throws Exception {
        String database = entityManager.getEntityManagerFactory().unwrap(org.hibernate.engine.spi.SessionFactoryImplementor.class).getJdbcServices().getDialect().getClass().getSimpleName();
        var path = Path.of("target", "b2-example-" + scenario + "-" + (database.contains("MySQL") ? "mysql" : "h2") + ".json");
        Files.writeString(path, new ObjectMapper().findAndRegisterModules().writerWithDefaultPrettyPrinter().writeValueAsString(snapshot));
    }
}
