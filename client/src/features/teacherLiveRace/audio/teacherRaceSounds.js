import { GAME_AUDIO } from "../../../shared/gameAudio/gameAudioCatalog";
import { TEACHER_FEED_KINDS } from "../config/teacherLiveFeedConfig";

export const TEACHER_RACE_SOUND = Object.freeze({
  raceMusicGain: 1,
  roomMusicGain: 0.8,
  preloadKeys: Object.freeze([
    GAME_AUDIO.PROJECTOR_PLAYER_JOINED,
    GAME_AUDIO.PROJECTOR_RACE_START,
    GAME_AUDIO.PROJECTOR_PLAYER_FINISHED,
    GAME_AUDIO.PROJECTOR_RACE_FINISHED,
  ]),
});

const FEED_SOUNDS = Object.freeze({
  [TEACHER_FEED_KINDS.PLAYER_FINISHED]: GAME_AUDIO.PROJECTOR_PLAYER_FINISHED,
  [TEACHER_FEED_KINDS.RACE_FINISHED]: GAME_AUDIO.PROJECTOR_RACE_FINISHED,
});

export function soundForFreshFeedItems(items) {
  const keys = new Set(items.map(({ kind }) => FEED_SOUNDS[kind]).filter(Boolean));
  if (keys.has(GAME_AUDIO.PROJECTOR_RACE_FINISHED)) return GAME_AUDIO.PROJECTOR_RACE_FINISHED;
  return keys.has(GAME_AUDIO.PROJECTOR_PLAYER_FINISHED) ? GAME_AUDIO.PROJECTOR_PLAYER_FINISHED : null;
}
