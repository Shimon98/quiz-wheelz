package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinRequest;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinResult;
import com.quiz_wheelz.service.RacePlayerJoinService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.RACE_PLAYERS)
public class RacePlayerController {

    private final RacePlayerJoinService racePlayerJoinService;
    private final CookieUtils cookieUtils;

    public RacePlayerController(
            RacePlayerJoinService racePlayerJoinService,
            CookieUtils cookieUtils
    ) {
        this.racePlayerJoinService = racePlayerJoinService;
        this.cookieUtils = cookieUtils;
    }

    @PostMapping(ApiPaths.JOIN)
    public ResponseEntity<ApiResponse<RacePlayerJoinResponse>> joinRace(
            @Valid @RequestBody RacePlayerJoinRequest request,
            HttpServletResponse response
    ) {
        RacePlayerJoinResult result = racePlayerJoinService.joinRace(request);
        cookieUtils.addRacePlayerCookie(response, result.getRacePlayerToken());

        return ResponseEntity.ok(
                ApiResponse.ok(
                        ApiMessages.RACE_PLAYER_JOINED_SUCCESSFULLY,
                        result.getResponse()
                )
        );
    }
}
