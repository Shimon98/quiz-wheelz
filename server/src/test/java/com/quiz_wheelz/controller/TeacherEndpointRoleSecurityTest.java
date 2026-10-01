package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.RaceLiveStreamRules;
import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.UserRole;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.UserRepository;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;
import com.quiz_wheelz.service.raceplayer.RedisPresenceService;
import jakarta.servlet.http.Cookie;
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

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TeacherEndpointRoleSecurityTest {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired TokenConfig tokenConfig;
    @Autowired UserRepository users;
    @Autowired RaceLiveStreamRegistry registry;
    @MockitoBean RedisPresenceService presence;

    @ParameterizedTest
    @EnumSource(value = UserRole.class, names = {"STUDENT", "ADMIN"})
    void authenticatedUserWithoutTheTeacherRoleIsForbidden(UserRole role) throws Exception {
        mvc.perform(get(ApiPaths.TEACHER_DASHBOARD).cookie(authCookie(user(role))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.FORBIDDEN.getCode()))
                .andExpect(jsonPath("$.error").value(ErrorCode.FORBIDDEN.name()));
    }

    @Test
    void userWithoutTheTeacherRoleCannotOpenTheTeacherLiveStream() throws Exception {
        int before = registry.activeConnections(RaceLiveStreamAudience.TEACHER).size();

        mvc.perform(get(ApiPaths.TEACHER_RACES + ApiPaths.TEACHER_RACE_EVENTS_STREAM, Long.MAX_VALUE)
                        .param(RaceLiveStreamRules.AFTER_VERSION_PARAMETER, "0")
                        .accept(MediaType.TEXT_EVENT_STREAM)
                        .cookie(authCookie(user(UserRole.STUDENT))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value(ErrorCode.FORBIDDEN.name()));

        assertEquals(before, registry.activeConnections(RaceLiveStreamAudience.TEACHER).size());
    }

    @Test
    void unauthenticatedCallerStaysUnauthorized() throws Exception {
        mvc.perform(get(ApiPaths.TEACHER_DASHBOARD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(ErrorCode.UNAUTHORIZED.name()));
    }

    @Test
    void teacherStillReachesTheEndpoint() throws Exception {
        mvc.perform(get(ApiPaths.TEACHER_DASHBOARD).cookie(authCookie(user(UserRole.TEACHER))))
                .andExpect(status().isOk());
    }

    @Test
    void apiExceptionMappingIsUnchanged() throws Exception {
        mvc.perform(get(ApiPaths.TEACHER_RACES + ApiPaths.TEACHER_RACE_LIVE_STATE, Long.MAX_VALUE)
                        .cookie(authCookie(user(UserRole.TEACHER))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value(ErrorCode.RACE_NOT_FOUND.name()));
    }

    private User user(UserRole role) {
        User user = new User();
        user.setUsername("role-" + role.name().toLowerCase() + "-" + SEQUENCE.incrementAndGet());
        user.setPasswordHash("hash");
        user.setDisplayName("Role " + role.name());
        user.setRole(role);
        user.setActive(true);
        return users.save(user);
    }

    private Cookie authCookie(User user) {
        return new Cookie(
                tokenConfig.getAuthCookieName(),
                jwt.createToken(user.getId(), user.getUsername(), user.getRole().name())
        );
    }
}
