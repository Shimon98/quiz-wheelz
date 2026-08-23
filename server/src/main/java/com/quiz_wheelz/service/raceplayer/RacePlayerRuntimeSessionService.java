package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerReconnectResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class RacePlayerRuntimeSessionService {

    private final RacePlayerHeartbeatService heartbeatService;
    private final RacePlayerReconnectService reconnectService;
    private final RacePlayerLeaveService leaveService;

    public RacePlayerRuntimeSessionService(
            RacePlayerHeartbeatService heartbeatService,
            RacePlayerReconnectService reconnectService,
            RacePlayerLeaveService leaveService
    ) {
        this.heartbeatService = Objects.requireNonNull(heartbeatService);
        this.reconnectService = Objects.requireNonNull(reconnectService);
        this.leaveService = Objects.requireNonNull(leaveService);
    }

    public RacePlayerHeartbeatResponse heartbeat(HttpServletRequest request) {
        return heartbeatService.heartbeat(request);
    }

    public RacePlayerReconnectResponse reconnect(HttpServletRequest request) {
        return reconnectService.reconnect(request);
    }

    public RacePlayerLeaveResponse leave(HttpServletRequest request) {
        return leaveService.leave(request);
    }
}
