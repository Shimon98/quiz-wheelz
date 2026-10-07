import { useEffect, useRef } from "react";

import { audioEngine, useSceneMusic } from "../../../shared/audio";
import { GAME_AUDIO } from "../../../shared/gameAudio/gameAudioCatalog";
import { soundForFreshFeedItems, TEACHER_RACE_SOUND } from "../audio/teacherRaceSounds";

export default function useTeacherLiveRaceSound({ raceRunning, recentEvents }) {
  useSceneMusic(raceRunning ? GAME_AUDIO.MUSIC_RACE : null, TEACHER_RACE_SOUND.raceMusicGain);
  const previousIdsRef = useRef(null);

  useEffect(() => {
    audioEngine.preload(TEACHER_RACE_SOUND.preloadKeys);
  }, []);

  useEffect(() => {
    const previousIds = previousIdsRef.current;
    previousIdsRef.current = new Set(recentEvents.map(({ id }) => id));
    if (previousIds == null) return;
    const key = soundForFreshFeedItems(recentEvents.filter(({ id }) => !previousIds.has(id)));
    if (key != null) audioEngine.playSfx(key);
  }, [recentEvents]);
}
