package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.RaceLiveStreamRules;
import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.UserRole;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.repository.SubjectRepository;
import com.quiz_wheelz.repository.UserRepository;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;
import com.quiz_wheelz.service.livestream.RaceLiveStreamConnection;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.util.UriComponentsBuilder;

import javax.sql.DataSource;
import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@ExtendWith(OutputCaptureExtension.class)
class RaceLiveStreamLifecycleIntegrationTest {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();
    private static final Duration SETTLE_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration POLL_INTERVAL = Duration.ofMillis(50);
    private static final int IDLE_SAMPLES = 10;
    @LocalServerPort int port;
    @Autowired DataSource dataSource;
    @Autowired JwtService jwt;
    @Autowired TokenConfig tokenConfig;
    @Autowired UserRepository users;
    @Autowired SubjectRepository subjects;
    @Autowired RaceRepository races;
    @Autowired RacePlayerRepository players;
    @Autowired RaceLiveStreamRegistry registry;
    User teacher;
    Race race;
    RacePlayer player;
    int idleActiveConnections;

    @BeforeEach
    void prepareRace() throws Exception {
        int sequence = SEQUENCE.incrementAndGet();
        teacher = new User();
        teacher.setUsername("lifecycle-teacher-" + sequence);
        teacher.setPasswordHash("hash");
        teacher.setDisplayName("Teacher");
        teacher.setRole(UserRole.TEACHER);
        teacher.setActive(true);
        users.save(teacher);
        var subject = new Subject();
        subject.setName("Lifecycle Math " + sequence);
        subject.setCode("LIFECYCLE_MATH_" + sequence);
        subjects.save(subject);
        race = new Race();
        race.setRoomCode(String.format("L%05d", sequence));
        race.setTitle("Lifecycle race");
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
        idleActiveConnections = idleActiveConnections();
    }

    @Test
    void openTeacherAndStudentStreamsHoldNoPooledConnection() throws Exception {
        try (Socket teacherClient = open(teacherStreamPath(), teacherCookie());
             Socket studentClient = open(studentStreamPath(), studentCookie())) {
            RaceLiveStreamConnection teacherStream = awaitConnection(RaceLiveStreamAudience.TEACHER);
            RaceLiveStreamConnection studentStream = awaitConnection(RaceLiveStreamAudience.STUDENT);

            awaitActiveConnectionsBackToIdle();

            teacherStream.emitter().complete();
            studentStream.emitter().complete();
        }
    }

    @Test
    void abortedTeacherStreamEndsWithoutSecurityFailureOrHeldConnection(CapturedOutput output) throws Exception {
        Socket client = open(teacherStreamPath(), teacherCookie());
        RaceLiveStreamConnection stream = awaitConnection(RaceLiveStreamAudience.TEACHER);

        abort(client);
        awaitWriteFailure(stream);

        await().atMost(SETTLE_TIMEOUT).until(() -> !registry.contains(stream.connectionId()));
        awaitActiveConnectionsBackToIdle();
        assertThat(output.getAll())
                .doesNotContain("AuthorizationDeniedException")
                .doesNotContain("response is already committed");
    }

    @Test
    void abortedStudentStreamEndsWithoutHeldConnection(CapturedOutput output) throws Exception {
        Socket client = open(studentStreamPath(), studentCookie());
        RaceLiveStreamConnection stream = awaitConnection(RaceLiveStreamAudience.STUDENT);

        abort(client);
        awaitWriteFailure(stream);

        await().atMost(SETTLE_TIMEOUT).until(() -> !registry.contains(stream.connectionId()));
        awaitActiveConnectionsBackToIdle();
        assertThat(output.getAll()).doesNotContain("AuthorizationDeniedException");
    }

    private Socket open(String pathAndQuery, String cookie) throws IOException {
        Socket socket = new Socket(InetAddress.getLoopbackAddress(), port);
        String request = "GET " + pathAndQuery + " HTTP/1.1\r\n"
                + "Host: localhost:" + port + "\r\n"
                + "Accept: " + MediaType.TEXT_EVENT_STREAM_VALUE + "\r\n"
                + "Cookie: " + cookie + "\r\n\r\n";
        socket.getOutputStream().write(request.getBytes(StandardCharsets.US_ASCII));
        socket.getOutputStream().flush();
        return socket;
    }

    // SO_LINGER 0 resets the connection at once, which is how a closed browser tab looks to the server.
    private void abort(Socket socket) throws IOException {
        socket.setSoLinger(true, 0);
        socket.close();
    }

    // The server only notices a gone client when it writes; in production the dispatcher's heartbeat
    // does this write, and the failure starts the same ASYNC dispatch this test observes.
    private void awaitWriteFailure(RaceLiveStreamConnection stream) {
        await().atMost(SETTLE_TIMEOUT).pollInterval(POLL_INTERVAL).until(() -> !heartbeat(stream));
    }

    private boolean heartbeat(RaceLiveStreamConnection stream) {
        try {
            stream.emitter().send(SseEmitter.event().comment(RaceLiveStreamRules.HEARTBEAT_COMMENT));
            return true;
        } catch (IOException | IllegalStateException exception) {
            return false;
        }
    }

    private RaceLiveStreamConnection awaitConnection(RaceLiveStreamAudience audience) {
        return await().atMost(SETTLE_TIMEOUT).until(
                () -> registry.activeConnections(audience).stream()
                        .filter(connection -> connection.raceId().equals(race.getId()))
                        .findFirst()
                        .orElse(null),
                connection -> connection != null
        );
    }

    private void awaitActiveConnectionsBackToIdle() {
        await().atMost(SETTLE_TIMEOUT).pollInterval(POLL_INTERVAL).untilAsserted(
                () -> assertThat(activeConnections()).isLessThanOrEqualTo(idleActiveConnections)
        );
    }

    private int idleActiveConnections() throws Exception {
        int lowest = Integer.MAX_VALUE;
        for (int sample = 0; sample < IDLE_SAMPLES; sample++) {
            lowest = Math.min(lowest, activeConnections());
            Thread.sleep(POLL_INTERVAL.toMillis());
        }
        return lowest;
    }

    private int activeConnections() throws SQLException {
        return dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections();
    }

    private String teacherStreamPath() {
        return UriComponentsBuilder.fromPath(ApiPaths.TEACHER_RACES + ApiPaths.TEACHER_RACE_EVENTS_STREAM)
                .queryParam(RaceLiveStreamRules.AFTER_VERSION_PARAMETER, 0)
                .buildAndExpand(race.getId())
                .toUriString();
    }

    private String studentStreamPath() {
        return UriComponentsBuilder.fromPath(ApiPaths.RACE_PLAYERS_EVENTS_STREAM)
                .queryParam(RaceLiveStreamRules.AFTER_VERSION_PARAMETER, 0)
                .toUriString();
    }

    private String teacherCookie() {
        return tokenConfig.getAuthCookieName() + "="
                + jwt.createToken(teacher.getId(), teacher.getUsername(), UserRole.TEACHER.name());
    }

    private String studentCookie() {
        return tokenConfig.getRacePlayerCookieName() + "="
                + jwt.createRacePlayerToken(race.getId(), player.getId(), player.getDisplayName());
    }
}
