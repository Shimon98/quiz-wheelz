import { useTranslation } from "react-i18next";
import {
  Box,
  Loader,
  Stack,
  Text,
  UnstyledButton,
  useDirection,
} from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";
import { LogOut } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import logoutSceneImage from "../../../assets/workspace/logout-monkey.png";

/**
 * WorkspaceNavbarFooter — the logout scene at the bottom of the workspace
 * navbar: ONE decorative image (monkey leaning on a rounded frame, calm
 * leaves at the sides — static, no animation) with a REAL button rendered
 * in code inside the frame's empty interior.
 *
 * Interaction rule: only the inner button is clickable — the monkey, leaves
 * and frame are pointer-events-none decoration, so a stray click near the
 * scene can never log the teacher out.
 */

// The frame's inner hole — TRANSPARENT in the asset (Shimon's edit), so the
// navbar surface shows through and the button sits inside it, slightly
// inset. Measured from the asset's largest enclosed transparent component
// (scratchpad/logout_v3_fix.py prints it: 41.5/35.9/28.4/47.6).
// Re-measure these four numbers if the artwork is ever regenerated.
const FRAME_INTERIOR = {
  left: "42%",
  top: "37.5%",
  width: "27.5%",
  height: "44.5%",
};

export default function WorkspaceNavbarFooter({ onLogout, isLoggingOut }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const { dir } = useDirection();
  const reduce = useReducedMotion();

  return (
    <Box px="xs" pb={4}>
      {/* Percent-positioning is relative to this inner box, which wraps the
          image exactly (no padding here, or the button drifts off-frame). */}
      <Box pos="relative">
        <img
          src={logoutSceneImage}
          alt=""
          aria-hidden="true"
          draggable="false"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            pointerEvents: "none",
          }}
        />

        {/* No hover fill — a rectangular tint never matches the hole's shape
            exactly and looks cut off. Hover feedback = the content itself
            grows slightly instead. */}
        <UnstyledButton
          component={motion.button}
          whileHover={reduce ? undefined : { scale: 1.09 }}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          onClick={onLogout}
          disabled={isLoggingOut}
          style={{
            position: "absolute",
            ...FRAME_INTERIOR,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            color: "var(--mantine-color-red-light-color)",
            borderRadius: "var(--mantine-radius-lg)",
          }}
        >
          <Stack gap={2} align="center" justify="center">
            {isLoggingOut ? (
              <Loader size="xs" color={UI_TONES.DANGER} />
            ) : (
              <LogOut
                size={18}
                aria-hidden="true"
                // Shimon's spec: the exit arrow points RIGHT in Hebrew and
                // LEFT in English (lucide's default arrow points right).
                style={{
                  transform: dir === "ltr" ? "scaleX(-1)" : undefined,
                }}
              />
            )}
            <Text span fz="xs" fw={800} c="inherit">
              {t("nav.logout")}
            </Text>
          </Stack>
        </UnstyledButton>
      </Box>
    </Box>
  );
}
