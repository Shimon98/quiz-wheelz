package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.livestream.RaceLiveStreamAudience;
import com.quiz_wheelz.service.livestream.RaceLiveStreamConnection;
import com.quiz_wheelz.service.livestream.RaceLiveStreamCursorResolver;
import com.quiz_wheelz.service.livestream.RaceLiveStreamRegistry;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Objects;

@Service
public class StudentRaceLiveStreamService {

    private final RacePlayerSessionLockService sessionIdentityOwner;
    private final RacePlayerRepository playerRepository;
    private final RaceRepository raceRepository;
    private final RaceLiveStreamCursorResolver cursorResolver;
    private final RaceLiveStreamRegistry registry;
    private final StudentRaceLiveStreamDispatcher dispatcher;

    public StudentRaceLiveStreamService(
            RacePlayerSessionLockService sessionIdentityOwner,
            RacePlayerRepository playerRepository,
            RaceRepository raceRepository,
            RaceLiveStreamCursorResolver cursorResolver,
            RaceLiveStreamRegistry registry,
            StudentRaceLiveStreamDispatcher dispatcher
    ) {
        this.sessionIdentityOwner = Objects.requireNonNull(sessionIdentityOwner);
        this.playerRepository = Objects.requireNonNull(playerRepository);
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.cursorResolver = Objects.requireNonNull(cursorResolver);
        this.registry = Objects.requireNonNull(registry);
        this.dispatcher = Objects.requireNonNull(dispatcher);
    }

    public SseEmitter connect(HttpServletRequest request, String afterVersion, String lastEventId) {
        RacePlayerSessionIdentity identity = sessionIdentityOwner.resolveIdentity(request);
        if (!playerRepository.existsByIdAndRaceId(identity.racePlayerId(), identity.raceId())) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }
        Long currentVersion = raceRepository.findLiveEventVersion(identity.raceId());
        if (currentVersion == null) {
            throw new ApiException(ErrorCode.RACE_NOT_FOUND);
        }
        long cursor = cursorResolver.resolve(lastEventId, afterVersion, currentVersion);
        RaceLiveStreamConnection connection = registry.register(
                RaceLiveStreamAudience.STUDENT, identity.raceId(), cursor
        );
        dispatcher.dispatchConnection(connection);
        return connection.emitter();
    }
}
