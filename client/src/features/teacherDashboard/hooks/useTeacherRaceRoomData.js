import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTeacherRaceRoom } from "../../../api/teacherApi";

const INITIAL_RACE_ROOM_STATE = Object.freeze({
    raceRoom: null,
    isLoading: false,
    error: null,
});

function normalizeRaceId(raceId) {
    return String(raceId ?? "").trim();
}

export function useTeacherRaceRoomData(raceId) {
    const normalizedRaceId = useMemo(() => normalizeRaceId(raceId), [raceId]);
    const latestRequestIdRef = useRef(0);

    const [raceRoomState, setRaceRoomState] = useState(INITIAL_RACE_ROOM_STATE);

    const loadRaceRoom = useCallback(async () => {
        const requestId = latestRequestIdRef.current + 1;
        latestRequestIdRef.current = requestId;

        if (!normalizedRaceId) {
            setRaceRoomState({
                raceRoom: null,
                isLoading: false,
                error: null,
            });

            return null;
        }

        setRaceRoomState((currentState) => ({
            ...currentState,
            isLoading: true,
            error: null,
        }));

        try {
            const nextRaceRoom = await getTeacherRaceRoom(normalizedRaceId);

            if (latestRequestIdRef.current === requestId) {
                setRaceRoomState({
                    raceRoom: nextRaceRoom,
                    isLoading: false,
                    error: null,
                });
            }

            return nextRaceRoom;
        } catch (requestError) {
            if (latestRequestIdRef.current === requestId) {
                setRaceRoomState((currentState) => ({
                    ...currentState,
                    isLoading: false,
                    error: requestError,
                }));
            }

            throw requestError;
        }
    }, [normalizedRaceId]);

    useEffect(() => {
        loadRaceRoom().catch(() => {});

        return () => {
            latestRequestIdRef.current += 1;
        };
    }, [loadRaceRoom]);

    return {
        raceRoom: raceRoomState.raceRoom,
        isLoading: raceRoomState.isLoading,
        error: raceRoomState.error,
        hasRaceId: Boolean(normalizedRaceId),
        reloadRaceRoom: loadRaceRoom,
    };
}