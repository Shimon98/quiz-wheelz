package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.UserRole;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;
import com.quiz_wheelz.service.raceplayer.RedisPresenceService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentRaceLiveStreamSecurityTest {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired TokenConfig tokenConfig;
    @Autowired UserRepository users;
    @Autowired SubjectRepository subjects;
    @Autowired RaceRepository races;
    @Autowired RacePlayerRepository players;
    @Autowired RaceLiveStreamRegistry registry;
    @MockitoBean RedisPresenceService presence;
    User teacher;
    Race race;
    RacePlayer player;

    @BeforeEach
    void prepareSession() {
        int sequence = SEQUENCE.incrementAndGet();
        teacher = new User();
        teacher.setUsername("stream-teacher-" + sequence);
        teacher.setPasswordHash("hash");
        teacher.setDisplayName("Teacher");
        teacher.setRole(UserRole.TEACHER);
        teacher.setActive(true);
        users.save(teacher);
        var subject = new Subject();
        subject.setName("Stream Math " + sequence);
        subject.setCode("STREAM_MATH_" + sequence);
        subjects.save(subject);
        race = new Race();
        race.setRoomCode(String.format("S%05d", sequence));
        race.setTitle("Stream race");
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setTeacher(teacher);
        race.setSubject(subject);
        races.save(race);
        player = new RacePlayer();
        player.setRace(race);
        player.setDisplayName("Student");
        player.setLaneNumber(1);
        players.save(player);
    }

    @Test
    void missingAndInvalidPlayerCookiesAreRejected() throws Exception {
        mvc.perform(stream("0")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(ErrorCode.RACE_PLAYER_TOKEN_MISSING.name()));
        mvc.perform(stream("0").cookie(cookie("invalid"))).andExpect(status().isUnauthorized());
    }

    @Test
    void teacherJwtCannotReplaceTheStudentCookie() throws Exception {
        String token = jwt.createToken(teacher.getId(), teacher.getUsername(), UserRole.TEACHER.name());
        mvc.perform(stream("0").cookie(new Cookie(tokenConfig.getAuthCookieName(), token)))
                .andExpect(status().isUnauthorized());
        mvc.perform(stream("0").cookie(cookie(token))).andExpect(status().isUnauthorized());
    }

    @Test
    void nonexistentMembershipIsRejected() throws Exception {
        String token = jwt.createRacePlayerToken(race.getId(), Long.MAX_VALUE, "Missing");
        mvc.perform(stream("0").cookie(cookie(token)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value(ErrorCode.RACE_PLAYER_NOT_FOUND.name()));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "garbage", "-1", "1"})
    void invalidSelectedCursorsAreRejected(String cursor) throws Exception {
        mvc.perform(stream(cursor).cookie(validCookie()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(ErrorCode.RACE_LIVE_EVENT_CURSOR_INVALID.name()));
    }

    @Test
    void validSessionUsesHeaderPrecedenceWithoutGameplayMutation() throws Exception {
        int before = registry.activeConnections(RaceLiveStreamAudience.STUDENT).size();
        mvc.perform(stream("garbage").header("Last-Event-ID", "0").cookie(validCookie()))
                .andExpect(status().isOk()).andExpect(request().asyncStarted());

        var connection = registry.activeConnections(RaceLiveStreamAudience.STUDENT).stream()
                .filter(value -> value.raceId().equals(race.getId())).findFirst().orElseThrow();
        assertEquals(before + 1, registry.activeConnections(RaceLiveStreamAudience.STUDENT).size());
        assertEquals(0L, connection.lastDeliveredVersion());
        assertEquals(0L, races.findById(race.getId()).orElseThrow().getLiveEventVersion());
        verifyNoInteractions(presence);
        registry.remove(connection.connectionId());
        connection.emitter().complete();
    }

    private MockHttpServletRequestBuilder stream(String cursor) {
        var request = get(ApiPaths.RACE_PLAYERS_EVENTS_STREAM).accept(MediaType.TEXT_EVENT_STREAM);
        return cursor == null ? request : request.param("afterVersion", cursor);
    }

    private Cookie validCookie() {
        return cookie(jwt.createRacePlayerToken(race.getId(), player.getId(), player.getDisplayName()));
    }

    private Cookie cookie(String value) {
        return new Cookie(tokenConfig.getRacePlayerCookieName(), value);
    }
}
