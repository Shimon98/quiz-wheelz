package com.quiz_wheelz.service.race;

import com.quiz_wheelz.dto.race.CreateRaceRequest;
import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import com.quiz_wheelz.service.subject.SubjectService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RaceService {

    private final RaceRepository raceRepository;
    private final RoomCodeService roomCodeService;
    private final CurrentUserService currentUserService;
    private final UserService userService;
    private final SubjectService subjectService;

    public RaceService(
            RaceRepository raceRepository,
            RoomCodeService roomCodeService,
            CurrentUserService currentUserService,
            UserService userService,
            SubjectService subjectService
    ) {
        this.raceRepository = raceRepository;
        this.roomCodeService = roomCodeService;
        this.currentUserService = currentUserService;
        this.userService = userService;
        this.subjectService = subjectService;
    }

    @Transactional
    public RaceSummaryResponse createRace(CreateRaceRequest request) {
        Long teacherId = currentUserService.getCurrentUserId();

        User teacher = userService.findActiveByIdOrThrow(teacherId);
        Subject subject = subjectService.findActiveByIdOrThrow(request.getSubjectId());

        Race race = new Race();
        race.setTeacher(teacher);
        race.setSubject(subject);
        race.setTitle(request.getTitle());
        race.setRoomCode(roomCodeService.generateUniqueRoomCode());
        race.setStatus(RaceStatus.WAITING_FOR_PLAYERS);
        race.setMaxPlayers(request.getMaxPlayers());
        race.setTotalDistance(request.getTotalDistance());

        Race savedRace = raceRepository.save(race);

        return RaceSummaryResponse.from(savedRace);
    }
}
