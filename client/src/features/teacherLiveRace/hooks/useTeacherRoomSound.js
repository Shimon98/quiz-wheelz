import { useEffect, useRef } from "react";

import { audioEngine, useSceneMusic } from "../../../shared/audio";
import { GAME_AUDIO } from "../../../shared/gameAudio/gameAudioCatalog";
import { TEACHER_RACE_SOUND } from "../audio/teacherRaceSounds";

export default function useTeacherRoomSound(players) {
  useSceneMusic(GAME_AUDIO.MUSIC_GAME, TEACHER_RACE_SOUND.roomMusicGain);
  const knownIdsRef = useRef(null);

  useEffect(() => {
    audioEngine.preload(TEACHER_RACE_SOUND.preloadKeys);
  }, []);

  useEffect(() => {
    if (players == null) return;
    const ids = new Set(players.map(({ playerId }) => playerId).filter((id) => id != null));
    const knownIds = knownIdsRef.current;
    knownIdsRef.current = ids;
    if (knownIds != null && [...ids].some((id) => !knownIds.has(id))) {
      audioEngine.playSfx(GAME_AUDIO.PROJECTOR_PLAYER_JOINED);
    }
  }, [players]);
}
