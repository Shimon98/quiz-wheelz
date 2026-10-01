package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.RaceLiveStreamRules;
import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.enums.UserRole;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.repository.SubjectRepository;
import com.quiz_wheelz.repository.UserRepository;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;
import com.quiz_wheelz.service.livestream.RaceLiveStreamConnection;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;
import com.quiz_wheelz.service.raceplayer.RedisPresenceService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TeacherRaceLiveStreamSecurityTest {

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
    User owner;
    Race race;
    RacePlayer player;

    @BeforeEach
    void prepareRace() {
        int sequence = SEQUENCE.incrementAndGet();
        owner = teacher("live-owner-" + sequence);
        var subject = new Subject();
        subject.setName("Live Stream Math " + sequence);
        subject.setCode("LIVE_STREAM_MATH_" + sequence);
        subjects.save(subject);
        race = new Race();
        race.setRoomCode(String.format("T%05d", sequence));
        race.setTitle("Teacher stream race");
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setTeacher(owner);
        race.setSubject(subject);
        races.save(race);
        player = new RacePlayer();
        player.setRace(race);
        player.setDisplayName("Student");
        player.setLaneNumber(1);
        players.save(player);
    }

    @Test
    void unauthenticatedCallerIsRejectedBeforeAStreamOpens() throws Exception {
        int before = teacherStreams();

        mvc.perform(stream())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(ErrorCode.UNAUTHORIZED.name()));

        assertEquals(before, teacherStreams());
    }

    @Test
    void racePlayerTokenCannotOpenTheTeacherStream() throws Exception {
        String playerToken = jwt.createRacePlayerToken(race.getId(), player.getId(), player.getDisplayName());
        int before = teacherStreams();

        mvc.perform(stream().cookie(new Cookie(tokenConfig.getRacePlayerCookieName(), playerToken)))
                .andExpect(status().isUnauthorized());
        mvc.perform(stream().cookie(new Cookie(tokenConfig.getAuthCookieName(), playerToken)))
                .andExpect(status().isUnauthorized());

        assertEquals(before, teacherStreams());
    }

    @Test
    void anotherTeacherCannotOpenTheStream() throws Exception {
        User stranger = teacher("live-stranger-" + SEQUENCE.incrementAndGet());
        int before = teacherStreams();

        mvc.perform(stream().cookie(authCookie(stranger)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value(ErrorCode.RACE_NOT_FOUND.name()));

        assertEquals(before, teacherStreams());
    }

    @ParameterizedTest
    @EnumSource(value = RaceStatus.class, names = {"WAITING_FOR_PLAYERS", "IN_PROGRESS", "FINISHED"})
    void endedStreamStaysAuthenticatedOnTheAsyncDispatch(RaceStatus status) throws Exception {
        race.setStatus(status);
        races.save(race);
        MvcResult opened = mvc.perform(stream().cookie(authCookie(owner)))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andReturn();
        RaceLiveStreamConnection connection = registry.activeConnections(RaceLiveStreamAudience.TEACHER).stream()
                .filter(value -> value.raceId().equals(race.getId()))
                .findFirst()
                .orElseThrow();

        // The heartbeat commits the response like a live stream does, so a denied ASYNC dispatch would
        // surface as "response is already committed" instead of a clean 401.
        connection.emitter().send(SseEmitter.event().comment(RaceLiveStreamRules.HEARTBEAT_COMMENT));
        connection.emitter().complete();

        mvc.perform(asyncDispatch(opened)).andExpect(status().isOk());
    }

    private User teacher(String username) {
        User teacher = new User();
        teacher.setUsername(username);
        teacher.setPasswordHash("hash");
        teacher.setDisplayName("Teacher");
        teacher.setRole(UserRole.TEACHER);
        teacher.setActive(true);
        return users.save(teacher);
    }

    private int teacherStreams() {
        return registry.activeConnections(RaceLiveStreamAudience.TEACHER).size();
    }

    private MockHttpServletRequestBuilder stream() {
        return get(ApiPaths.TEACHER_RACES + ApiPaths.TEACHER_RACE_EVENTS_STREAM, race.getId())
                .param(RaceLiveStreamRules.AFTER_VERSION_PARAMETER, "0")
                .accept(MediaType.TEXT_EVENT_STREAM);
    }

    private Cookie authCookie(User teacher) {
        return new Cookie(
                tokenConfig.getAuthCookieName(),
                jwt.createToken(teacher.getId(), teacher.getUsername(), UserRole.TEACHER.name())
        );
    }
}
