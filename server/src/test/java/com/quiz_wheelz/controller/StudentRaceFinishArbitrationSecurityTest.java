package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.enums.UserRole;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.repository.SubjectRepository;
import com.quiz_wheelz.repository.UserRepository;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.raceplayer.RedisPresenceService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentRaceFinishArbitrationSecurityTest {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TokenConfig tokenConfig;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RacePlayerRepository racePlayerRepository;

    @MockitoBean
    private RedisPresenceService redisPresenceService;

    private User teacher;
    private Race waitingRace;
    private Race activeRace;
    private RacePlayer waitingPlayer;
    private RacePlayer activePlayer;

    @BeforeEach
    void setUp() {
        int sequence = SEQUENCE.incrementAndGet();
        teacher = persistTeacher(sequence);
        Subject subject = persistSubject(sequence);
        waitingRace = persistRace(sequence, subject, "W", RaceStatus.WAITING_FOR_PLAYERS);
        activeRace = persistRace(sequence, subject, "P", RaceStatus.IN_PROGRESS);
        waitingPlayer = persistPlayer(waitingRace, "Waiting Kid", 1, RacePlayerStatus.WAITING);
        activePlayer = persistPlayer(activeRace, "Racing Kid", 1, RacePlayerStatus.RACING);
        persistPlayer(activeRace, "Rival Kid", 2, RacePlayerStatus.RACING);
        when(redisPresenceService.isOnline(anyLong(), anyLong())).thenReturn(true);
        when(redisPresenceService.findLastGameplayActivityAt(anyLong(), anyLong()))
                .thenReturn(Optional.of(Instant.now().minusSeconds(1)));
    }

    @Test
    void missingCookieIsRejectedAsTokenMissing() throws Exception {
        mockMvc.perform(get(ApiPaths.RACE_PLAYERS_CURRENT_RACE_STATE))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.RACE_PLAYER_TOKEN_MISSING.getCode()));
        mockMvc.perform(arbitration())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.RACE_PLAYER_TOKEN_MISSING.getCode()));
    }

    @Test
    void invalidTokenIsRejected() throws Exception {
        mockMvc.perform(arbitration().cookie(racePlayerCookie("not-a-jwt")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_RACE_PLAYER_TOKEN.getCode()));
    }

    @Test
    void teacherAuthenticationDoesNotSubstituteForARacePlayerSession() throws Exception {
        String teacherToken = jwtService.createToken(teacher.getId(), teacher.getUsername(), UserRole.TEACHER.name());

        mockMvc.perform(arbitration().cookie(new Cookie(tokenConfig.getAuthCookieName(), teacherToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.RACE_PLAYER_TOKEN_MISSING.getCode()));
        mockMvc.perform(arbitration().cookie(racePlayerCookie(teacherToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_RACE_PLAYER_TOKEN.getCode()));
    }

    @Test
    void wrongMembershipIsRejectedWithoutTargetIdentifiersFromTheClient() throws Exception {
        String foreignToken = jwtService.createRacePlayerToken(
                waitingRace.getId(),
                activePlayer.getId(),
                activePlayer.getDisplayName()
        );

        mockMvc.perform(arbitration().cookie(racePlayerCookie(foreignToken)).param("raceId", activeRace.getId().toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.RACE_PLAYER_NOT_FOUND.getCode()));
    }

    @Test
    void waitingRaceSessionReachesTheServiceAndIsRejectedByLifecycle() throws Exception {
        String token = jwtService.createRacePlayerToken(
                waitingRace.getId(),
                waitingPlayer.getId(),
                waitingPlayer.getDisplayName()
        );

        mockMvc.perform(arbitration().cookie(racePlayerCookie(token)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.RACE_NOT_IN_PROGRESS.getCode()));
    }

    @Test
    void validRacePlayerSessionReceivesTheArbitrationContract() throws Exception {
        String token = jwtService.createRacePlayerToken(
                activeRace.getId(),
                activePlayer.getId(),
                activePlayer.getDisplayName()
        );

        mockMvc.perform(arbitration().cookie(racePlayerCookie(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.raceId").value(activeRace.getId()))
                .andExpect(jsonPath("$.data.snapshot.playerCount").value(2))
                .andExpect(jsonPath("$.data.snapshot.opponents.length()").value(1))
                .andExpect(jsonPath("$.data.snapshot.eventVersion").isNumber())
                .andExpect(jsonPath("$.data.finishOrder.decidedAtEpochMs").isNumber())
                .andExpect(jsonPath("$.data.finishOrder.confirmedFinishers").isArray());
    }

    private MockHttpServletRequestBuilder arbitration() {
        return post(ApiPaths.RACE_PLAYERS_FINISH_ARBITRATION);
    }

    private Cookie racePlayerCookie(String token) {
        return new Cookie(tokenConfig.getRacePlayerCookieName(), token);
    }

    private User persistTeacher(int sequence) {
        User user = new User();
        user.setUsername("arbitration-security-teacher-" + sequence);
        user.setPasswordHash("hash");
        user.setDisplayName("Teacher");
        user.setRole(UserRole.TEACHER);
        user.setActive(true);
        return userRepository.save(user);
    }

    private Subject persistSubject(int sequence) {
        Subject subject = new Subject();
        subject.setName("Security Math " + sequence);
        subject.setCode("SECURITY_MATH_" + sequence);
        subject.setActive(true);
        return subjectRepository.save(subject);
    }

    private Race persistRace(int sequence, Subject subject, String prefix, RaceStatus status) {
        Race race = new Race();
        race.setRoomCode(String.format("%s%05d", prefix, sequence));
        race.setTitle("Security race");
        race.setMaxPlayers(2);
        race.setTotalDistance(1000);
        race.setTeacher(teacher);
        race.setSubject(subject);
        race.setStatus(status);
        if (status == RaceStatus.IN_PROGRESS) {
            race.setStartedAt(LocalDateTime.now(ZoneOffset.UTC).minusSeconds(30));
        }
        return raceRepository.save(race);
    }

    private RacePlayer persistPlayer(Race race, String name, int lane, RacePlayerStatus status) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setDisplayName(name);
        racePlayer.setLaneNumber(lane);
        racePlayer.setStatus(status);
        if (status == RacePlayerStatus.RACING) {
            racePlayer.setSpeed(0.5);
            racePlayer.setStartedAt(race.getStartedAt());
            racePlayer.setMovementUpdatedAtEpochMs(Instant.now().minusSeconds(5).toEpochMilli());
        }
        return racePlayerRepository.save(racePlayer);
    }
}
