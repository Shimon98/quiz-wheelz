import { PinInput, Stack, Text } from "@mantine/core";

import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import {
  ROOM_CODE_ALLOWED_CHARS,
  ROOM_CODE_LENGTH,
} from "../config/studentJoinConfig";

/*
 * Fluid cell sizing so all 6 cells always fit ONE row on small phones:
 * 100vw minus the page + card padding and the inter-cell gaps (~7rem total
 * budget), split across the cells, capped at a comfy desktop size. Set as
 * width/height directly on the input (Mantine re-sets its own
 * --pin-input-size inline on the root, so overriding the var there loses).
 */
const PIN_CELL_SIZE = `clamp(2.1rem, calc((100vw - 7rem) / ${ROOM_CODE_LENGTH}), 3.25rem)`;
const PIN_CELL_FONT_SIZE = "clamp(1.05rem, 4.5vw, 1.35rem)";
const PIN_CELL_GAP = 6; // px between cells — part of the 7rem budget above

/**
 * RoomCodePinInput — the room-code entry block (label + 6 big cells + inline
 * error). Always LTR (codes are Latin/digits) even inside the Hebrew RTL
 * shell; letters render uppercase to match what the teacher's screen shows.
 * Controlled by the parent form — this component owns only the look.
 */
export default function RoomCodePinInput({ label, value, onChange, error }) {
  return (
    <Stack gap={6} align="center">
      <Text component="label" size="sm" fw={700}>
        {label}
      </Text>

      <PinInput
        length={ROOM_CODE_LENGTH}
        type={ROOM_CODE_ALLOWED_CHARS}
        dir="ltr"
        radius="md"
        gap={PIN_CELL_GAP}
        value={value}
        onChange={onChange}
        error={Boolean(error)}
        aria-label={label}
        styles={{
          input: {
            width: PIN_CELL_SIZE,
            height: PIN_CELL_SIZE,
            fontSize: PIN_CELL_FONT_SIZE,
            fontWeight: 800,
            textTransform: "uppercase",
            borderWidth: "2px",
          },
        }}
      />

      {error && (
        <Text size="xs" c={UI_TONES.DANGER}>
          {error}
        </Text>
      )}
    </Stack>
  );
}
