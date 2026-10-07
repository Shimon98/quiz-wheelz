import { useEffect } from "react";

import { AUDIO_LOOP_CHANNELS, audioEngine, useSceneMusic } from "../../../shared/audio";
import { GAME_AUDIO } from "../../../shared/gameAudio/gameAudioCatalog";
import { engineRateForSpeed, STUDENT_RACE_SOUND } from "../audio/studentRaceSounds";

export default function useStudentRaceSound({ engineActive, speed }) {
  useSceneMusic(GAME_AUDIO.MUSIC_RACE, STUDENT_RACE_SOUND.raceMusicGain);

  useEffect(() => {
    audioEngine.preload(STUDENT_RACE_SOUND.preloadKeys);
  }, []);

  useEffect(() => {
    if (!engineActive) return undefined;
    return () => audioEngine.stopLoop(AUDIO_LOOP_CHANNELS.ENGINE);
  }, [engineActive]);

  useEffect(() => {
    if (engineActive) {
      audioEngine.startLoop(AUDIO_LOOP_CHANNELS.ENGINE, GAME_AUDIO.HOVER_ENGINE, { rate: engineRateForSpeed(speed) });
    }
  }, [engineActive, speed]);
}
