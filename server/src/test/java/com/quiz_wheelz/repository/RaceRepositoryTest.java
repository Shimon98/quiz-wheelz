package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import jakarta.persistence.PersistenceUnitUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
class RaceRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RaceRepository raceRepository;

    @Test
    void teacherDashboardRaceListLoadsSubject() {
        User teacher = new User();
        teacher.setUsername("teacher-dashboard");
        teacher.setDisplayName("Teacher");
        entityManager.persist(teacher);

        Subject subject = new Subject();
        subject.setName("Math");
        subject.setCode("MATH");
        entityManager.persist(subject);

        Race race = new Race();
        race.setRoomCode("DASH01");
        race.setTitle("Dashboard Race");
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setTeacher(teacher);
        race.setSubject(subject);
        entityManager.persistAndFlush(race);
        entityManager.clear();

        List<Race> races = raceRepository.findByTeacherOrderByCreatedAtDesc(teacher);
        PersistenceUnitUtil persistenceUnitUtil = entityManager
                .getEntityManager()
                .getEntityManagerFactory()
                .getPersistenceUnitUtil();

        assertEquals(1, races.size());
        assertTrue(persistenceUnitUtil.isLoaded(races.get(0), "subject"));
        assertEquals(subject.getId(), races.get(0).getSubject().getId());
        assertEquals("Math", races.get(0).getSubject().getName());
        assertEquals("MATH", races.get(0).getSubject().getCode());
    }
}
