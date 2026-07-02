import { useTranslation } from "react-i18next";
import { Group, Stack, Text, Title } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import monkeyImage from "../../../assets/landing/landing-hero-monkey.png";

/*
 * Idle animation for the greeting monkey: a gentle float most of the loop,
 * with a quick mischievous wiggle near the end — the "sometimes it moves"
 * surprise. Hovering it makes it lean in. Decorative only (aria-hidden) and
 * fully disabled under reduced motion.
 */
const MONKEY_IDLE = {
  y: [0, -6, 0, 0, 0, 0],
  rotate: [0, 0, 0, -7, 7, 0],
};

const MONKEY_IDLE_TRANSITION = {
  duration: 9,
  times: [0, 0.25, 0.5, 0.82, 0.91, 1],
  repeat: Infinity,
  ease: "easeInOut",
};

export default function TeacherGreetingSection({ name }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const reduce = useReducedMotion();

  return (
    <Group justify="space-between" align="center" wrap="nowrap">
      <Stack gap={4}>
        <Title order={1} fz={{ base: 26, sm: 34 }}>
          {name ? t("greeting.title", { name }) : t("greeting.titleNoName")}
        </Title>
        <Text c="dimmed">{t("greeting.subtitle")}</Text>
      </Stack>

      <motion.img
        src={monkeyImage}
        alt=""
        aria-hidden="true"
        draggable="false"
        style={{ height: 96, width: "auto", flexShrink: 0 }}
        animate={reduce ? undefined : MONKEY_IDLE}
        transition={reduce ? undefined : MONKEY_IDLE_TRANSITION}
        whileHover={reduce ? undefined : { scale: 1.1, rotate: -5 }}
      />
    </Group>
  );
}
