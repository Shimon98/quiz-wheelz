package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.exception.GlobalExceptionHandler;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStreamService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TeacherRaceLiveStreamControllerTest {

    @Mock
    private TeacherRaceLiveStreamService streamService;

    @Test
    void endpointDelegatesCursorInputsAndReturnsEmitter() {
        SseEmitter emitter = new SseEmitter();
        when(streamService.connect(12L, "4", "3")).thenReturn(emitter);
        TeacherRaceLiveStreamController controller =
                new TeacherRaceLiveStreamController(streamService);

        SseEmitter result = controller.stream(12L, "4", "3");

        assertSame(emitter, result);
        verify(streamService).connect(12L, "4", "3");
    }

    @Test
    void malformedQueryStillReachesServiceWhenValidHeaderIsPresent() throws Exception {
        SseEmitter emitter = new SseEmitter();
        when(streamService.connect(12L, "garbage", "4")).thenReturn(emitter);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(
                new TeacherRaceLiveStreamController(streamService)
        ).build();

        mockMvc.perform(get(
                        ApiPaths.TEACHER_RACES + "/12/events/stream"
                )
                        .param("afterVersion", "garbage")
                        .header("Last-Event-ID", "4"))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());

        verify(streamService).connect(12L, "garbage", "4");
    }

    @Test
    void invalidCursorRetainsApiErrorContractForEventStreamAccept() throws Exception {
        when(streamService.connect(12L, "garbage", null)).thenThrow(
                new ApiException(ErrorCode.RACE_LIVE_EVENT_CURSOR_INVALID)
        );

        streamErrorMockMvc()
                .perform(get(ApiPaths.TEACHER_RACES + "/12/events/stream")
                        .param("afterVersion", "garbage")
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(3029))
                .andExpect(jsonPath("$.error").value(
                        ErrorCode.RACE_LIVE_EVENT_CURSOR_INVALID.name()
                ));

        verify(streamService).connect(12L, "garbage", null);
    }

    @Test
    void inaccessibleRaceRetainsHiddenApiErrorForEventStreamAccept() throws Exception {
        when(streamService.connect(12L, "0", null)).thenThrow(
                new ApiException(ErrorCode.RACE_NOT_FOUND)
        );

        streamErrorMockMvc()
                .perform(get(ApiPaths.TEACHER_RACES + "/12/events/stream")
                        .param("afterVersion", "0")
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(3004))
                .andExpect(jsonPath("$.error").value(ErrorCode.RACE_NOT_FOUND.name()));

        verify(streamService).connect(12L, "0", null);
    }

    @Test
    void endpointUsesCanonicalPathMediaTypeAndTeacherRole() throws Exception {
        PreAuthorize authorization = TeacherRaceLiveStreamController.class
                .getAnnotation(PreAuthorize.class);
        Method method = TeacherRaceLiveStreamController.class.getMethod(
                "stream",
                Long.class,
                String.class,
                String.class
        );
        GetMapping mapping = method.getAnnotation(GetMapping.class);

        assertEquals(SecurityExpressions.HAS_ROLE_TEACHER, authorization.value());
        assertArrayEquals(
                new String[]{ApiPaths.TEACHER_RACE_EVENTS_STREAM},
                mapping.value()
        );
        assertArrayEquals(
                new String[]{MediaType.TEXT_EVENT_STREAM_VALUE},
                mapping.produces()
        );
    }

    private MockMvc streamErrorMockMvc() {
        return MockMvcBuilders.standaloneSetup(
                        new TeacherRaceLiveStreamController(streamService)
                )
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }
}
