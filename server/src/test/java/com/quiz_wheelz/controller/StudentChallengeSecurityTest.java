package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ChallengeApiPaths;
import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.*;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.raceplayer.RedisPresenceService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentChallengeSecurityTest {
    private static final AtomicInteger SEQUENCE = new AtomicInteger();
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired TokenConfig tokens;
    @Autowired UserRepository users;
    @Autowired SubjectRepository subjects;
    @Autowired RaceRepository races;
    @Autowired RacePlayerRepository players;
    @Autowired RacePlayerChallengeOfferRepository offers;
    @MockitoBean RedisPresenceService presence;
    private User teacher;
    private RacePlayer player;
    private RacePlayerChallengeOffer offer;

    @BeforeEach
    void prepare() {
        int sequence = SEQUENCE.incrementAndGet();
        teacher = new User();
        teacher.setUsername("challenge-security-" + sequence);
        teacher.setDisplayName("Teacher");
        teacher.setPasswordHash("hash");
        teacher.setRole(UserRole.TEACHER);
        teacher = users.save(teacher);
        var subject = new Subject();
        subject.setCode("CHSEC_" + sequence);
        subject.setName("Challenge Security Math " + sequence);
        subject = subjects.save(subject);
        var race = new Race();
        race.setTeacher(teacher);
        race.setSubject(subject);
        race.setRoomCode(String.format("Q%05d", sequence));
        race.setTitle("Challenge security");
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setStartedAt(LocalDateTime.now(ZoneOffset.UTC));
        race = races.save(race);
        player = new RacePlayer();
        player.setRace(race);
        player.setDisplayName("Student");
        player.setLaneNumber(1);
        player.setStatus(RacePlayerStatus.RACING);
        player.setSpeed(1.0);
        player.setPosition(100.0);
        player.setStartedAt(race.getStartedAt());
        player.setMovementUpdatedAtEpochMs(Instant.now().toEpochMilli());
        player.setLastSeenAt(LocalDateTime.now(ZoneOffset.UTC));
        player = players.save(player);
        offer = new RacePlayerChallengeOffer();
        offer.setRacePlayer(player);
        offer.setOfferedAtEpochMs(Instant.now().toEpochMilli());
        offer.setExpiresAtEpochMs(offer.getOfferedAtEpochMs() + 12_000);
        offer = offers.save(offer);
        when(presence.isOnline(anyLong(), anyLong())).thenReturn(true);
        when(presence.findLastGameplayActivityAt(anyLong(), anyLong()))
                .thenReturn(Optional.of(Instant.now()));
    }

    @ParameterizedTest
    @EnumSource(ChallengeChoice.class)
    void realCookieSelectsAndReturnsSharedSnapshot(ChallengeChoice choice) throws Exception {
        mvc.perform(choice(choice.name()).cookie(cookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.offerId").value(offer.getId()))
                .andExpect(jsonPath("$.data.choice").value(choice.name()))
                .andExpect(jsonPath("$.data.selectedAtEpochMs").isNumber())
                .andExpect(jsonPath("$.data.snapshot.gameplay.mode").value(choice.name()))
                .andExpect(jsonPath("$.data.snapshot.gameplay.challenge.threshold").value(100))
                .andExpect(jsonPath("$.data.snapshot.gameplay.challenge.offer").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.data.snapshot.movementUnitsPerSecond").isNumber());
    }

    @Test
    void missingAndInvalidCookieAreUnauthorized() throws Exception {
        mvc.perform(choice("SAFE_RUN")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.RACE_PLAYER_TOKEN_MISSING.getCode()));
        mvc.perform(choice("SAFE_RUN").cookie(new Cookie(tokens.getRacePlayerCookieName(), "invalid")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_RACE_PLAYER_TOKEN.getCode()));
    }

    @Test
    void teacherCookieCannotReplaceStudentSession() throws Exception {
        var token = jwt.createToken(teacher.getId(), teacher.getUsername(), "TEACHER");
        mvc.perform(choice("SAFE_RUN").cookie(new Cookie(tokens.getAuthCookieName(), token)))
                .andExpect(status().isUnauthorized());
        mvc.perform(choice("SAFE_RUN").cookie(new Cookie(tokens.getRacePlayerCookieName(), token)))
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"NORMAL", "CHALLENGE_CHOICE", "BOOST", "", "safe_run"})
    void invalidChoiceStringHasExactApplicationCode(String choice) throws Exception {
        mvc.perform(choice(choice).cookie(cookie())).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3037));
    }

    @Test
    void nonpositiveOfferIdIsValidated() throws Exception {
        mvc.perform(post(ChallengeApiPaths.CHOICE).cookie(cookie()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"offerId\":0,\"choice\":\"SAFE_RUN\"}"))
                .andExpect(status().isBadRequest());
    }

    private MockHttpServletRequestBuilder choice(String choice) {
        return post(ChallengeApiPaths.CHOICE).contentType(MediaType.APPLICATION_JSON)
                .content("{\"offerId\":" + offer.getId() + ",\"choice\":\"" + choice + "\"}");
    }

    private Cookie cookie() {
        return new Cookie(tokens.getRacePlayerCookieName(), jwt.createRacePlayerToken(
                player.getRace().getId(), player.getId(), player.getDisplayName()));
    }
}
